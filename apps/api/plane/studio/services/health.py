# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from dataclasses import dataclass, field
from datetime import timedelta

from django.db.models import Max
from django.utils import timezone

from plane.db.models import Issue, Module
from plane.studio.models import (
    DecisionStatus,
    HealthStatus,
    PortfolioBucket,
    ReleaseStatus,
    RiskStatus,
    StudioDecision,
    StudioProjectProfile,
    StudioRelease,
    StudioRisk,
)

ACTIVE_BLOCKER_STATUSES = (RiskStatus.OPEN, RiskStatus.MITIGATING, RiskStatus.MONITORING)
DUE_DECISION_STATUSES = (DecisionStatus.DRAFT, DecisionStatus.NEEDS_DECISION, DecisionStatus.REVISIT)
INCOMPLETE_RELEASE_STATUSES = (
    ReleaseStatus.PLANNED,
    ReleaseStatus.SCOPING,
    ReleaseStatus.BUILDING,
    ReleaseStatus.QA,
)


@dataclass(frozen=True)
class HealthSignals:
    portfolio_bucket: str
    lifecycle_stage: str
    focus_statement: str
    cadence_days: int
    progress_expected_since: object | None
    activity_by_source: dict[str, object | None]
    blocker_risk_ids: tuple[str, ...] = ()
    due_decision_ids: tuple[str, ...] = ()
    at_risk_release_ids: tuple[str, ...] = ()
    manual_health: str | None = None
    manual_health_reason: str | None = None
    manual_health_expires_at: object | None = None


@dataclass
class HealthContext:
    activity_by_source: dict[str, dict] = field(default_factory=dict)
    blocker_risk_ids: dict = field(default_factory=dict)
    due_decision_ids: dict = field(default_factory=dict)
    at_risk_release_ids: dict = field(default_factory=dict)


def advancement_expectation(portfolio_bucket, lifecycle_stage, focus_statement):
    """Return (expected, human_reason, reason_code, reason_params).

    The human-readable reason is the legacy Chinese text kept for backward
    compatibility; the frontend translates the stable reason_code instead.
    """
    if portfolio_bucket in (PortfolioBucket.PAUSED, PortfolioBucket.ARCHIVED):
        return (
            False,
            f"{portfolio_bucket} 项目在 {lifecycle_stage} 阶段不要求持续推进",
            "paused_bucket",
            {"portfolio_bucket": portfolio_bucket, "lifecycle_stage": lifecycle_stage},
        )
    if portfolio_bucket == PortfolioBucket.FOCUS:
        return (
            True,
            f"FOCUS 项目在 {lifecycle_stage} 阶段应按更新节奏推进",
            "focus_bucket_expected",
            {"portfolio_bucket": portfolio_bucket, "lifecycle_stage": lifecycle_stage},
        )
    if focus_statement.strip():
        return (
            True,
            f"{lifecycle_stage} 阶段已有明确 Focus，因此应按更新节奏推进",
            "focus_statement_expected",
            {"lifecycle_stage": lifecycle_stage},
        )
    return (
        False,
        f"{portfolio_bucket} 项目在 {lifecycle_stage} 阶段尚未被标记为当前推进重点",
        "not_marked_to_advance",
        {"portfolio_bucket": portfolio_bucket, "lifecycle_stage": lifecycle_stage},
    )


def _iso(value):
    return value.isoformat() if value is not None else None


def _latest(values):
    candidates = [value for value in values if value is not None]
    return max(candidates) if candidates else None


def compute_health(signals: HealthSignals, now=None):
    now = now or timezone.now()
    expected_to_advance, expectation_reason, expectation_code, expectation_params = advancement_expectation(
        signals.portfolio_bucket,
        signals.lifecycle_stage,
        signals.focus_statement,
    )
    latest_activity = _latest(signals.activity_by_source.values())
    cadence_anchor = None
    if expected_to_advance:
        cadence_anchor = _latest((signals.progress_expected_since, latest_activity))
    next_update_due_at = cadence_anchor + timedelta(days=signals.cadence_days) if cadence_anchor is not None else None

    evidence = {
        "portfolio_bucket": signals.portfolio_bucket,
        "lifecycle_stage": signals.lifecycle_stage,
        "focus_statement": signals.focus_statement,
        "expectation_reason": expectation_reason,
        "activity_by_source": {source: _iso(value) for source, value in signals.activity_by_source.items()},
        "blocker_risk_ids": list(signals.blocker_risk_ids),
        "due_decision_ids": list(signals.due_decision_ids),
        "at_risk_release_ids": list(signals.at_risk_release_ids),
    }

    reason_codes: list[str] = []
    reason_params: dict = {}
    reasons: list[str] = []
    if signals.portfolio_bucket in (PortfolioBucket.PAUSED, PortfolioBucket.ARCHIVED):
        computed_status = HealthStatus.PAUSED
        reason = expectation_reason
        reason_codes = [expectation_code]
        reason_params = dict(expectation_params)
    elif signals.blocker_risk_ids:
        computed_status = HealthStatus.BLOCKED
        reason_codes = ["blocked_by_risks"]
        reason_params = {"blocker_count": len(signals.blocker_risk_ids)}
        reason = f"存在 {len(signals.blocker_risk_ids)} 项未解决的 blocker 风险"
    elif signals.due_decision_ids or signals.at_risk_release_ids:
        computed_status = HealthStatus.AT_RISK
        if signals.due_decision_ids:
            reason_codes.append("due_decisions")
            reason_params["due_decision_count"] = len(signals.due_decision_ids)
            reasons.append(f"存在 {len(signals.due_decision_ids)} 项到期未决事项")
        if signals.at_risk_release_ids:
            reason_codes.append("at_risk_releases")
            reason_params["at_risk_release_count"] = len(signals.at_risk_release_ids)
            reasons.append(f"存在 {len(signals.at_risk_release_ids)} 个临近目标但尚未就绪的发布")
        reason = "；".join(reasons)
    elif expected_to_advance and next_update_due_at is not None and next_update_due_at < now:
        computed_status = HealthStatus.STALE
        reason_codes = ["stale_beyond_cadence"]
        reason_params = {"lifecycle_stage": signals.lifecycle_stage, "cadence_days": signals.cadence_days}
        reason = f"{signals.lifecycle_stage} 阶段的推进重点已超过 {signals.cadence_days} 天未发生有效活动"
    else:
        computed_status = HealthStatus.ON_TRACK
        if expected_to_advance:
            reason = "当前推进节奏正常"
            reason_codes = ["on_track_cadence_normal"]
            reason_params = {}
        else:
            reason = expectation_reason
            reason_codes = [expectation_code]
            reason_params = dict(expectation_params)

    manual_is_valid = bool(
        computed_status != HealthStatus.PAUSED
        and signals.manual_health
        and signals.manual_health_reason
        and signals.manual_health_reason.strip()
        and (signals.manual_health_expires_at is None or signals.manual_health_expires_at > now)
    )
    status = signals.manual_health if manual_is_valid else computed_status
    effective_reason = signals.manual_health_reason.strip() if manual_is_valid else reason
    # A manual override reason is user input, shown verbatim by the UI; every other
    # effective reason is server-generated and translated from its stable code.
    if manual_is_valid:
        effective_reason_codes: list[str] = ["manual_override"]
        effective_reason_params: dict = {}
    else:
        effective_reason_codes = list(reason_codes)
        effective_reason_params = dict(reason_params)

    return {
        "status": status,
        "computed_status": computed_status,
        "computed_reason": reason,
        "reason": effective_reason,
        "reason_code": effective_reason_codes[0] if effective_reason_codes else None,
        "reason_codes": effective_reason_codes,
        "reason_params": effective_reason_params,
        "reasons": [effective_reason] if effective_reason else [],
        "is_manual": manual_is_valid,
        "expected_to_advance": expected_to_advance,
        "cadence_days": signals.cadence_days,
        "progress_expected_since": _iso(signals.progress_expected_since),
        "last_meaningful_activity_at": _iso(latest_activity),
        "next_update_due_at": _iso(next_update_due_at),
        "evaluated_at": _iso(now),
        "evidence": evidence,
    }


def _latest_by_project(queryset):
    return {
        row["project_id"]: row["latest"] for row in queryset.values("project_id").annotate(latest=Max("updated_at"))
    }


def _ids_by_project(queryset):
    result = {}
    for project_id, object_id in queryset.values_list("project_id", "id"):
        result.setdefault(project_id, []).append(str(object_id))
    return {project_id: tuple(values) for project_id, values in result.items()}


def build_health_context(project_ids, now=None):
    now = now or timezone.now()
    project_ids = list(project_ids)
    if not project_ids:
        return HealthContext()

    activity_by_source = {
        "plane_work_item": _latest_by_project(Issue.issue_objects.filter(project_id__in=project_ids)),
        "plane_module": _latest_by_project(Module.objects.filter(project_id__in=project_ids)),
        "studio_release": _latest_by_project(StudioRelease.objects.filter(project_id__in=project_ids)),
        "studio_decision": _latest_by_project(StudioDecision.objects.filter(project_id__in=project_ids)),
        "studio_risk": _latest_by_project(StudioRisk.objects.filter(project_id__in=project_ids)),
    }
    blocker_risk_ids = _ids_by_project(
        StudioRisk.objects.filter(
            project_id__in=project_ids,
            is_blocker=True,
            status__in=ACTIVE_BLOCKER_STATUSES,
        )
    )
    due_decision_ids = _ids_by_project(
        StudioDecision.objects.filter(
            project_id__in=project_ids,
            status__in=DUE_DECISION_STATUSES,
            due_at__isnull=False,
            due_at__lte=now,
        )
    )
    at_risk_release_ids = _ids_by_project(
        StudioRelease.objects.filter(
            project_id__in=project_ids,
            status__in=INCOMPLETE_RELEASE_STATUSES,
            target_at__isnull=False,
            target_at__lte=now + timedelta(days=7),
        )
    )
    return HealthContext(
        activity_by_source=activity_by_source,
        blocker_risk_ids=blocker_risk_ids,
        due_decision_ids=due_decision_ids,
        at_risk_release_ids=at_risk_release_ids,
    )


def evaluate_project_health(project, profile: StudioProjectProfile, context=None, now=None):
    now = now or timezone.now()
    context = context or build_health_context([project.id], now=now)
    activity = {
        "explicit_operating_update": profile.last_meaningful_activity_at,
        **{source: values.get(project.id) for source, values in context.activity_by_source.items()},
    }
    signals = HealthSignals(
        portfolio_bucket=profile.portfolio_bucket,
        lifecycle_stage=profile.lifecycle_stage,
        focus_statement=profile.focus_statement,
        cadence_days=profile.expected_update_interval_days,
        progress_expected_since=profile.progress_expected_since,
        activity_by_source=activity,
        blocker_risk_ids=context.blocker_risk_ids.get(project.id, ()),
        due_decision_ids=context.due_decision_ids.get(project.id, ()),
        at_risk_release_ids=context.at_risk_release_ids.get(project.id, ()),
        manual_health=profile.manual_health,
        manual_health_reason=profile.manual_health_reason,
        manual_health_expires_at=profile.manual_health_expires_at,
    )
    return compute_health(signals, now=now)

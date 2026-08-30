# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from django.db.models import Count, Max, Q
from django.utils import timezone

from plane.db.models import Cycle, Issue, Module
from plane.studio.models import (
    DecisionStatus,
    LifecycleStage,
    OperatingPriority,
    PortfolioBucket,
    ProductType,
    ReleaseStatus,
    StudioDecision,
    StudioProjectProfile,
    StudioRelease,
    StudioRisk,
)
from plane.studio.permissions import permission_summary, visible_projects_for
from plane.studio.serializers import (
    StudioDecisionSerializer,
    StudioProjectProfileSerializer,
    StudioReleaseSerializer,
    StudioRiskSerializer,
)
from plane.studio.services.health import build_health_context, evaluate_project_health

BUCKET_ORDER = {
    PortfolioBucket.FOCUS: 0,
    PortfolioBucket.NEXT: 1,
    PortfolioBucket.INCUBATING: 2,
    PortfolioBucket.KEEP_ALIVE: 3,
    PortfolioBucket.PAUSED: 4,
    PortfolioBucket.ARCHIVED: 5,
}
PRIORITY_ORDER = {
    OperatingPriority.P0: 0,
    OperatingPriority.P1: 1,
    OperatingPriority.P2: 2,
    OperatingPriority.P3: 3,
}
ATTENTION_HEALTH = {"BLOCKED", "AT_RISK", "STALE"}
PENDING_DECISION_STATUSES = (
    DecisionStatus.DRAFT,
    DecisionStatus.NEEDS_DECISION,
    DecisionStatus.REVISIT,
)
TERMINAL_RELEASE_STATUSES = (
    ReleaseStatus.RELEASED,
    ReleaseStatus.ROLLED_BACK,
    ReleaseStatus.CANCELLED,
)


def project_payload(project):
    return {
        "id": str(project.id),
        "name": project.name,
        "identifier": project.identifier,
        "description": project.description,
        "logo_props": project.logo_props,
        "project_lead_id": str(project.project_lead_id) if project.project_lead_id else None,
        "archived_at": project.archived_at.isoformat() if project.archived_at else None,
        "network": project.network,
    }


def _profile_payload(project, profile, health):
    if profile is None:
        return None
    return StudioProjectProfileSerializer(
        profile,
        context={"project": project, "health": health},
    ).data


def _attention_payload(project_id, health, health_context):
    if health is not None:
        if health["status"] not in ATTENTION_HEALTH:
            return None
        # Manual override reasons are user input: mark them so the UI shows the
        # text verbatim instead of translating "manual_override" as a template.
        if health["is_manual"]:
            reason_codes = ["manual_override"]
            reason_params = {}
        else:
            reason_codes = list(health["reason_codes"])
            reason_params = dict(health["reason_params"])
        return {
            "status": health["status"],
            "reason": health["reason"],
            "reason_code": reason_codes[0] if reason_codes else None,
            "reason_codes": reason_codes,
            "reason_params": reason_params,
            "is_manual": bool(health["is_manual"]),
            "evidence": health["evidence"],
        }

    blocker_ids = health_context.blocker_risk_ids.get(project_id, ())
    due_decision_ids = health_context.due_decision_ids.get(project_id, ())
    release_ids = health_context.at_risk_release_ids.get(project_id, ())
    if blocker_ids:
        return {
            "status": "BLOCKED",
            "reason": f"存在 {len(blocker_ids)} 项未解决的 blocker 风险；配置项目画像后可获得完整健康判断",
            "reason_code": "blocked_by_risks",
            "reason_codes": ["blocked_by_risks", "profile_not_configured"],
            "reason_params": {"blocker_count": len(blocker_ids)},
            "evidence": {
                "blocker_risk_ids": list(blocker_ids),
                "due_decision_ids": list(due_decision_ids),
                "at_risk_release_ids": list(release_ids),
                "profile_configured": False,
            },
        }
    if due_decision_ids or release_ids:
        reasons = []
        reason_codes = []
        reason_params = {}
        if due_decision_ids:
            reasons.append(f"存在 {len(due_decision_ids)} 项到期未决事项")
            reason_codes.append("due_decisions")
            reason_params["due_decision_count"] = len(due_decision_ids)
        if release_ids:
            reasons.append(f"存在 {len(release_ids)} 个临近目标但尚未就绪的发布")
            reason_codes.append("at_risk_releases")
            reason_params["at_risk_release_count"] = len(release_ids)
        return {
            "status": "AT_RISK",
            "reason": f"{'；'.join(reasons)}；配置项目画像后可获得完整健康判断",
            "reason_code": reason_codes[0],
            "reason_codes": reason_codes + ["profile_not_configured"],
            "reason_params": reason_params,
            "evidence": {
                "blocker_risk_ids": [],
                "due_decision_ids": list(due_decision_ids),
                "at_risk_release_ids": list(release_ids),
                "profile_configured": False,
            },
        }
    return None


def _project_rows(projects, profiles, health_context, now):
    rows = []
    for project in projects:
        profile = profiles.get(project.id)
        health = evaluate_project_health(project, profile, context=health_context, now=now) if profile else None
        rows.append(
            {
                "project": project_payload(project),
                "profile": _profile_payload(project, profile, health),
                "health": health,
                "attention": _attention_payload(
                    project.id,
                    health,
                    health_context,
                ),
            }
        )
    rows.sort(
        key=lambda row: (
            BUCKET_ORDER.get(
                row["profile"]["portfolio_bucket"] if row["profile"] else None,
                99,
            ),
            PRIORITY_ORDER.get(row["profile"]["priority"] if row["profile"] else None, 99),
            row["project"]["name"].lower(),
        )
    )
    return rows


def _visible_studio_decisions(user, slug, project_ids):
    return StudioDecision.objects.filter(workspace__slug=slug).filter(
        Q(project__isnull=True) | Q(project_id__in=project_ids)
    )


def _with_project(serialized, project):
    result = dict(serialized)
    result["project"] = project_payload(project) if project else None
    return result


def _cross_project_work(user, project_ids):
    issues = (
        Issue.issue_objects.filter(
            project_id__in=project_ids,
            assignees=user,
        )
        .exclude(state__group__in=("completed", "cancelled"))
        .select_related("project", "state")
        .order_by("target_date", "-updated_at")
        .distinct()[:12]
    )
    return [
        {
            "id": str(issue.id),
            "name": issue.name,
            "sequence_id": issue.sequence_id,
            "project_id": str(issue.project_id),
            "project_name": issue.project.name,
            "project_identifier": issue.project.identifier,
            "priority": issue.priority,
            "state": (
                {
                    "id": str(issue.state_id),
                    "name": issue.state.name,
                    "group": issue.state.group,
                    "color": issue.state.color,
                }
                if issue.state
                else None
            ),
            "target_date": issue.target_date.isoformat() if issue.target_date else None,
            "updated_at": issue.updated_at.isoformat(),
        }
        for issue in issues
    ]


def today_projection(user, slug, now=None):
    now = now or timezone.now()
    projects = list(
        visible_projects_for(user, slug)
        .filter(archived_at__isnull=True)
        .select_related("project_lead")
        .order_by("name")
    )
    project_ids = [project.id for project in projects]
    project_by_id = {project.id: project for project in projects}
    profiles = {
        profile.project_id: profile
        for profile in StudioProjectProfile.objects.filter(project_id__in=project_ids).select_related(
            "operator", "project"
        )
    }
    health_context = build_health_context(project_ids, now=now)
    project_rows = _project_rows(projects, profiles, health_context, now)
    focus_projects = [
        row for row in project_rows if row["profile"] and row["profile"]["portfolio_bucket"] == PortfolioBucket.FOCUS
    ]
    needs_attention = [row for row in project_rows if row["attention"] is not None]

    upcoming_releases = list(
        StudioRelease.objects.filter(
            project_id__in=project_ids,
            target_at__isnull=False,
            target_at__gte=now,
            target_at__lte=now + timedelta(days=14),
        )
        .exclude(status__in=TERMINAL_RELEASE_STATUSES)
        .select_related("project", "module")
        .order_by("target_at")[:10]
    )
    decisions = list(
        _visible_studio_decisions(user, slug, project_ids)
        .filter(status__in=PENDING_DECISION_STATUSES)
        .select_related("project", "proposer")
        .order_by("due_at", "-created_at")[:10]
    )

    focus_warning_code = "focus_limit" if len(focus_projects) > 3 else None
    return {
        "focus_projects": focus_projects,
        "focus_warning": (
            f"当前重点项目已达 {len(focus_projects)} 个，建议重新确认注意力分配。" if len(focus_projects) > 3 else None
        ),
        "focus_warning_code": focus_warning_code,
        "focus_warning_params": {"count": len(focus_projects)} if focus_warning_code else None,
        "needs_attention": needs_attention,
        "upcoming_releases": [
            _with_project(StudioReleaseSerializer(release).data, project_by_id[release.project_id])
            for release in upcoming_releases
        ],
        "pending_decisions": [
            _with_project(
                StudioDecisionSerializer(decision).data,
                project_by_id.get(decision.project_id),
            )
            for decision in decisions
        ],
        "cross_project_work": _cross_project_work(user, project_ids),
        "permissions": permission_summary(user, slug),
        "generated_at": now.isoformat(),
    }


def portfolio_projection(user, slug, now=None):
    now = now or timezone.now()
    projects = list(
        visible_projects_for(user, slug)
        .filter(archived_at__isnull=True)
        .select_related("project_lead")
        .order_by("name")
    )
    project_ids = [project.id for project in projects]
    profiles = {
        profile.project_id: profile
        for profile in StudioProjectProfile.objects.filter(project_id__in=project_ids).select_related(
            "operator", "project"
        )
    }
    health_context = build_health_context(project_ids, now=now)
    return {
        "projects": _project_rows(projects, profiles, health_context, now),
        "available_filters": {
            "product_types": list(ProductType.values),
            "portfolio_buckets": list(PortfolioBucket.values),
            "lifecycle_stages": list(LifecycleStage.values),
            "priorities": list(OperatingPriority.values),
            "health_statuses": ["ON_TRACK", "AT_RISK", "BLOCKED", "STALE", "PAUSED"],
        },
        "permissions": permission_summary(user, slug),
        "generated_at": now.isoformat(),
    }


def _work_summary(project, now):
    work_item_groups = {
        row["state__group"]: row["count"]
        for row in Issue.issue_objects.filter(project=project).values("state__group").annotate(count=Count("id"))
    }
    total_work_items = sum(work_item_groups.values())
    cycle_query = Cycle.objects.filter(project=project, archived_at__isnull=True)
    module_query = Module.objects.filter(project=project, archived_at__isnull=True)
    active_cycles = cycle_query.filter(
        start_date__isnull=False,
        end_date__isnull=False,
        start_date__lte=now,
        end_date__gte=now,
    ).count()
    active_modules = module_query.exclude(status__in=("completed", "cancelled")).count()
    last_work_item_activity = Issue.issue_objects.filter(project=project).aggregate(latest=Max("updated_at"))["latest"]
    return {
        "work_items": {
            "total": total_work_items,
            "backlog": work_item_groups.get("backlog", 0),
            "unstarted": work_item_groups.get("unstarted", 0),
            "started": work_item_groups.get("started", 0),
            "completed": work_item_groups.get("completed", 0),
            "cancelled": work_item_groups.get("cancelled", 0),
        },
        "cycles": {"total": cycle_query.count(), "active": active_cycles},
        "modules": {"total": module_query.count(), "active": active_modules},
        "last_work_item_activity_at": (last_work_item_activity.isoformat() if last_work_item_activity else None),
    }


def project_overview_projection(user, slug, project, now=None):
    now = now or timezone.now()
    profile = StudioProjectProfile.objects.filter(project=project).select_related("operator", "project").first()
    health = None
    if profile:
        context = build_health_context([project.id], now=now)
        health = evaluate_project_health(project, profile, context=context, now=now)
    releases = StudioRelease.objects.filter(project=project).select_related("module")
    decisions = StudioDecision.objects.filter(project=project).select_related("proposer")
    risks = StudioRisk.objects.filter(project=project).select_related("owner")
    return {
        "project": project_payload(project),
        "profile": _profile_payload(project, profile, health),
        "health": health,
        "work_summary": _work_summary(project, now),
        "releases": StudioReleaseSerializer(releases, many=True).data,
        "decisions": StudioDecisionSerializer(decisions, many=True).data,
        "risks": StudioRiskSerializer(risks, many=True).data,
        "permissions": permission_summary(user, slug, project_id=project.id),
        "generated_at": now.isoformat(),
    }

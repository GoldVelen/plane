from datetime import datetime, timedelta, timezone

import pytest

from plane.studio.services.health import HealthSignals, compute_health

NOW = datetime(2026, 8, 30, 12, 0, tzinfo=timezone.utc)


def signals(**overrides):
    values = {
        "portfolio_bucket": "FOCUS",
        "lifecycle_stage": "BUILD",
        "focus_statement": "Ship the next usable slice",
        "cadence_days": 7,
        "progress_expected_since": NOW - timedelta(days=3),
        "activity_by_source": {
            "explicit_operating_update": NOW - timedelta(days=2),
            "plane_work_item": None,
            "plane_module": None,
            "studio_release": None,
            "studio_decision": None,
            "studio_risk": None,
        },
    }
    values.update(overrides)
    return HealthSignals(**values)


@pytest.mark.parametrize(
    ("bucket", "lifecycle"),
    [
        ("INCUBATING", "RESEARCH"),
        ("NEXT", "DESIGN"),
        ("KEEP_ALIVE", "LIVE"),
        ("KEEP_ALIVE", "MAINTENANCE"),
    ],
)
def test_inactivity_does_not_stale_projects_that_are_not_expected_to_advance(bucket, lifecycle):
    result = compute_health(
        signals(
            portfolio_bucket=bucket,
            lifecycle_stage=lifecycle,
            focus_statement="",
            progress_expected_since=NOW - timedelta(days=180),
            activity_by_source={"plane_work_item": NOW - timedelta(days=180)},
        ),
        now=NOW,
    )

    assert result["status"] == "ON_TRACK"
    assert result["expected_to_advance"] is False


@pytest.mark.parametrize("bucket", ["PAUSED", "ARCHIVED"])
def test_paused_and_archived_never_generate_stale(bucket):
    result = compute_health(
        signals(
            portfolio_bucket=bucket,
            progress_expected_since=NOW - timedelta(days=180),
            activity_by_source={"plane_work_item": NOW - timedelta(days=180)},
        ),
        now=NOW,
    )

    assert result["status"] == "PAUSED"
    assert result["computed_status"] == "PAUSED"
    assert result["expected_to_advance"] is False


def test_focus_project_becomes_stale_only_after_its_cadence_anchor_is_missed():
    stale = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=20),
            activity_by_source={"plane_work_item": NOW - timedelta(days=10)},
        ),
        now=NOW,
    )
    new_expectation = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=1),
            activity_by_source={"plane_work_item": NOW - timedelta(days=90)},
        ),
        now=NOW,
    )

    assert stale["status"] == "STALE"
    assert new_expectation["status"] == "ON_TRACK"


def test_explicit_focus_makes_an_incubating_project_subject_to_cadence():
    result = compute_health(
        signals(
            portfolio_bucket="INCUBATING",
            lifecycle_stage="RESEARCH",
            focus_statement="Validate retention with ten users",
            progress_expected_since=NOW - timedelta(days=15),
            activity_by_source={},
        ),
        now=NOW,
    )

    assert result["status"] == "STALE"
    assert result["expected_to_advance"] is True


def test_blocker_and_due_governance_signals_precede_stale():
    blocked = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            blocker_risk_ids=("risk-1",),
            due_decision_ids=("decision-1",),
        ),
        now=NOW,
    )
    at_risk = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            due_decision_ids=("decision-1",),
        ),
        now=NOW,
    )

    assert blocked["status"] == "BLOCKED"
    assert at_risk["status"] == "AT_RISK"


def test_valid_manual_override_wins_but_keeps_computed_evidence():
    result = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            manual_health="ON_TRACK",
            manual_health_reason="Launch is intentionally waiting for external review",
            manual_health_expires_at=NOW + timedelta(days=2),
        ),
        now=NOW,
    )

    assert result["status"] == "ON_TRACK"
    assert result["computed_status"] == "STALE"
    assert result["is_manual"] is True
    assert result["evidence"]["lifecycle_stage"] == "BUILD"


def test_expired_manual_override_falls_back_to_computed_health():
    result = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            manual_health="ON_TRACK",
            manual_health_reason="Temporary exception",
            manual_health_expires_at=NOW - timedelta(seconds=1),
        ),
        now=NOW,
    )

    assert result["status"] == "STALE"
    assert result["is_manual"] is False


def _assert_json_safe(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return
    if isinstance(value, dict):
        for item in value.values():
            _assert_json_safe(item)
        return
    if isinstance(value, (list, tuple)):
        for item in value:
            _assert_json_safe(item)
        return
    raise AssertionError(f"reason_params contains a non JSON-safe value: {value!r}")


@pytest.mark.parametrize(
    ("overrides", "expected_status", "expected_code"),
    [
        # PAUSED: bucket overrides any inactivity signal.
        (
            {"portfolio_bucket": "PAUSED", "progress_expected_since": NOW - timedelta(days=180)},
            "PAUSED",
            "paused_bucket",
        ),
        # BLOCKED: open blocker risk wins over cadence.
        (
            {"progress_expected_since": NOW - timedelta(days=30), "blocker_risk_ids": ("risk-1",)},
            "BLOCKED",
            "blocked_by_risks",
        ),
        # AT_RISK: overdue decisions and near-target incomplete releases.
        (
            {
                "progress_expected_since": NOW - timedelta(days=30),
                "due_decision_ids": ("decision-1", "decision-2"),
                "at_risk_release_ids": ("release-1",),
            },
            "AT_RISK",
            "due_decisions",
        ),
        # STALE: expected to advance, cadence missed.
        (
            {
                "progress_expected_since": NOW - timedelta(days=20),
                "activity_by_source": {"plane_work_item": NOW - timedelta(days=10)},
            },
            "STALE",
            "stale_beyond_cadence",
        ),
        # ON_TRACK while expected to advance.
        ({"progress_expected_since": NOW - timedelta(days=1)}, "ON_TRACK", "on_track_cadence_normal"),
        # ON_TRACK while not expected to advance (inactivity alone is exempt).
        (
            {
                "portfolio_bucket": "INCUBATING",
                "focus_statement": "",
                "progress_expected_since": NOW - timedelta(days=180),
                "activity_by_source": {"plane_work_item": NOW - timedelta(days=180)},
            },
            "ON_TRACK",
            "not_marked_to_advance",
        ),
    ],
)
def test_computed_health_branches_expose_stable_reason_codes(overrides, expected_status, expected_code):
    result = compute_health(signals(**overrides), now=NOW)

    assert result["status"] == expected_status
    assert result["is_manual"] is False
    assert result["reason_code"] == expected_code
    assert result["reason_codes"][0] == expected_code
    # The legacy human-readable reason stays populated for old callers.
    assert result["reason"]
    assert result["reason"] == result["reasons"][0]
    _assert_json_safe(result["reason_params"])


def test_reason_params_carry_branch_specific_values():
    blocked = compute_health(
        signals(progress_expected_since=NOW - timedelta(days=30), blocker_risk_ids=("risk-1", "risk-2"), activity_by_source={}),
        now=NOW,
    )
    stale = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=20),
            activity_by_source={"plane_work_item": NOW - timedelta(days=10)},
        ),
        now=NOW,
    )

    assert blocked["reason_params"] == {"blocker_count": 2}
    assert stale["reason_params"] == {"lifecycle_stage": "BUILD", "cadence_days": 7}


def test_manual_override_reason_code_marks_user_input():
    result = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            manual_health="ON_TRACK",
            manual_health_reason="Launch is intentionally waiting for external review",
            manual_health_expires_at=NOW + timedelta(days=2),
        ),
        now=NOW,
    )

    assert result["is_manual"] is True
    assert result["reason_code"] == "manual_override"
    assert result["reason_codes"] == ["manual_override"]
    assert result["reason_params"] == {}
    # The user's own words are preserved verbatim as the effective reason.
    assert result["reason"] == "Launch is intentionally waiting for external review"


def test_at_risk_reason_codes_cover_both_governance_sources():
    result = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            due_decision_ids=("decision-1",),
            at_risk_release_ids=("release-1",),
        ),
        now=NOW,
    )

    assert result["status"] == "AT_RISK"
    assert result["reason_codes"] == ["due_decisions", "at_risk_releases"]
    assert result["reason_params"] == {"due_decision_count": 1, "at_risk_release_count": 1}


def test_attention_payload_from_computed_health_carries_reason_codes():
    from plane.studio.services.projections import _attention_payload

    health = compute_health(
        signals(progress_expected_since=NOW - timedelta(days=30), blocker_risk_ids=("risk-1",), activity_by_source={}),
        now=NOW,
    )

    attention = _attention_payload("project-1", health, health_context=None)

    assert attention is not None
    assert attention["status"] == "BLOCKED"
    assert attention["is_manual"] is False
    assert attention["reason_code"] == "blocked_by_risks"
    assert attention["reason_codes"] == ["blocked_by_risks"]
    assert attention["reason_params"] == {"blocker_count": 1}
    _assert_json_safe(attention["reason_params"])


def test_attention_payload_marks_manual_override_as_user_input():
    from plane.studio.services.projections import _attention_payload

    health = compute_health(
        signals(
            progress_expected_since=NOW - timedelta(days=30),
            activity_by_source={},
            manual_health="STALE",
            manual_health_reason="Deliberate pause pending external audit",
            manual_health_expires_at=NOW + timedelta(days=2),
        ),
        now=NOW,
    )

    attention = _attention_payload("project-1", health, health_context=None)

    assert attention is not None
    assert attention["is_manual"] is True
    assert attention["reason_codes"] == ["manual_override"]
    assert attention["reason_params"] == {}
    assert attention["reason"] == "Deliberate pause pending external audit"


def test_attention_payload_for_unconfigured_profile_lists_codes():
    from plane.studio.services.health import HealthContext
    from plane.studio.services.projections import _attention_payload

    context = HealthContext(
        blocker_risk_ids={"project-1": ("risk-1", "risk-2")},
    )

    attention = _attention_payload("project-1", None, context)

    assert attention is not None
    assert attention["status"] == "BLOCKED"
    assert attention["reason_codes"] == ["blocked_by_risks", "profile_not_configured"]
    assert attention["reason_params"] == {"blocker_count": 2}


def test_attention_payload_returns_none_for_healthy_project():
    from plane.studio.services.projections import _attention_payload

    health = compute_health(signals(progress_expected_since=NOW - timedelta(days=1)), now=NOW)

    assert _attention_payload("project-1", health, health_context=None) is None

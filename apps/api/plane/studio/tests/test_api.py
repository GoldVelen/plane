from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.studio.models import (
    StudioDecision,
    StudioProjectProfile,
    StudioRelease,
    StudioRisk,
)

pytestmark = pytest.mark.django_db


def project_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/projects/{context.project.id}/{suffix}"


def test_profile_patch_is_real_upsert_and_requires_manual_override_reason(studio_client, studio_context):
    response = studio_client.patch(
        project_url(studio_context, "profile/"),
        {
            "product_type": "WEB_APP",
            "portfolio_bucket": "FOCUS",
            "lifecycle_stage": "BUILD",
            "priority": "P0",
            "focus_statement": "Ship the portfolio view",
            "expected_update_interval_days": 7,
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["portfolio_bucket"] == "FOCUS"
    assert response.data["progress_expected_since"] is not None
    assert response.data["health"]["status"] == "ON_TRACK"
    assert StudioProjectProfile.objects.filter(project=studio_context.project).count() == 1
    assert StudioProjectProfile._meta.db_table == "studio_project_profiles"

    invalid_override = studio_client.patch(
        project_url(studio_context, "profile/"),
        {"manual_health": "AT_RISK", "manual_health_reason": ""},
        format="json",
    )
    assert invalid_override.status_code == 400
    assert "manual_health_reason" in invalid_override.data


def test_profile_patch_resets_progress_anchor_only_when_advancement_expectation_is_redefined(
    studio_client, studio_context
):
    initial = studio_client.patch(
        project_url(studio_context, "profile/"),
        {
            "portfolio_bucket": "FOCUS",
            "lifecycle_stage": "BUILD",
            "focus_statement": "Ship the first usable slice",
            "expected_update_interval_days": 7,
        },
        format="json",
    )
    assert initial.status_code == 200

    profile = StudioProjectProfile.objects.get(project=studio_context.project)
    old_anchor = timezone.now() - timedelta(days=30)
    profile.progress_expected_since = old_anchor
    profile.save(update_fields=["progress_expected_since"])

    unrelated = studio_client.patch(
        project_url(studio_context, "profile/"),
        {"priority": "P1"},
        format="json",
    )
    assert unrelated.status_code == 200
    assert StudioProjectProfile.objects.get(project=studio_context.project).progress_expected_since == old_anchor

    same_value = studio_client.patch(
        project_url(studio_context, "profile/"),
        {"focus_statement": "Ship the first usable slice"},
        format="json",
    )
    assert same_value.status_code == 200
    assert StudioProjectProfile.objects.get(project=studio_context.project).progress_expected_since == old_anchor

    redefined_focus = studio_client.patch(
        project_url(studio_context, "profile/"),
        {"focus_statement": "Unblock portfolio health review"},
        format="json",
    )
    assert redefined_focus.status_code == 200
    assert redefined_focus.data["progress_expected_since"] != old_anchor.isoformat()
    redefined_anchor = StudioProjectProfile.objects.get(project=studio_context.project).progress_expected_since
    assert redefined_anchor is not None
    assert redefined_anchor > old_anchor

    reset_again = timezone.now() - timedelta(days=45)
    profile = StudioProjectProfile.objects.get(project=studio_context.project)
    profile.portfolio_bucket = "NEXT"
    profile.lifecycle_stage = "RESEARCH"
    profile.focus_statement = ""
    profile.progress_expected_since = reset_again
    profile.save(
        update_fields=[
            "portfolio_bucket",
            "lifecycle_stage",
            "focus_statement",
            "progress_expected_since",
        ]
    )

    false_to_true = studio_client.patch(
        project_url(studio_context, "profile/"),
        {"focus_statement": "Validate the next increment"},
        format="json",
    )
    assert false_to_true.status_code == 200
    assert false_to_true.data["progress_expected_since"] != reset_again.isoformat()
    assert false_to_true.data["health"]["expected_to_advance"] is True


def test_release_decision_and_risk_basic_crud_persist_studio_rows(studio_client, studio_context, mocker):
    mocker.patch("plane.db.mixins.soft_delete_related_objects.delay")
    release_response = studio_client.post(
        project_url(studio_context, "releases/"),
        {
            "name": "First beta",
            "version": "1.0.0-beta.1",
            "channel": "BETA",
            "status": "PLANNED",
            "target_at": (timezone.now() + timedelta(days=5)).isoformat(),
            "scope_summary": "Validate the native Plane extension.",
        },
        format="json",
    )
    assert release_response.status_code == 201
    release_id = release_response.data["id"]
    assert StudioRelease.objects.get(id=release_id).workspace == studio_context.workspace
    assert StudioRelease._meta.db_table == "studio_releases"

    release_update = studio_client.patch(
        project_url(studio_context, f"releases/{release_id}/"),
        {"status": "SCOPING"},
        format="json",
    )
    assert release_update.status_code == 200
    assert release_update.data["status"] == "SCOPING"

    decision_response = studio_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/",
        {
            "project_id": str(studio_context.project.id),
            "title": "Choose the first operating slice",
            "question": "Which cross-project view should ship first?",
            "status": "NEEDS_DECISION",
            "due_at": (timezone.now() + timedelta(days=2)).isoformat(),
        },
        format="json",
    )
    assert decision_response.status_code == 201
    decision_id = decision_response.data["id"]
    assert StudioDecision.objects.get(id=decision_id).proposer == studio_context.admin
    assert StudioDecision._meta.db_table == "studio_decisions"

    decision_update = studio_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/",
        {"status": "DECIDED", "final_decision": "Ship Today first."},
        format="json",
    )
    assert decision_update.status_code == 200
    assert decision_update.data["final_decision"] == "Ship Today first."

    risk_response = studio_client.post(
        project_url(studio_context, "risks/"),
        {
            "type": "DELIVERY",
            "title": "Visual gate may slip",
            "probability": 3,
            "impact": 4,
            "is_blocker": True,
            "status": "OPEN",
        },
        format="json",
    )
    assert risk_response.status_code == 201
    risk_id = risk_response.data["id"]
    assert risk_response.data["score"] == 12
    assert StudioRisk._meta.db_table == "studio_risks"

    risk_update = studio_client.patch(
        project_url(studio_context, f"risks/{risk_id}/"),
        {"probability": 2},
        format="json",
    )
    assert risk_update.status_code == 200
    assert risk_update.data["score"] == 8

    assert studio_client.delete(project_url(studio_context, f"releases/{release_id}/")).status_code == 204
    assert StudioRelease.objects.filter(id=release_id).exists() is False
    assert (
        studio_client.delete(
            f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/"
        ).status_code
        == 204
    )
    assert StudioDecision.objects.filter(id=decision_id).exists() is False
    assert studio_client.delete(project_url(studio_context, f"risks/{risk_id}/")).status_code == 204
    assert StudioRisk.objects.filter(id=risk_id).exists() is False


def test_today_portfolio_and_overview_are_live_projections(studio_client, studio_context):
    studio_client.patch(
        project_url(studio_context, "profile/"),
        {
            "portfolio_bucket": "FOCUS",
            "lifecycle_stage": "BUILD",
            "focus_statement": "Complete the real data closure",
        },
        format="json",
    )
    studio_client.post(
        project_url(studio_context, "releases/"),
        {
            "name": "Visual candidate",
            "version": "1.0.0-rc.1",
            "channel": "BETA",
            "target_at": (timezone.now() + timedelta(days=4)).isoformat(),
        },
        format="json",
    )
    studio_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/",
        {
            "project_id": str(studio_context.project.id),
            "title": "Approve visual direction",
            "question": "Does the extension look native to Plane?",
            "status": "NEEDS_DECISION",
        },
        format="json",
    )
    studio_client.post(
        project_url(studio_context, "risks/"),
        {
            "type": "DELIVERY",
            "title": "Navigation regression",
            "probability": 2,
            "impact": 5,
            "is_blocker": True,
        },
        format="json",
    )

    today = studio_client.get(f"/api/studio/workspaces/{studio_context.workspace.slug}/today/")
    portfolio = studio_client.get(f"/api/studio/workspaces/{studio_context.workspace.slug}/portfolio/")
    overview = studio_client.get(project_url(studio_context, "overview/"))

    assert today.status_code == 200
    assert today.data["focus_projects"][0]["project"]["id"] == str(studio_context.project.id)
    assert today.data["needs_attention"][0]["health"]["status"] == "BLOCKED"
    assert len(today.data["upcoming_releases"]) == 1
    assert len(today.data["pending_decisions"]) == 1

    assert portfolio.status_code == 200
    assert portfolio.data["projects"][0]["profile"]["portfolio_bucket"] == "FOCUS"
    assert "portfolio_buckets" in portfolio.data["available_filters"]

    assert overview.status_code == 200
    assert overview.data["project"]["id"] == str(studio_context.project.id)
    assert overview.data["work_summary"]["work_items"]["total"] == 0
    assert len(overview.data["releases"]) == 1
    assert len(overview.data["decisions"]) == 1
    assert len(overview.data["risks"]) == 1


def test_unconfigured_portfolio_project_has_honest_null_profile_and_health(studio_client, studio_context):
    risk = studio_client.post(
        project_url(studio_context, "risks/"),
        {
            "type": "TECHNICAL",
            "title": "Unconfigured project still has a real blocker",
            "probability": 4,
            "impact": 5,
            "is_blocker": True,
        },
        format="json",
    )
    assert risk.status_code == 201

    response = studio_client.get(f"/api/studio/workspaces/{studio_context.workspace.slug}/portfolio/")
    today = studio_client.get(f"/api/studio/workspaces/{studio_context.workspace.slug}/today/")

    assert response.status_code == 200
    assert response.data["projects"][0]["profile"] is None
    assert response.data["projects"][0]["health"] is None
    assert response.data["projects"][0]["attention"]["status"] == "BLOCKED"
    assert today.status_code == 200
    assert today.data["needs_attention"][0]["health"] is None
    assert today.data["needs_attention"][0]["attention"]["status"] == "BLOCKED"


def test_membership_permissions_and_workspace_scope(studio_context):
    guest_client = APIClient()
    guest_client.force_authenticate(user=studio_context.guest)
    assert guest_client.get(project_url(studio_context, "profile/")).status_code == 404
    assert (
        guest_client.patch(
            project_url(studio_context, "profile/"),
            {"portfolio_bucket": "FOCUS"},
            format="json",
        ).status_code
        == 403
    )

    member_client = APIClient()
    member_client.force_authenticate(user=studio_context.member)
    assert (
        member_client.patch(
            project_url(studio_context, "profile/"),
            {"portfolio_bucket": "NEXT"},
            format="json",
        ).status_code
        == 200
    )

    decision = member_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/",
        {
            "project_id": str(studio_context.project.id),
            "title": "Project-scoped decision",
            "question": "Should this remain project-scoped?",
        },
        format="json",
    )
    assert decision.status_code == 201
    assert (
        member_client.post(
            f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/",
            {
                "project_id": None,
                "title": "Unauthorized workspace decision",
                "question": "Can a project member create this?",
            },
            format="json",
        ).status_code
        == 403
    )
    assert (
        member_client.get(f"/api/studio/workspaces/{studio_context.workspace.slug}/portfolio/").data["permissions"][
            "can_write_workspace"
        ]
        is False
    )
    assert (
        member_client.patch(
            f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision.data['id']}/",
            {"project_id": None},
            format="json",
        ).status_code
        == 403
    )

    cross_workspace_url = (
        f"/api/studio/workspaces/{studio_context.workspace.slug}/projects/{studio_context.other_project.id}/profile/"
    )
    assert member_client.get(cross_workspace_url).status_code == 403

from datetime import timedelta

import pytest
from django.utils import timezone

from rest_framework.test import APIClient

from plane.studio.models import StudioEvent, StudioProjectProfile, StudioReleaseChecklistItem

pytestmark = pytest.mark.django_db


def project_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/projects/{context.project.id}/{suffix}"


def _profile(context):
    return StudioProjectProfile.objects.create(
        project=context.project,
        product_type="WEB_APP",
        portfolio_bucket="FOCUS",
        lifecycle_stage="BUILD",
        focus_statement="Ship governance",
    )


def test_release_rejects_illegal_transition_and_writes_event(studio_client, studio_context):
    _profile(studio_context)
    created = studio_client.post(
        project_url(studio_context, "releases/"),
        {"name": "Cut 1.0", "version": "1.0.0", "channel": "INTERNAL", "status": "PLANNED"},
        format="json",
    )
    assert created.status_code == 201
    release_id = created.data["id"]
    assert len(created.data["checklist_items"]) == 11
    assert StudioReleaseChecklistItem.objects.filter(release_id=release_id).count() == 11

    illegal = studio_client.patch(
        project_url(studio_context, f"releases/{release_id}/"),
        {"status": "RELEASED"},
        format="json",
    )
    assert illegal.status_code == 400
    assert "Cannot transition release" in str(illegal.data)

    legal = studio_client.patch(
        project_url(studio_context, f"releases/{release_id}/"),
        {"status": "SCOPING"},
        format="json",
    )
    assert legal.status_code == 200
    assert legal.data["status"] == "SCOPING"
    assert StudioEvent.objects.filter(entity_type="release", action="updated").exists()


def test_risk_transition_graph(studio_client, studio_context):
    created = studio_client.post(
        project_url(studio_context, "risks/"),
        {
            "type": "TECHNICAL",
            "title": "Upgrade boundary",
            "probability": 3,
            "impact": 5,
            "status": "OPEN",
        },
        format="json",
    )
    assert created.status_code == 201
    risk_id = created.data["id"]
    closed = studio_client.patch(
        project_url(studio_context, f"risks/{risk_id}/"),
        {"status": "CLOSED"},
        format="json",
    )
    assert closed.status_code == 200
    illegal = studio_client.patch(
        project_url(studio_context, f"risks/{risk_id}/"),
        {"status": "MITIGATING"},
        format="json",
    )
    assert illegal.status_code == 400


def test_decision_both_required_acknowledgements(studio_client, studio_context):
    created = studio_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/",
        {
            "project_id": str(studio_context.project.id),
            "title": "Upgrade boundary",
            "question": "Where does Phase 2 live?",
            "status": "DRAFT",
            "decision_mode": "BOTH_REQUIRED",
            "final_decision": "Keep it in plane.studio",
        },
        format="json",
    )
    assert created.status_code == 201
    decision_id = created.data["id"]
    option = studio_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/options/",
        {"title": "Native namespace", "sort_order": 0},
        format="json",
    )
    assert option.status_code == 201

    needs = studio_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/",
        {"status": "NEEDS_DECISION"},
        format="json",
    )
    assert needs.status_code == 200

    blocked = studio_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/",
        {"status": "DECIDED"},
        format="json",
    )
    assert blocked.status_code == 400

    request_admin = studio_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/acknowledgements/",
        {"user_id": str(studio_context.admin.id)},
        format="json",
    )
    request_member = studio_client.post(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/acknowledgements/",
        {"user_id": str(studio_context.member.id)},
        format="json",
    )
    assert request_admin.status_code == 201
    assert request_member.status_code == 201

    admin_ack = studio_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/acknowledgements/me/",
        {"state": "APPROVED"},
        format="json",
    )
    assert admin_ack.status_code == 200

    still_blocked = studio_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/",
        {"status": "DECIDED"},
        format="json",
    )
    assert still_blocked.status_code == 400

    member_client = APIClient()
    member_client.force_authenticate(user=studio_context.member)
    member_ack = member_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/acknowledgements/me/",
        {"state": "APPROVED"},
        format="json",
    )
    assert member_ack.status_code == 200

    decided = studio_client.patch(
        f"/api/studio/workspaces/{studio_context.workspace.slug}/decisions/{decision_id}/",
        {"status": "DECIDED", "final_decision": "Keep it in plane.studio"},
        format="json",
    )
    assert decided.status_code == 200
    assert decided.data["status"] == "DECIDED"
    assert StudioEvent.objects.filter(entity_type="decision", action="acknowledged").count() >= 2


def test_milestone_and_checklist_toggle(studio_client, studio_context):
    _profile(studio_context)
    release = studio_client.post(
        project_url(studio_context, "releases/"),
        {"name": "Cut 1.1", "version": "1.1.0", "status": "PLANNED"},
        format="json",
    )
    assert release.status_code == 201
    item_id = release.data["checklist_items"][0]["id"]
    done = studio_client.patch(
        project_url(studio_context, f"releases/{release.data['id']}/checklist/{item_id}/"),
        {"is_done": True},
        format="json",
    )
    assert done.status_code == 200
    assert done.data["is_done"] is True
    assert done.data["done_at"] is not None

    milestone = studio_client.post(
        project_url(studio_context, "milestones/"),
        {
            "title": "Governance GO",
            "type": "GOVERNANCE",
            "target_at": (timezone.now() + timedelta(days=7)).isoformat(),
            "release_id": release.data["id"],
        },
        format="json",
    )
    assert milestone.status_code == 201
    done_status = studio_client.patch(
        project_url(studio_context, f"milestones/{milestone.data['id']}/"),
        {"status": "DONE"},
        format="json",
    )
    assert done_status.status_code == 200

    overview = studio_client.get(project_url(studio_context, "overview/"))
    assert overview.status_code == 200
    assert len(overview.data["milestones"]) == 1
    assert len(overview.data["events"]) >= 1
    events = studio_client.get(project_url(studio_context, "events/"))
    assert events.status_code == 200
    assert len(events.data) >= 1

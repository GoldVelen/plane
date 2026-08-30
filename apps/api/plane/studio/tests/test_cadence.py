from datetime import timedelta

import pytest
from django.utils import timezone

pytestmark = pytest.mark.django_db

from plane.db.models import Cycle
from plane.studio.models import StudioEvent, StudioWeeklyReview
from plane.studio.services.metrics import MIN_LINE_POINTS, should_draw_line


def project_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/projects/{context.project.id}/{suffix}"


def workspace_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/{suffix}"


def test_metric_snapshots_need_three_points_to_draw_a_line(studio_client, studio_context):
    assert should_draw_line(0) is False
    assert should_draw_line(2) is False
    assert should_draw_line(MIN_LINE_POINTS) is True

    created = studio_client.post(
        project_url(studio_context, "metrics/"),
        {
            "name": "Weekly actives",
            "key": "wau",
            "unit": "COUNT",
            "direction": "UP_IS_GOOD",
            "frequency": "WEEKLY",
            "source_type": "MANUAL",
        },
        format="json",
    )
    assert created.status_code == 201
    metric_id = created.data["id"]
    assert created.data["series"]["draws_line"] is False
    assert created.data["series"]["point_count"] == 0

    now = timezone.now()
    first = studio_client.post(
        project_url(studio_context, f"metrics/{metric_id}/snapshots/"),
        {"numeric_value": 10, "captured_at": (now - timedelta(days=14)).isoformat()},
        format="json",
    )
    second = studio_client.post(
        project_url(studio_context, f"metrics/{metric_id}/snapshots/"),
        {"numeric_value": 12, "captured_at": (now - timedelta(days=7)).isoformat()},
        format="json",
    )
    assert first.status_code == 201
    assert second.status_code == 201
    two_points = studio_client.get(project_url(studio_context, f"metrics/{metric_id}/"))
    assert two_points.status_code == 200
    assert two_points.data["series"]["point_count"] == 2
    assert two_points.data["series"]["draws_line"] is False

    third = studio_client.post(
        project_url(studio_context, f"metrics/{metric_id}/snapshots/"),
        {"numeric_value": 18, "captured_at": now.isoformat()},
        format="json",
    )
    assert third.status_code == 201
    three_points = studio_client.get(project_url(studio_context, f"metrics/{metric_id}/"))
    assert three_points.data["series"]["point_count"] == 3
    assert three_points.data["series"]["draws_line"] is True


def test_timeline_includes_newly_written_studio_event(studio_client, studio_context):
    created = studio_client.post(
        project_url(studio_context, "metrics/"),
        {"name": "Retention", "key": "retention", "unit": "PERCENT"},
        format="json",
    )
    assert created.status_code == 201
    snapshot = studio_client.post(
        project_url(studio_context, f"metrics/{created.data['id']}/snapshots/"),
        {"numeric_value": 42, "captured_at": timezone.now().isoformat()},
        format="json",
    )
    assert snapshot.status_code == 201
    assert StudioEvent.objects.filter(entity_type="metric_snapshot").exists()

    timeline = studio_client.get(workspace_url(studio_context, "timeline/"))
    assert timeline.status_code == 200
    entity_ids = {item["entity_id"] for item in timeline.data["events"]}
    assert snapshot.data["id"] in entity_ids


def test_weekly_review_write_back_is_returned_by_later_get(studio_client, studio_context):
    created = studio_client.post(
        workspace_url(studio_context, "weekly-reviews/"),
        {
            "retrospective": "Shipped the operating loop.",
            "health_summary": "On track except one store delay.",
            "focus": "Close Feedback convert.",
            "risks": "App Store review lag.",
            "next_steps": "Record a third metric snapshot.",
        },
        format="json",
    )
    assert created.status_code == 201
    review_id = created.data["id"]
    assert created.data["focus"] == "Close Feedback convert."

    later = studio_client.get(workspace_url(studio_context, "weekly-reviews/current/"))
    assert later.status_code == 200
    assert later.data["id"] == review_id
    assert later.data["retrospective"] == "Shipped the operating loop."
    assert later.data["next_steps"] == "Record a third metric snapshot."

    today = studio_client.get(workspace_url(studio_context, "today/"))
    assert today.status_code == 200
    assert today.data["cadence"]["focus"] == "Close Feedback convert."
    assert today.data["cadence"]["risks"] == "App Store review lag."
    assert today.data["cadence"]["next_steps"] == "Record a third metric snapshot."


def test_creating_a_cycle_does_not_create_a_weekly_review(studio_client, studio_context):
    assert StudioWeeklyReview.objects.filter(workspace=studio_context.workspace).count() == 0
    cycle = Cycle.objects.create(
        name="Sprint that is not a review",
        project=studio_context.project,
        owned_by=studio_context.admin,
    )
    assert cycle.id
    assert StudioWeeklyReview.objects.filter(workspace=studio_context.workspace).count() == 0
    listing = studio_client.get(workspace_url(studio_context, "weekly-reviews/"))
    assert listing.status_code == 200
    assert listing.data == []

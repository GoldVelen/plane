import pytest
from rest_framework.test import APIClient

from plane.db.models import Issue, State
from plane.studio.models import StudioEvent, StudioFeedback

pytestmark = pytest.mark.django_db


def project_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/projects/{context.project.id}/{suffix}"


def workspace_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/{suffix}"


def _default_state(context):
    return State.objects.create(
        name="Todo",
        project=context.project,
        workspace=context.workspace,
        color="#4E5355",
        group="backlog",
        default=True,
    )


def test_feedback_create_illegal_jump_keeps_status_and_legal_path(studio_client, studio_context):
    created = studio_client.post(
        project_url(studio_context, "feedback/"),
        {
            "title": "Store review is slow to load",
            "body": "Users cannot open the history tab.",
            "source": "APP_STORE",
            "sentiment": "NEGATIVE",
            "priority": "P1",
        },
        format="json",
    )
    assert created.status_code == 201
    feedback_id = created.data["id"]
    assert created.data["status"] == "INBOX"
    assert created.data["linked_issue_id"] is None
    assert StudioFeedback.objects.get(id=feedback_id).title == "Store review is slow to load"

    illegal = studio_client.patch(
        project_url(studio_context, f"feedback/{feedback_id}/"),
        {"status": "RESOLVED"},
        format="json",
    )
    assert illegal.status_code == 400
    assert "Cannot transition feedback" in str(illegal.data)
    unchanged = studio_client.get(project_url(studio_context, f"feedback/{feedback_id}/"))
    assert unchanged.status_code == 200
    assert unchanged.data["status"] == "INBOX"

    triaged = studio_client.patch(
        project_url(studio_context, f"feedback/{feedback_id}/"),
        {"status": "TRIAGED"},
        format="json",
    )
    assert triaged.status_code == 200
    planned = studio_client.patch(
        project_url(studio_context, f"feedback/{feedback_id}/"),
        {"status": "PLANNED"},
        format="json",
    )
    assert planned.status_code == 200
    resolved = studio_client.patch(
        project_url(studio_context, f"feedback/{feedback_id}/"),
        {"status": "RESOLVED"},
        format="json",
    )
    assert resolved.status_code == 200
    assert resolved.data["status"] == "RESOLVED"
    assert StudioEvent.objects.filter(entity_type="feedback", entity_id=feedback_id).exists()


def test_feedback_convert_is_idempotent_and_stores_work_item_reference(studio_client, studio_context):
    _default_state(studio_context)
    created = studio_client.post(
        project_url(studio_context, "feedback/"),
        {"title": "Need a retry on upload", "body": "The <script>alert(1)</script> note", "priority": "P0"},
        format="json",
    )
    assert created.status_code == 201
    feedback_id = created.data["id"]

    first = studio_client.post(project_url(studio_context, f"feedback/{feedback_id}/convert/"), {}, format="json")
    assert first.status_code == 200
    issue_id = first.data["linked_issue_id"]
    assert issue_id
    assert first.data["status"] == "INBOX"
    issue = Issue.objects.get(id=issue_id)
    assert issue.project_id == studio_context.project.id
    assert issue.name == "Need a retry on upload"
    assert "&lt;script&gt;" in issue.description_html
    assert "<script>" not in issue.description_html
    assert Issue.objects.filter(project=studio_context.project).count() == 1

    second = studio_client.post(project_url(studio_context, f"feedback/{feedback_id}/convert/"), {}, format="json")
    assert second.status_code == 200
    assert second.data["linked_issue_id"] == issue_id
    assert Issue.objects.filter(project=studio_context.project).count() == 1

    overview = studio_client.get(project_url(studio_context, "overview/"))
    assert overview.status_code == 200
    assert any(item["id"] == feedback_id for item in overview.data["feedback"])
    operations = studio_client.get(workspace_url(studio_context, "operations/"))
    assert operations.status_code == 200
    assert any(item["id"] == feedback_id for item in operations.data["feedback"])
    assert operations.data["feedback"][0]["linked_issue_id"] == issue_id


def test_feedback_convert_error_leaves_status_and_does_not_invent_a_link(studio_client, studio_context, mocker):
    created = studio_client.post(
        project_url(studio_context, "feedback/"),
        {"title": "Convert should fail closed", "status": "INBOX"},
        format="json",
    )
    assert created.status_code == 201
    feedback_id = created.data["id"]
    mocker.patch("plane.studio.services.convert.Issue.objects.create", side_effect=RuntimeError("unavailable"))

    convert = studio_client.post(project_url(studio_context, f"feedback/{feedback_id}/convert/"), {}, format="json")
    assert convert.status_code == 400
    detail = studio_client.get(project_url(studio_context, f"feedback/{feedback_id}/"))
    assert detail.status_code == 200
    assert detail.data["status"] == "INBOX"
    assert detail.data["linked_issue_id"] is None
    assert Issue.objects.filter(project=studio_context.project).count() == 0


def test_experiment_illegal_jump_and_guest_cannot_write(studio_client, studio_context):
    created = studio_client.post(
        project_url(studio_context, "experiments/"),
        {"title": "Pricing copy test", "hypothesis": "Shorter copy converts more."},
        format="json",
    )
    assert created.status_code == 201
    experiment_id = created.data["id"]
    assert created.data["status"] == "DRAFT"

    illegal = studio_client.patch(
        project_url(studio_context, f"experiments/{experiment_id}/"),
        {"status": "COMPLETED"},
        format="json",
    )
    assert illegal.status_code == 400
    assert "Cannot transition experiment" in str(illegal.data)
    detail = studio_client.get(project_url(studio_context, f"experiments/{experiment_id}/"))
    assert detail.data["status"] == "DRAFT"

    running = studio_client.patch(
        project_url(studio_context, f"experiments/{experiment_id}/"),
        {"status": "RUNNING"},
        format="json",
    )
    assert running.status_code == 200
    completed = studio_client.patch(
        project_url(studio_context, f"experiments/{experiment_id}/"),
        {"status": "COMPLETED"},
        format="json",
    )
    assert completed.status_code == 200
    assert completed.data["status"] == "COMPLETED"

    content = studio_client.post(
        project_url(studio_context, "content/"),
        {"title": "Launch note", "channel": "BLOG", "status": "IDEA"},
        format="json",
    )
    assert content.status_code == 201
    routine = studio_client.post(
        project_url(studio_context, "routines/"),
        {"name": "Weekly store reply", "cadence": "WEEKLY", "is_active": True},
        format="json",
    )
    assert routine.status_code == 201

    guest_client = APIClient()
    guest_client.force_authenticate(user=studio_context.guest)
    guest_write = guest_client.post(
        project_url(studio_context, "feedback/"),
        {"title": "Guest should not write"},
        format="json",
    )
    assert guest_write.status_code == 403
    guest_experiment = guest_client.patch(
        project_url(studio_context, f"experiments/{experiment_id}/"),
        {"status": "STOPPED"},
        format="json",
    )
    assert guest_experiment.status_code == 403
    guest_read = guest_client.get(workspace_url(studio_context, "operations/"))
    assert guest_read.status_code == 200

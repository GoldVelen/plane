import pytest
from rest_framework.test import APIClient

from plane.db.models import ProjectMember, User, WorkspaceMember
from plane.studio.models import StudioFeedback

pytestmark = pytest.mark.django_db


def project_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/projects/{context.project.id}/{suffix}"


def test_guest_cannot_convert_and_outsider_cannot_read_workspace_operations(studio_client, studio_context):
    created = studio_client.post(
        project_url(studio_context, "feedback/"),
        {"title": "Hardening convert guard"},
        format="json",
    )
    assert created.status_code == 201
    feedback_id = created.data["id"]

    guest_client = APIClient()
    guest_client.force_authenticate(user=studio_context.guest)
    convert = guest_client.post(project_url(studio_context, f"feedback/{feedback_id}/convert/"), {}, format="json")
    assert convert.status_code == 403
    assert StudioFeedback.objects.get(id=feedback_id).linked_issue_id is None

    outsider = User.objects.create(email="studio-outsider@example.com", username="studio-outsider")
    WorkspaceMember.objects.create(workspace=studio_context.other_workspace, member=outsider, role=15)
    ProjectMember.objects.create(project=studio_context.other_project, member=outsider, role=15)
    outsider_client = APIClient()
    outsider_client.force_authenticate(user=outsider)
    operations = outsider_client.get(f"/api/studio/workspaces/{studio_context.workspace.slug}/operations/")
    assert operations.status_code == 403
    foreign_feedback = outsider_client.get(project_url(studio_context, "feedback/"))
    assert foreign_feedback.status_code == 403

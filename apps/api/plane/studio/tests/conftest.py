from types import SimpleNamespace

import pytest
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember


@pytest.fixture
def studio_context(db):
    admin = User.objects.create(
        email="studio-admin@example.com",
        username="studio-admin",
        first_name="Studio",
        last_name="Admin",
    )
    member = User.objects.create(
        email="studio-member@example.com",
        username="studio-member",
        first_name="Studio",
        last_name="Member",
    )
    guest = User.objects.create(
        email="studio-guest@example.com",
        username="studio-guest",
        first_name="Studio",
        last_name="Guest",
    )
    workspace = Workspace.objects.create(
        name="Studio Workspace",
        slug="studio-workspace",
        owner=admin,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=admin, role=20)
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
    project = Project.objects.create(
        workspace=workspace,
        name="Studio Project",
        identifier="STUDIO",
        network=2,
    )
    ProjectMember.objects.create(project=project, member=admin, role=20)
    ProjectMember.objects.create(project=project, member=member, role=15)
    ProjectMember.objects.create(project=project, member=guest, role=5)

    other_workspace = Workspace.objects.create(
        name="Other Workspace",
        slug="other-workspace",
        owner=admin,
    )
    WorkspaceMember.objects.create(workspace=other_workspace, member=admin, role=20)
    other_project = Project.objects.create(
        workspace=other_workspace,
        name="Other Project",
        identifier="OTHER",
        network=0,
    )
    ProjectMember.objects.create(project=other_project, member=admin, role=20)

    return SimpleNamespace(
        admin=admin,
        member=member,
        guest=guest,
        workspace=workspace,
        project=project,
        other_workspace=other_workspace,
        other_project=other_project,
    )


@pytest.fixture
def studio_client(studio_context):
    client = APIClient()
    client.force_authenticate(user=studio_context.admin)
    return client

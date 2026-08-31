# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from importlib import import_module
from unittest.mock import patch

import pytest
from django.apps import apps as django_apps
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    ProjectUserProperty,
    User,
    WorkspaceMember,
    WorkspaceMemberInvite,
)


def _create_user(email):
    user = User.objects.create(email=email, username=email)
    user.set_password("test-password")
    user.save()
    return user


def _invite_url(workspace):
    return f"/api/workspaces/{workspace.slug}/invitations/"


def _join_url(workspace, invitation):
    return f"/api/workspaces/{workspace.slug}/invitations/{invitation.id}/join/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceInvitationProjectAccess:
    def test_existing_members_are_aligned_by_the_data_migration(self, workspace):
        public_project = Project.objects.create(
            name="Existing Public",
            identifier="EPU",
            workspace=workspace,
            network=2,
        )
        private_project = Project.objects.create(
            name="Existing Private",
            identifier="EPI",
            workspace=workspace,
            network=0,
        )
        admin = _create_user("existing-admin@example.com")
        admin_membership = WorkspaceMember.objects.create(
            workspace=workspace,
            member=admin,
            role=20,
            project_access_scope="selected",
            default_project_role=15,
        )
        selected_member = _create_user("existing-member@example.com")
        selected_workspace_membership = WorkspaceMember.objects.create(
            workspace=workspace,
            member=selected_member,
            role=15,
            project_access_scope="selected",
            default_project_role=15,
        )
        ProjectMember.objects.create(project=private_project, member=selected_member, role=15)
        no_access_member = _create_user("existing-no-access@example.com")
        no_access_workspace_membership = WorkspaceMember.objects.create(
            workspace=workspace,
            member=no_access_member,
            role=15,
            project_access_scope="selected",
            default_project_role=15,
        )
        admin_invitation = WorkspaceMemberInvite.objects.create(
            workspace=workspace,
            email="pending-admin@example.com",
            token="pending-admin",
            role=20,
        )
        member_invitation = WorkspaceMemberInvite.objects.create(
            workspace=workspace,
            email="pending-member@example.com",
            token="pending-member",
            role=15,
        )

        migration = import_module("plane.db.migrations.0123_workspace_member_project_access")
        migration.align_existing_project_access(django_apps, None)

        admin_membership.refresh_from_db()
        selected_workspace_membership.refresh_from_db()
        no_access_workspace_membership.refresh_from_db()
        admin_invitation.refresh_from_db()
        member_invitation.refresh_from_db()
        assert admin_membership.project_access_scope == "all"
        assert admin_membership.default_project_role == 20
        assert ProjectMember.objects.filter(
            project=public_project,
            member=admin,
            role=20,
            is_active=True,
        ).exists()
        assert not ProjectMember.objects.filter(project=private_project, member=admin, is_active=True).exists()
        assert ProjectUserProperty.objects.filter(project=public_project, user=admin).exists()
        assert selected_workspace_membership.project_access_scope == "selected"
        assert no_access_workspace_membership.project_access_scope == "none"
        assert admin_invitation.project_access_scope == "all"
        assert admin_invitation.default_project_role == 20
        assert member_invitation.project_access_scope == "none"

    @patch("plane.app.views.workspace.invite.workspace_invitation.delay")
    def test_selected_projects_are_provisioned_when_invitation_is_accepted(
        self,
        _workspace_invitation_delay,
        session_client,
        workspace,
    ):
        selected_project = Project.objects.create(
            name="Selected Project",
            identifier="SEL",
            workspace=workspace,
            network=0,
        )
        excluded_project = Project.objects.create(
            name="Excluded Project",
            identifier="EXC",
            workspace=workspace,
            network=2,
        )
        invitee = _create_user("selected@example.com")

        response = session_client.post(
            _invite_url(workspace),
            {
                "emails": [
                    {
                        "email": invitee.email,
                        "role": 15,
                        "project_access_scope": "selected",
                        "default_project_role": 15,
                        "project_ids": [str(selected_project.id)],
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        invitation = WorkspaceMemberInvite.objects.get(email=invitee.email)

        session_client.force_authenticate(user=invitee)
        response = session_client.post(
            _join_url(workspace, invitation),
            {"accepted": True, "token": invitation.token},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        workspace_member = WorkspaceMember.objects.get(workspace=workspace, member=invitee)
        assert workspace_member.project_access_scope == "selected"
        assert workspace_member.default_project_role == 15
        assert ProjectMember.objects.filter(
            project=selected_project,
            member=invitee,
            role=15,
            is_active=True,
        ).exists()
        assert not ProjectMember.objects.filter(
            project=excluded_project,
            member=invitee,
            is_active=True,
        ).exists()
        assert not WorkspaceMemberInvite.objects.filter(pk=invitation.pk).exists()

        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/")
        assert response.status_code == status.HTTP_200_OK
        visible_project_ids = {project["id"] for project in response.json()}
        assert visible_project_ids == {str(selected_project.id)}

    @patch("plane.app.views.workspace.invite.workspace_invitation.delay")
    def test_acceptance_rolls_back_when_a_selected_project_becomes_unavailable(
        self,
        _workspace_invitation_delay,
        session_client,
        workspace,
    ):
        project = Project.objects.create(
            name="Archived Before Acceptance",
            identifier="ARC",
            workspace=workspace,
        )
        invitee = _create_user("rollback@example.com")
        response = session_client.post(
            _invite_url(workspace),
            {
                "emails": [
                    {
                        "email": invitee.email,
                        "role": 15,
                        "project_access_scope": "selected",
                        "default_project_role": 15,
                        "project_ids": [str(project.id)],
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        invitation = WorkspaceMemberInvite.objects.get(email=invitee.email)
        project.archived_at = timezone.now()
        project.save(update_fields=["archived_at", "updated_at"])

        session_client.force_authenticate(user=invitee)
        response = session_client.post(
            _join_url(workspace, invitation),
            {"accepted": True, "token": invitation.token},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=invitee).exists()
        invitation.refresh_from_db()
        assert invitation.responded_at is None

    @patch("plane.app.views.project.base.model_activity.delay")
    @patch("plane.app.views.workspace.invite.workspace_invitation.delay")
    def test_all_scope_excludes_private_projects_and_applies_to_future_public_projects(
        self,
        _workspace_invitation_delay,
        _model_activity_delay,
        session_client,
        workspace,
        create_user,
    ):
        current_public_project = Project.objects.create(
            name="Current Public",
            identifier="PUB",
            workspace=workspace,
            network=2,
        )
        current_private_project = Project.objects.create(
            name="Current Private",
            identifier="PRI",
            workspace=workspace,
            network=0,
        )
        invitee = _create_user("admin@example.com")
        response = session_client.post(
            _invite_url(workspace),
            {
                "emails": [
                    {
                        "email": invitee.email,
                        "role": 20,
                        "project_access_scope": "all",
                        "default_project_role": 20,
                        "project_ids": [],
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        invitation = WorkspaceMemberInvite.objects.get(email=invitee.email)

        session_client.force_authenticate(user=invitee)
        response = session_client.post(
            _join_url(workspace, invitation),
            {"accepted": True, "token": invitation.token},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert ProjectMember.objects.filter(
            project=current_public_project,
            member=invitee,
            role=20,
            is_active=True,
        ).exists()
        assert not ProjectMember.objects.filter(
            project=current_private_project,
            member=invitee,
            is_active=True,
        ).exists()

        session_client.force_authenticate(user=create_user)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/",
            {"name": "Future Public", "identifier": "FPU", "network": 2},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        future_public_project = Project.objects.get(identifier="FPU")
        assert ProjectMember.objects.filter(
            project=future_public_project,
            member=invitee,
            role=20,
            is_active=True,
        ).exists()

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/",
            {"name": "Future Private", "identifier": "FPR", "network": 0},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        future_private_project = Project.objects.get(identifier="FPR")
        assert not ProjectMember.objects.filter(
            project=future_private_project,
            member=invitee,
            is_active=True,
        ).exists()

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{future_private_project.id}/",
            {"network": 2},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert ProjectMember.objects.filter(
            project=future_private_project,
            member=invitee,
            role=20,
            is_active=True,
        ).exists()

    def test_all_scope_keeps_private_projects_that_were_explicitly_assigned(self, session_client, workspace):
        member = _create_user("explicit-private@example.com")
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=member,
            role=15,
            project_access_scope="selected",
            default_project_role=15,
        )
        public_project = Project.objects.create(
            name="Automatic Public",
            identifier="APU",
            workspace=workspace,
            network=2,
        )
        private_project = Project.objects.create(
            name="Explicit Private",
            identifier="EPR",
            workspace=workspace,
            network=0,
        )
        ProjectMember.objects.create(project=private_project, member=member, role=15)

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/members/{workspace_member.id}/",
            {
                "project_access_scope": "all",
                "default_project_role": 15,
                "project_ids": [],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert ProjectMember.objects.filter(project=public_project, member=member, is_active=True).exists()
        assert ProjectMember.objects.filter(project=private_project, member=member, is_active=True).exists()

    def test_workspace_admin_can_replace_a_members_project_scope(self, session_client, workspace):
        member = _create_user("member@example.com")
        workspace_member = WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        removed_project = Project.objects.create(
            name="Removed Project",
            identifier="REM",
            workspace=workspace,
        )
        retained_project = Project.objects.create(
            name="Retained Project",
            identifier="RET",
            workspace=workspace,
        )
        ProjectMember.objects.create(project=removed_project, member=member, role=15)
        ProjectMember.objects.create(project=retained_project, member=member, role=15)

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/members/{workspace_member.id}/",
            {
                "project_access_scope": "selected",
                "default_project_role": 15,
                "project_ids": [str(retained_project.id)],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert not ProjectMember.objects.get(project=removed_project, member=member).is_active
        assert ProjectMember.objects.get(project=retained_project, member=member).is_active
        assert response.json()["project_ids"] == [str(retained_project.id)]

    def test_workspace_member_removal_preserves_a_projects_last_admin(self, session_client, workspace):
        member = _create_user("sole-project-admin@example.com")
        workspace_member = WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        project = Project.objects.create(
            name="Sole Admin Project",
            identifier="SAP",
            workspace=workspace,
        )
        project_member = ProjectMember.objects.create(project=project, member=member, role=20)

        response = session_client.delete(f"/api/workspaces/{workspace.slug}/members/{workspace_member.id}/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        workspace_member.refresh_from_db()
        project_member.refresh_from_db()
        assert workspace_member.is_active
        assert project_member.is_active

    def test_project_role_update_preserves_the_projects_last_admin(
        self,
        session_client,
        workspace,
        create_user,
    ):
        project = Project.objects.create(
            name="Sole Role Admin Project",
            identifier="SRA",
            workspace=workspace,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=15)
        member = _create_user("sole-role-admin@example.com")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        project_member = ProjectMember.objects.create(project=project, member=member, role=20)

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/{project_member.id}/",
            {"role": 15},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        project_member.refresh_from_db()
        assert project_member.role == 20

    def test_project_invitation_updates_the_workspace_project_scope(self, session_client, workspace):
        invitee = _create_user("project-invite@example.com")
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=invitee,
            role=15,
            project_access_scope="none",
            default_project_role=15,
        )
        existing_project = Project.objects.create(
            name="Existing Project",
            identifier="EPR",
            workspace=workspace,
        )
        invited_project = Project.objects.create(
            name="Invited Project",
            identifier="IPR",
            workspace=workspace,
        )
        existing_membership = ProjectMember.objects.create(
            project=existing_project,
            member=invitee,
            role=15,
            is_active=False,
        )
        invitation = ProjectMemberInvite.objects.create(
            project=invited_project,
            workspace=workspace,
            email=invitee.email,
            token="project-invite-token",
            role=15,
        )

        session_client.force_authenticate(user=invitee)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{invited_project.id}/join/{invitation.id}/",
            {"accepted": True, "token": invitation.token},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        workspace_member.refresh_from_db()
        existing_membership.refresh_from_db()
        assert workspace_member.project_access_scope == "selected"
        assert not existing_membership.is_active
        assert ProjectMember.objects.filter(
            project=invited_project,
            member=invitee,
            role=15,
            is_active=True,
        ).exists()

    @patch("plane.app.views.project.invite.project_invitation.delay")
    def test_project_invitation_creation_persists_and_queues_the_invitation(
        self,
        project_invitation_delay,
        session_client,
        workspace,
        create_user,
        django_capture_on_commit_callbacks,
    ):
        project = Project.objects.create(
            name="Invitation Project",
            identifier="IVP",
            workspace=workspace,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20)
        invitee = _create_user("project-invitation-create@example.com")
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=invitee,
            role=15,
            project_access_scope="none",
            default_project_role=15,
        )

        with django_capture_on_commit_callbacks(execute=True) as callbacks:
            response = session_client.post(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/invitations/",
                {"emails": [{"email": invitee.email, "role": 15}]},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        invitation = ProjectMemberInvite.objects.get(project=project, email=invitee.email)
        assert invitation.role == 15
        assert len(callbacks) == 1
        project_invitation_delay.assert_called_once()

    def test_project_member_addition_updates_a_none_workspace_scope(
        self,
        session_client,
        workspace,
        create_user,
    ):
        project = Project.objects.create(
            name="Direct Member Project",
            identifier="DMP",
            workspace=workspace,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20)
        member = _create_user("direct-project-member@example.com")
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=member,
            role=15,
            project_access_scope="none",
            default_project_role=15,
        )

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/",
            {"members": [{"member_id": str(member.id), "role": 15}]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        workspace_member.refresh_from_db()
        assert workspace_member.project_access_scope == "selected"
        assert ProjectMember.objects.filter(project=project, member=member, is_active=True).exists()

    def test_workspace_role_change_synchronizes_project_scope_and_roles(
        self,
        session_client,
        workspace,
        create_user,
    ):
        member = _create_user("promoted@example.com")
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=member,
            role=15,
            project_access_scope="selected",
            default_project_role=15,
        )
        selected_public_project = Project.objects.create(
            name="Selected Public",
            identifier="SPU",
            workspace=workspace,
            network=2,
        )
        other_public_project = Project.objects.create(
            name="Other Public",
            identifier="OPU",
            workspace=workspace,
            network=2,
        )
        private_project = Project.objects.create(
            name="Private",
            identifier="PRV",
            workspace=workspace,
            network=0,
        )
        ProjectMember.objects.create(project=selected_public_project, member=member, role=15)

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/members/{workspace_member.id}/",
            {"role": 20},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        workspace_member.refresh_from_db()
        assert workspace_member.project_access_scope == "all"
        assert workspace_member.default_project_role == 20
        assert ProjectMember.objects.filter(
            project=selected_public_project,
            member=member,
            role=20,
            is_active=True,
        ).exists()
        assert ProjectMember.objects.filter(
            project=other_public_project,
            member=member,
            role=20,
            is_active=True,
        ).exists()
        assert not ProjectMember.objects.filter(
            project=private_project,
            member=member,
            is_active=True,
        ).exists()

        ProjectMember.objects.create(project=selected_public_project, member=create_user, role=20)
        ProjectMember.objects.create(project=other_public_project, member=create_user, role=20)

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/members/{workspace_member.id}/",
            {"role": 15},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        workspace_member.refresh_from_db()
        assert workspace_member.project_access_scope == "selected"
        assert workspace_member.default_project_role == 15
        assert set(response.json()["project_ids"]) == {
            str(selected_public_project.id),
            str(other_public_project.id),
        }
        assert ProjectMember.objects.filter(
            project=selected_public_project,
            member=member,
            role=15,
            is_active=True,
        ).exists()
        assert ProjectMember.objects.filter(
            project=other_public_project,
            member=member,
            role=15,
            is_active=True,
        ).exists()

    def test_removing_the_last_selected_project_changes_workspace_scope_to_none(
        self,
        session_client,
        workspace,
        create_user,
    ):
        project = Project.objects.create(
            name="Last Selected Project",
            identifier="LSP",
            workspace=workspace,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20)
        member = _create_user("last-selected@example.com")
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=member,
            role=15,
            project_access_scope="selected",
            default_project_role=15,
        )
        project_member = ProjectMember.objects.create(project=project, member=member, role=15)

        response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/{project_member.id}/"
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        workspace_member.refresh_from_db()
        assert workspace_member.project_access_scope == "none"

    def test_removing_a_public_project_from_all_scope_changes_scope_to_selected(
        self,
        session_client,
        workspace,
        create_user,
    ):
        removed_project = Project.objects.create(
            name="Removed Public",
            identifier="RPU",
            workspace=workspace,
            network=2,
        )
        retained_project = Project.objects.create(
            name="Retained Public",
            identifier="TPU",
            workspace=workspace,
            network=2,
        )
        ProjectMember.objects.create(project=removed_project, member=create_user, role=20)
        member = _create_user("all-to-selected@example.com")
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=member,
            role=15,
            project_access_scope="all",
            default_project_role=15,
        )
        removed_membership = ProjectMember.objects.create(project=removed_project, member=member, role=15)
        ProjectMember.objects.create(project=retained_project, member=member, role=15)

        response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{removed_project.id}/members/{removed_membership.id}/"
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        workspace_member.refresh_from_db()
        assert workspace_member.project_access_scope == "selected"

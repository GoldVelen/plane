# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import datetime

import jwt

# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone

# Third party modules
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission
from plane.app.serializers import (
    WorkSpaceMemberInviteSerializer,
    WorkSpaceMemberInvitePublicSerializer,
    WorkSpaceMemberSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.bgtasks.event_tracking_task import track_event
from plane.bgtasks.workspace_invitation_task import workspace_invitation
from plane.db.models import Profile, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.utils.cache import invalidate_cache, invalidate_cache_directly
from plane.utils.host import base_host
from plane.utils.analytics_events import USER_JOINED_WORKSPACE, USER_INVITED_TO_WORKSPACE
from plane.utils.project_access import (
    ProjectAccessValidationError,
    normalize_project_access,
    provision_workspace_member_from_invitation,
)
from .. import BaseViewSet


class WorkspaceInvitationsViewset(BaseViewSet):
    """Endpoint for creating, listing and  deleting workspaces"""

    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [WorkSpaceAdminPermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner", "created_by")
        )

    def create(self, request, slug):
        emails = request.data.get("emails", [])
        # Check if email is provided
        if not emails:
            return Response({"error": "Emails are required"}, status=status.HTTP_400_BAD_REQUEST)

        # check for role level of the requesting user
        requesting_user = WorkspaceMember.objects.get(workspace__slug=slug, member=request.user, is_active=True)

        try:
            invitee_roles = [int(email.get("role", 5)) for email in emails]
        except (TypeError, ValueError):
            return Response({"error": "One or more workspace roles are invalid"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if any invited user has an higher role
        if any(role > requesting_user.role for role in invitee_roles):
            return Response(
                {"error": "You cannot invite a user with higher role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace object
        workspace = Workspace.objects.get(slug=slug)

        # Check if user is already a member of workspace
        workspace_members = WorkspaceMember.objects.filter(
            workspace_id=workspace.id,
            member__email__in=[email.get("email", "").strip().lower() for email in emails],
            is_active=True,
        ).select_related("member", "member__avatar_asset")

        if workspace_members:
            return Response(
                {
                    "error": "Some users are already member of workspace",
                    "workspace_users": WorkSpaceMemberSerializer(workspace_members, many=True).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_invitations = []
        for email in emails:
            try:
                invitee_email = email.get("email", "").strip().lower()
                validate_email(invitee_email)
                invitee_role = int(email.get("role", 5))
                access = normalize_project_access(
                    workspace_id=workspace.id,
                    workspace_role=invitee_role,
                    scope=email.get("project_access_scope"),
                    project_role=email.get("default_project_role", invitee_role),
                    project_ids=email.get("project_ids", []),
                )
                workspace_invitations.append(
                    WorkspaceMemberInvite(
                        email=invitee_email,
                        workspace_id=workspace.id,
                        token=jwt.encode(
                            {"email": invitee_email, "timestamp": datetime.now().timestamp()},
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=invitee_role,
                        project_access_scope=access.scope,
                        default_project_role=access.project_role,
                        project_ids=list(access.project_ids),
                        created_by=request.user,
                    )
                )
            except (ValidationError, ProjectAccessValidationError, TypeError, ValueError) as exc:
                return Response(
                    {"error": str(exc) or "The invitation details are invalid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # Create workspace member invite
        with transaction.atomic():
            workspace_invitations = WorkspaceMemberInvite.objects.bulk_create(
                workspace_invitations, batch_size=10, ignore_conflicts=True
            )

        current_site = base_host(request=request, is_app=True)

        # Send invitations
        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                workspace.id,
                invitation.token,
                current_site,
                request.user.email,
            )
            track_event.delay(
                user_id=request.user.id,
                event_name=USER_INVITED_TO_WORKSPACE,
                slug=slug,
                event_properties={
                    "user_id": request.user.id,
                    "workspace_id": workspace.id,
                    "workspace_slug": workspace.slug,
                    "invitee_role": invitation.role,
                    "project_access_scope": invitation.project_access_scope,
                    "default_project_role": invitation.default_project_role,
                    "invited_at": str(timezone.now()),
                    "invitee_email": invitation.email,
                },
            )

        return Response({"message": "Emails sent successfully"}, status=status.HTTP_200_OK)

    def destroy(self, request, slug, pk):
        workspace_member_invite = WorkspaceMemberInvite.objects.get(pk=pk, workspace__slug=slug)
        workspace_member_invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceJoinEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    """Invitation response endpoint the user can respond to the invitation"""

    @invalidate_cache(path="/api/workspaces/", user=False)
    @invalidate_cache(path="/api/users/me/workspaces/", multiple=True)
    @invalidate_cache(
        path="/api/workspaces/:slug/members/",
        user=False,
        multiple=True,
        url_params=True,
    )
    @invalidate_cache(path="/api/users/me/settings/", multiple=True)
    def post(self, request, slug, pk):
        token = request.data.get("token", "")

        try:
            with transaction.atomic():
                workspace_invite = (
                    WorkspaceMemberInvite.objects.select_for_update()
                    .select_related("workspace")
                    .get(
                        pk=pk,
                        workspace__slug=slug,
                    )
                )

                # Validate the token to verify the user received the invitation email
                if not token or workspace_invite.token != token:
                    return Response(
                        {"error": "You do not have permission to join the workspace"},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Require an authenticated session — the accepting user must be the
                # person who was invited.  Without this check an attacker who registers
                # with the invited address (email-squat) and obtains the token via the
                # GET endpoint can steal the workspace membership (GHSA-4vj8-p63v-8p24).
                if not request.user.is_authenticated:
                    return Response(
                        {"error": "Authentication required to accept workspace invitation"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                if request.user.email.lower() != workspace_invite.email.lower():
                    return Response(
                        {"error": "You do not have permission to accept this invitation"},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                if workspace_invite.responded_at is not None:
                    return Response(
                        {"error": "You have already responded to the invitation request"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if not request.data.get("accepted", False):
                    workspace_invite.accepted = False
                    workspace_invite.responded_at = timezone.now()
                    workspace_invite.save(update_fields=["accepted", "responded_at", "updated_at"])
                    return Response(
                        {"message": "Workspace Invitation was not accepted"},
                        status=status.HTTP_200_OK,
                    )

                workspace_member = provision_workspace_member_from_invitation(workspace_invite, request.user)
                Profile.objects.update_or_create(
                    user=request.user,
                    defaults={"last_workspace_id": workspace_invite.workspace_id},
                )

                event_properties = {
                    "user_id": request.user.id,
                    "workspace_id": workspace_invite.workspace_id,
                    "workspace_slug": workspace_invite.workspace.slug,
                    "role": workspace_invite.role,
                    "joined_at": str(timezone.now()),
                }
                transaction.on_commit(
                    lambda: track_event.delay(
                        user_id=workspace_member.member_id,
                        event_name=USER_JOINED_WORKSPACE,
                        slug=slug,
                        event_properties=event_properties,
                    )
                )
                workspace_invite.delete()
        except ProjectAccessValidationError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": "Workspace Invitation Accepted"},
            status=status.HTTP_200_OK,
        )

    def get(self, request, slug, pk):
        workspace_invitation = WorkspaceMemberInvite.objects.get(workspace__slug=slug, pk=pk)
        # Use the public serializer that omits the token and invite_link fields so
        # that an unauthenticated caller cannot retrieve the acceptance token
        # (GHSA-86mg-259g-pwgg / GHSA-gf48-p6jp-cwc4).
        serializer = WorkSpaceMemberInvitePublicSerializer(workspace_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkspaceInvitationsViewSet(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super().get_queryset().filter(email=self.request.user.email).select_related("workspace")
        )

    @invalidate_cache(path="/api/workspaces/", user=False)
    @invalidate_cache(path="/api/users/me/workspaces/", multiple=True)
    def create(self, request):
        invitations = request.data.get("invitations", [])
        joined_invitations = []
        try:
            with transaction.atomic():
                workspace_invitations = list(
                    WorkspaceMemberInvite.objects.select_for_update()
                    .filter(pk__in=invitations, email=request.user.email)
                    .select_related("workspace")
                    .order_by("-created_at")
                )

                for invitation in workspace_invitations:
                    provision_workspace_member_from_invitation(invitation, request.user)
                    joined_invitations.append(
                        (
                            invitation.workspace.slug,
                            invitation.workspace_id,
                            invitation.role,
                        )
                    )
                WorkspaceMemberInvite.objects.filter(
                    pk__in=[invitation.pk for invitation in workspace_invitations]
                ).delete()
        except ProjectAccessValidationError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        for workspace_slug, workspace_id, role in joined_invitations:
            invalidate_cache_directly(
                path=f"/api/workspaces/{workspace_slug}/members/",
                user=False,
                request=request,
                multiple=True,
            )
            track_event.delay(
                user_id=request.user.id,
                event_name=USER_JOINED_WORKSPACE,
                slug=workspace_slug,
                event_properties={
                    "user_id": request.user.id,
                    "workspace_id": workspace_id,
                    "workspace_slug": workspace_slug,
                    "role": role,
                    "joined_at": str(timezone.now()),
                },
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

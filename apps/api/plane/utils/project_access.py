# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from dataclasses import dataclass
from uuid import UUID

from django.utils import timezone

from plane.db.models import Project, ProjectMember, WorkspaceMember
from plane.db.models.project import ProjectNetwork
from plane.utils.constants import (
    PROJECT_ACCESS_SCOPE_ALL,
    PROJECT_ACCESS_SCOPE_NONE,
    PROJECT_ACCESS_SCOPE_SELECTED,
)


VALID_MEMBER_ROLES = {5, 15, 20}
VALID_PROJECT_ACCESS_SCOPES = {
    PROJECT_ACCESS_SCOPE_ALL,
    PROJECT_ACCESS_SCOPE_SELECTED,
    PROJECT_ACCESS_SCOPE_NONE,
}


class ProjectAccessValidationError(ValueError):
    pass


@dataclass(frozen=True)
class ProjectAccessSettings:
    scope: str
    project_role: int
    project_ids: tuple[str, ...]


def _normalize_project_ids(project_ids):
    if project_ids is None:
        return ()
    if not isinstance(project_ids, (list, tuple)):
        raise ProjectAccessValidationError("Project IDs must be a list")

    normalized_project_ids = []
    for project_id in project_ids:
        try:
            normalized_project_ids.append(str(UUID(str(project_id))))
        except (TypeError, ValueError, AttributeError) as exc:
            raise ProjectAccessValidationError("One or more selected projects are invalid") from exc
    return tuple(dict.fromkeys(normalized_project_ids))


def normalize_project_access(
    *,
    workspace_id,
    workspace_role,
    scope=None,
    project_role=None,
    project_ids=None,
):
    normalized_scope = scope or PROJECT_ACCESS_SCOPE_NONE
    if normalized_scope not in VALID_PROJECT_ACCESS_SCOPES:
        raise ProjectAccessValidationError("Project access scope is invalid")

    try:
        normalized_workspace_role = int(workspace_role)
        normalized_project_role = int(project_role if project_role is not None else normalized_workspace_role)
    except (TypeError, ValueError) as exc:
        raise ProjectAccessValidationError("Project role is invalid") from exc

    if normalized_workspace_role not in VALID_MEMBER_ROLES or normalized_project_role not in VALID_MEMBER_ROLES:
        raise ProjectAccessValidationError("Project role is invalid")

    if normalized_workspace_role == 20 and normalized_project_role != 20:
        raise ProjectAccessValidationError("Workspace admins must be project admins")
    if normalized_workspace_role == 5 and normalized_project_role != 5:
        raise ProjectAccessValidationError("Workspace guests must be project guests")
    if normalized_workspace_role == 5 and normalized_scope == PROJECT_ACCESS_SCOPE_ALL:
        raise ProjectAccessValidationError("Workspace guests cannot access all projects")

    normalized_project_ids = _normalize_project_ids(project_ids)
    if normalized_scope == PROJECT_ACCESS_SCOPE_SELECTED:
        if not normalized_project_ids:
            raise ProjectAccessValidationError("Select at least one project or choose no projects")

        existing_project_ids = {
            str(project_id)
            for project_id in Project.objects.filter(
                workspace_id=workspace_id,
                id__in=normalized_project_ids,
                archived_at__isnull=True,
            ).values_list("id", flat=True)
        }
        if existing_project_ids != set(normalized_project_ids):
            raise ProjectAccessValidationError("One or more selected projects are unavailable")
    else:
        normalized_project_ids = ()

    return ProjectAccessSettings(
        scope=normalized_scope,
        project_role=normalized_project_role,
        project_ids=normalized_project_ids,
    )


def _projects_for_access(workspace_id, access, existing_memberships=()):
    projects = Project.objects.filter(workspace_id=workspace_id, archived_at__isnull=True)
    if access.scope == PROJECT_ACCESS_SCOPE_ALL:
        public_projects = list(projects.filter(network=ProjectNetwork.PUBLIC.value))
        explicit_private_projects = [
            membership.project
            for membership in existing_memberships
            if membership.is_active
            and membership.project.archived_at is None
            and membership.project.network == ProjectNetwork.SECRET.value
        ]
        return [*public_projects, *explicit_private_projects]
    if access.scope == PROJECT_ACCESS_SCOPE_SELECTED:
        return list(projects.filter(id__in=access.project_ids))
    return []


def _ensure_project_member(project, workspace_member, project_role):
    project_member = ProjectMember.objects.filter(project=project, member=workspace_member.member).first()
    if project_member is None:
        return ProjectMember.objects.create(
            project=project,
            workspace=workspace_member.workspace,
            member=workspace_member.member,
            role=project_role,
        )

    changed_fields = []
    if not project_member.is_active:
        project_member.is_active = True
        changed_fields.append("is_active")
    if project_member.role != project_role:
        project_member.role = project_role
        changed_fields.append("role")
    if changed_fields:
        changed_fields.append("updated_at")
        project_member.save(update_fields=changed_fields)
    return project_member


def synchronize_workspace_member_project_access(workspace_member, access):
    existing_memberships = list(
        ProjectMember.objects.select_for_update()
        .filter(
            workspace_id=workspace_member.workspace_id,
            member=workspace_member.member,
        )
        .select_related("project")
    )
    desired_projects = _projects_for_access(workspace_member.workspace_id, access, existing_memberships)
    desired_project_ids = {str(project.id) for project in desired_projects}

    for project_member in existing_memberships:
        desired_role = access.project_role if str(project_member.project_id) in desired_project_ids else None
        if project_member.is_active and project_member.role == 20 and desired_role != 20:
            has_another_admin = (
                ProjectMember.objects.filter(
                    project_id=project_member.project_id,
                    role=20,
                    is_active=True,
                )
                .exclude(pk=project_member.pk)
                .exists()
            )
            if not has_another_admin:
                raise ProjectAccessValidationError(
                    "Project access cannot be removed because this member is the project's only admin"
                )

    for project in desired_projects:
        _ensure_project_member(project, workspace_member, access.project_role)

    memberships_to_deactivate = [
        project_member.pk
        for project_member in existing_memberships
        if project_member.is_active and str(project_member.project_id) not in desired_project_ids
    ]
    if memberships_to_deactivate:
        ProjectMember.objects.filter(pk__in=memberships_to_deactivate).update(
            is_active=False,
            updated_at=timezone.now(),
        )

    workspace_member.project_access_scope = access.scope
    workspace_member.default_project_role = access.project_role
    workspace_member.save(update_fields=["project_access_scope", "default_project_role", "updated_at"])
    return desired_project_ids


def record_project_membership_access(*, workspace_id, member_id, project_role):
    workspace_member = (
        WorkspaceMember.objects.select_for_update()
        .filter(
            workspace_id=workspace_id,
            member_id=member_id,
            is_active=True,
        )
        .first()
    )
    if workspace_member is None or workspace_member.project_access_scope != PROJECT_ACCESS_SCOPE_NONE:
        return workspace_member

    if workspace_member.role == 20:
        default_project_role = 20
    elif workspace_member.role == 5:
        default_project_role = 5
    else:
        default_project_role = int(project_role)

    workspace_member.project_access_scope = PROJECT_ACCESS_SCOPE_SELECTED
    workspace_member.default_project_role = default_project_role
    workspace_member.save(update_fields=["project_access_scope", "default_project_role", "updated_at"])
    return workspace_member


def reconcile_workspace_member_project_access_after_removal(*, workspace_id, member_id, project):
    workspace_member = (
        WorkspaceMember.objects.select_for_update()
        .filter(
            workspace_id=workspace_id,
            member_id=member_id,
            is_active=True,
        )
        .first()
    )
    if workspace_member is None:
        return None

    if workspace_member.project_access_scope == PROJECT_ACCESS_SCOPE_ALL:
        if project.network != ProjectNetwork.PUBLIC.value:
            return workspace_member
    elif workspace_member.project_access_scope != PROJECT_ACCESS_SCOPE_SELECTED:
        return workspace_member

    has_active_project = ProjectMember.objects.filter(
        workspace_id=workspace_id,
        member_id=member_id,
        is_active=True,
        project__archived_at__isnull=True,
    ).exists()
    workspace_member.project_access_scope = (
        PROJECT_ACCESS_SCOPE_SELECTED if has_active_project else PROJECT_ACCESS_SCOPE_NONE
    )
    workspace_member.save(update_fields=["project_access_scope", "updated_at"])
    return workspace_member


def provision_workspace_member_from_invitation(invitation, user):
    access = normalize_project_access(
        workspace_id=invitation.workspace_id,
        workspace_role=invitation.role,
        scope=invitation.project_access_scope,
        project_role=invitation.default_project_role,
        project_ids=invitation.project_ids,
    )
    workspace_member = (
        WorkspaceMember.objects.select_for_update()
        .filter(
            workspace_id=invitation.workspace_id,
            member=user,
        )
        .first()
    )
    if workspace_member is None:
        workspace_member = WorkspaceMember.objects.create(
            workspace_id=invitation.workspace_id,
            member=user,
            role=invitation.role,
            project_access_scope=access.scope,
            default_project_role=access.project_role,
            created_by=invitation.created_by,
        )
    else:
        workspace_member.is_active = True
        workspace_member.role = invitation.role
        workspace_member.save(update_fields=["is_active", "role", "updated_at"])

    synchronize_workspace_member_project_access(workspace_member, access)
    return workspace_member


def add_all_access_members_to_project(project, *, exclude_member_ids=()):
    if project.network != ProjectNetwork.PUBLIC.value:
        return

    workspace_members = WorkspaceMember.objects.filter(
        workspace_id=project.workspace_id,
        project_access_scope=PROJECT_ACCESS_SCOPE_ALL,
        is_active=True,
        member__is_bot=False,
    ).exclude(member_id__in=exclude_member_ids)

    for workspace_member in workspace_members:
        if ProjectMember.objects.filter(
            project=project,
            member=workspace_member.member,
            is_active=True,
        ).exists():
            continue
        access = normalize_project_access(
            workspace_id=project.workspace_id,
            workspace_role=workspace_member.role,
            scope=PROJECT_ACCESS_SCOPE_ALL,
            project_role=workspace_member.default_project_role,
            project_ids=(),
        )
        _ensure_project_member(project, workspace_member, access.project_role)

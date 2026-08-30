# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q, QuerySet
from rest_framework.permissions import SAFE_METHODS, BasePermission

from plane.db.models import Project, ProjectMember, WorkspaceMember

ADMIN_ROLE = 20
MEMBER_ROLE = 15
GUEST_ROLE = 5
WRITE_ROLES = (ADMIN_ROLE, MEMBER_ROLE)


def get_workspace_membership(user, slug):
    if not user or user.is_anonymous:
        return None
    return (
        WorkspaceMember.objects.select_related("workspace")
        .filter(workspace__slug=slug, member=user, is_active=True)
        .first()
    )


def is_workspace_admin(user, slug):
    membership = get_workspace_membership(user, slug)
    return bool(membership and (membership.role == ADMIN_ROLE or membership.workspace.owner_id == user.id))


def visible_projects_for(user, slug) -> QuerySet:
    membership = get_workspace_membership(user, slug)
    projects = Project.objects.filter(workspace__slug=slug)
    if membership is None:
        return projects.none()
    if membership.role == ADMIN_ROLE or membership.workspace.owner_id == user.id:
        return projects
    if membership.role == GUEST_ROLE:
        return projects.filter(
            project_projectmember__member=user,
            project_projectmember__is_active=True,
        ).distinct()
    return projects.filter(
        Q(
            project_projectmember__member=user,
            project_projectmember__is_active=True,
        )
        | Q(network=2)
    ).distinct()


def can_write_project(user, slug, project_id):
    membership = get_workspace_membership(user, slug)
    if membership is None:
        return False
    if membership.role == ADMIN_ROLE or membership.workspace.owner_id == user.id:
        return Project.objects.filter(id=project_id, workspace=membership.workspace).exists()
    if membership.role != MEMBER_ROLE:
        return False
    return ProjectMember.objects.filter(
        workspace=membership.workspace,
        project_id=project_id,
        member=user,
        role__in=WRITE_ROLES,
        is_active=True,
    ).exists()


def writable_project_ids(user, slug):
    membership = get_workspace_membership(user, slug)
    if membership is None:
        return []
    if membership.role == ADMIN_ROLE or membership.workspace.owner_id == user.id:
        return list(Project.objects.filter(workspace=membership.workspace).values_list("id", flat=True))
    if membership.role != MEMBER_ROLE:
        return []
    return list(
        ProjectMember.objects.filter(
            workspace=membership.workspace,
            member=user,
            role__in=WRITE_ROLES,
            is_active=True,
        ).values_list("project_id", flat=True)
    )


def permission_summary(user, slug, project_id=None):
    membership = get_workspace_membership(user, slug)
    project_ids = writable_project_ids(user, slug)
    summary = {
        "can_write_workspace": bool(
            membership and (membership.role == ADMIN_ROLE or membership.workspace.owner_id == user.id)
        ),
        "writable_project_ids": [str(value) for value in project_ids],
    }
    if project_id is not None:
        summary["can_write_project"] = project_id in set(project_ids)
    return summary


class StudioWorkspaceAccessPermission(BasePermission):
    def has_permission(self, request, view):
        membership = get_workspace_membership(request.user, view.kwargs.get("slug"))
        if membership is None:
            return False
        if request.method in SAFE_METHODS:
            return True
        return membership.role in WRITE_ROLES or membership.workspace.owner_id == request.user.id


class StudioProjectAccessPermission(BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs.get("slug")
        project_id = view.kwargs.get("project_id")
        if request.method in SAFE_METHODS:
            return visible_projects_for(request.user, slug).filter(id=project_id).exists()
        return can_write_project(request.user, slug, project_id)

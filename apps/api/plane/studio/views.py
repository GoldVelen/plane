# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from plane.app.views import BaseAPIView
from plane.db.models import Workspace
from plane.studio.models import (
    StudioDecision,
    StudioProjectProfile,
    StudioRelease,
    StudioRisk,
)
from plane.studio.permissions import (
    StudioProjectAccessPermission,
    StudioWorkspaceAccessPermission,
    can_write_project,
    is_workspace_admin,
    visible_projects_for,
)
from plane.studio.serializers import (
    StudioDecisionSerializer,
    StudioProjectProfileSerializer,
    StudioReleaseSerializer,
    StudioRiskSerializer,
)
from plane.studio.services.health import build_health_context, evaluate_project_health
from plane.studio.services.projections import (
    portfolio_projection,
    project_overview_projection,
    today_projection,
)


def _project_for_request(request, slug, project_id):
    return get_object_or_404(
        visible_projects_for(request.user, slug).select_related("workspace"),
        id=project_id,
    )


class StudioProjectProfileEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        profile = StudioProjectProfile.objects.filter(project=project).select_related("operator", "project").first()
        if profile is None:
            return Response(
                {"error": "Studio project profile is not configured."},
                status=status.HTTP_404_NOT_FOUND,
            )
        context = build_health_context([project.id])
        health = evaluate_project_health(project, profile, context=context)
        return Response(
            StudioProjectProfileSerializer(
                profile,
                context={"project": project, "health": health},
            ).data
        )

    def patch(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        profile = StudioProjectProfile.objects.filter(project=project).first()
        serializer = StudioProjectProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        if profile is None:
            profile = serializer.save(project=project)
        else:
            profile = serializer.save()
        context = build_health_context([project.id])
        health = evaluate_project_health(project, profile, context=context)
        return Response(
            StudioProjectProfileSerializer(
                profile,
                context={"project": project, "health": health},
            ).data,
            status=status.HTTP_200_OK,
        )


class StudioReleaseListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        releases = StudioRelease.objects.filter(project=project).select_related("module")
        if request.GET.get("status"):
            releases = releases.filter(status=request.GET["status"])
        if request.GET.get("channel"):
            releases = releases.filter(channel=request.GET["channel"])
        return Response(StudioReleaseSerializer(releases, many=True).data)

    def post(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        serializer = StudioReleaseSerializer(
            data=request.data,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        release = serializer.save(project=project)
        return Response(
            StudioReleaseSerializer(release).data,
            status=status.HTTP_201_CREATED,
        )


class StudioReleaseDetailEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def _get_object(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        release = get_object_or_404(
            StudioRelease.objects.select_related("module"),
            project=project,
            id=pk,
        )
        return project, release

    def get(self, request, slug, project_id, pk):
        _, release = self._get_object(request, slug, project_id, pk)
        return Response(StudioReleaseSerializer(release).data)

    def patch(self, request, slug, project_id, pk):
        project, release = self._get_object(request, slug, project_id, pk)
        serializer = StudioReleaseSerializer(
            release,
            data=request.data,
            partial=True,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        release = serializer.save()
        return Response(StudioReleaseSerializer(release).data)

    def delete(self, request, slug, project_id, pk):
        _, release = self._get_object(request, slug, project_id, pk)
        release.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _visible_decisions(request, slug):
    project_ids = visible_projects_for(request.user, slug).values_list("id", flat=True)
    return StudioDecision.objects.filter(workspace__slug=slug).filter(
        Q(project__isnull=True) | Q(project_id__in=project_ids)
    )


def _can_mutate_decision(user, slug, decision):
    if is_workspace_admin(user, slug):
        return True
    if decision.project_id:
        return can_write_project(user, slug, decision.project_id)
    return False


class StudioDecisionListEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        decisions = _visible_decisions(request, slug).select_related("project", "proposer")
        if request.GET.get("status"):
            decisions = decisions.filter(status=request.GET["status"])
        if request.GET.get("project_id"):
            decisions = decisions.filter(project_id=request.GET["project_id"])
        return Response(StudioDecisionSerializer(decisions, many=True).data)

    def post(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        serializer = StudioDecisionSerializer(
            data=request.data,
            context={"workspace": workspace},
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.validated_data.get("project")
        if project is None and not is_workspace_admin(request.user, slug):
            raise PermissionDenied("Only a workspace admin can create a workspace-level decision.")
        if project and not can_write_project(request.user, slug, project.id):
            raise PermissionDenied("You do not have permission to write to this project.")
        decision = serializer.save(workspace=workspace, proposer=request.user)
        return Response(
            StudioDecisionSerializer(decision).data,
            status=status.HTTP_201_CREATED,
        )


class StudioDecisionDetailEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def _get_object(self, request, slug, pk):
        return get_object_or_404(
            _visible_decisions(request, slug).select_related("project", "proposer"),
            id=pk,
        )

    def get(self, request, slug, pk):
        decision = self._get_object(request, slug, pk)
        return Response(StudioDecisionSerializer(decision).data)

    def patch(self, request, slug, pk):
        decision = self._get_object(request, slug, pk)
        if not _can_mutate_decision(request.user, slug, decision):
            raise PermissionDenied("You do not have permission to update this decision.")
        serializer = StudioDecisionSerializer(
            decision,
            data=request.data,
            partial=True,
            context={"workspace": decision.workspace},
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.validated_data.get("project", decision.project)
        if (
            "project" in serializer.validated_data
            and getattr(project, "id", None) != decision.project_id
            and not is_workspace_admin(request.user, slug)
        ):
            raise PermissionDenied("Only a workspace admin can move a decision between scopes.")
        if project and not can_write_project(request.user, slug, project.id):
            raise PermissionDenied("You do not have permission to write to this project.")
        decision = serializer.save()
        return Response(StudioDecisionSerializer(decision).data)

    def delete(self, request, slug, pk):
        decision = self._get_object(request, slug, pk)
        if not _can_mutate_decision(request.user, slug, decision):
            raise PermissionDenied("You do not have permission to delete this decision.")
        decision.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioRiskListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        risks = StudioRisk.objects.filter(project=project).select_related("owner")
        if request.GET.get("status"):
            risks = risks.filter(status=request.GET["status"])
        if request.GET.get("is_blocker") in ("true", "false"):
            risks = risks.filter(is_blocker=request.GET["is_blocker"] == "true")
        return Response(StudioRiskSerializer(risks, many=True).data)

    def post(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        serializer = StudioRiskSerializer(
            data=request.data,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        risk = serializer.save(project=project)
        return Response(
            StudioRiskSerializer(risk).data,
            status=status.HTTP_201_CREATED,
        )


class StudioRiskDetailEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def _get_object(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        risk = get_object_or_404(
            StudioRisk.objects.select_related("owner"),
            project=project,
            id=pk,
        )
        return project, risk

    def get(self, request, slug, project_id, pk):
        _, risk = self._get_object(request, slug, project_id, pk)
        return Response(StudioRiskSerializer(risk).data)

    def patch(self, request, slug, project_id, pk):
        project, risk = self._get_object(request, slug, project_id, pk)
        serializer = StudioRiskSerializer(
            risk,
            data=request.data,
            partial=True,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        risk = serializer.save()
        return Response(StudioRiskSerializer(risk).data)

    def delete(self, request, slug, project_id, pk):
        _, risk = self._get_object(request, slug, project_id, pk)
        risk.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioTodayEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        return Response(today_projection(request.user, slug))


class StudioPortfolioEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        return Response(portfolio_projection(request.user, slug))


class StudioProjectOverviewEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        return Response(project_overview_projection(request.user, slug, project))

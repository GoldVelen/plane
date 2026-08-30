# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views import BaseAPIView
from plane.db.models import Workspace
from plane.studio.models import StudioEvent, StudioMetricDefinition, StudioMetricSnapshot, StudioWeeklyReview
from plane.studio.permissions import (
    StudioProjectAccessPermission,
    StudioWorkspaceAccessPermission,
    permission_summary,
    visible_projects_for,
)
from plane.studio.serializers import StudioEventSerializer
from plane.studio.serializers_cadence import (
    StudioMetricDefinitionSerializer,
    StudioMetricSnapshotSerializer,
    StudioWeeklyReviewSerializer,
)
from plane.studio.services.events import record_studio_event
from plane.studio.services.weeks import monday_of
from plane.studio.views import _project_for_request


class StudioMetricListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        metrics = StudioMetricDefinition.objects.filter(project=project).prefetch_related("snapshots")
        return Response(StudioMetricDefinitionSerializer(metrics, many=True).data)

    def post(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        serializer = StudioMetricDefinitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        metric = serializer.save(project=project)
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type="metric",
            entity_id=metric.id,
            action="created",
            payload={"key": metric.key},
        )
        return Response(StudioMetricDefinitionSerializer(metric).data, status=status.HTTP_201_CREATED)


class StudioMetricDetailEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def _get(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        metric = get_object_or_404(
            StudioMetricDefinition.objects.prefetch_related("snapshots"),
            project=project,
            id=pk,
        )
        return project, metric

    def get(self, request, slug, project_id, pk):
        _, metric = self._get(request, slug, project_id, pk)
        return Response(StudioMetricDefinitionSerializer(metric).data)

    def patch(self, request, slug, project_id, pk):
        project, metric = self._get(request, slug, project_id, pk)
        serializer = StudioMetricDefinitionSerializer(metric, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        metric = serializer.save()
        return Response(StudioMetricDefinitionSerializer(metric).data)

    def delete(self, request, slug, project_id, pk):
        _, metric = self._get(request, slug, project_id, pk)
        metric.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioMetricSnapshotListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def post(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        metric = get_object_or_404(StudioMetricDefinition, project=project, id=pk)
        serializer = StudioMetricSnapshotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        snapshot = serializer.save(project=project, metric_definition=metric)
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type="metric_snapshot",
            entity_id=snapshot.id,
            action="created",
            payload={"metric_id": str(metric.id), "numeric_value": snapshot.numeric_value},
        )
        return Response(StudioMetricSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)


class StudioTimelineEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        project_ids = list(visible_projects_for(request.user, slug).values_list("id", flat=True))
        events = (
            StudioEvent.objects.filter(workspace__slug=slug)
            .filter(Q(project_id__isnull=True) | Q(project_id__in=project_ids))
            .select_related("actor", "project")
            .order_by("-created_at")[:50]
        )
        return Response(
            {
                "events": StudioEventSerializer(events, many=True).data,
                "permissions": permission_summary(request.user, slug),
                "generated_at": timezone.now().isoformat(),
            }
        )


class StudioWeeklyReviewListEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        reviews = StudioWeeklyReview.objects.filter(workspace__slug=slug)
        if request.GET.get("week_start"):
            reviews = reviews.filter(week_start=request.GET["week_start"])
        return Response(StudioWeeklyReviewSerializer(reviews, many=True).data)

    def post(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        payload = dict(request.data)
        payload.setdefault("week_start", monday_of().isoformat())
        serializer = StudioWeeklyReviewSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        week_start = serializer.validated_data["week_start"]
        existing = StudioWeeklyReview.objects.filter(workspace=workspace, week_start=week_start).first()
        if existing:
            serializer = StudioWeeklyReviewSerializer(existing, data=payload, partial=True)
            serializer.is_valid(raise_exception=True)
            review = serializer.save()
            status_code = status.HTTP_200_OK
        else:
            review = serializer.save(workspace=workspace)
            status_code = status.HTTP_201_CREATED
        record_studio_event(
            workspace=workspace,
            project=None,
            actor=request.user,
            entity_type="weekly_review",
            entity_id=review.id,
            action="updated" if status_code == 200 else "created",
            payload={"week_start": str(review.week_start)},
        )
        return Response(StudioWeeklyReviewSerializer(review).data, status=status_code)


class StudioWeeklyReviewCurrentEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        week_start = monday_of()
        review = StudioWeeklyReview.objects.filter(workspace__slug=slug, week_start=week_start).first()
        if review is None:
            return Response(None)
        return Response(StudioWeeklyReviewSerializer(review).data)

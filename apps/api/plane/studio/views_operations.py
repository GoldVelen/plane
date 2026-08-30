# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views import BaseAPIView
from plane.studio.models import StudioContentItem, StudioExperiment, StudioFeedback, StudioRoutine
from plane.studio.permissions import (
    StudioProjectAccessPermission,
    StudioWorkspaceAccessPermission,
    permission_summary,
    visible_projects_for,
)
from plane.studio.serializers_operations import (
    StudioContentItemSerializer,
    StudioExperimentSerializer,
    StudioFeedbackSerializer,
    StudioRoutineSerializer,
)
from plane.studio.services.convert import convert_operating_record_to_issue
from plane.studio.services.events import record_studio_event
from plane.studio.views import _project_for_request


class StudioProjectEntityListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]
    model = None
    serializer_class = None
    entity_type = None

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        records = self.model.objects.filter(project=project).select_related("linked_issue", "linked_issue__project")
        if request.GET.get("status") and hasattr(self.model, "status"):
            records = records.filter(status=request.GET["status"])
        return Response(self.serializer_class(records, many=True, context={"project": project}).data)

    def post(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        serializer = self.serializer_class(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)
        record = serializer.save(project=project)
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type=self.entity_type,
            entity_id=record.id,
            action="created",
            payload={"status": getattr(record, "status", None)},
        )
        return Response(
            self.serializer_class(record, context={"project": project}).data,
            status=status.HTTP_201_CREATED,
        )


class StudioProjectEntityDetailEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]
    model = None
    serializer_class = None
    entity_type = None

    def _get_object(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        record = get_object_or_404(
            self.model.objects.select_related("linked_issue", "linked_issue__project"),
            project=project,
            id=pk,
        )
        return project, record

    def get(self, request, slug, project_id, pk):
        project, record = self._get_object(request, slug, project_id, pk)
        return Response(self.serializer_class(record, context={"project": project}).data)

    def patch(self, request, slug, project_id, pk):
        project, record = self._get_object(request, slug, project_id, pk)
        serializer = self.serializer_class(
            record,
            data=request.data,
            partial=True,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type=self.entity_type,
            entity_id=record.id,
            action="updated",
            payload={"status": getattr(record, "status", None)},
        )
        return Response(self.serializer_class(record, context={"project": project}).data)

    def delete(self, request, slug, project_id, pk):
        _, record = self._get_object(request, slug, project_id, pk)
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioProjectEntityConvertEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]
    model = None
    serializer_class = None
    entity_type = None

    def post(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        record = get_object_or_404(self.model, project=project, id=pk)
        converted = convert_operating_record_to_issue(
            record=record,
            actor=request.user,
            entity_type=self.entity_type,
        )
        return Response(self.serializer_class(converted, context={"project": project}).data)


class StudioFeedbackListEndpoint(StudioProjectEntityListEndpoint):
    model = StudioFeedback
    serializer_class = StudioFeedbackSerializer
    entity_type = "feedback"


class StudioFeedbackDetailEndpoint(StudioProjectEntityDetailEndpoint):
    model = StudioFeedback
    serializer_class = StudioFeedbackSerializer
    entity_type = "feedback"


class StudioFeedbackConvertEndpoint(StudioProjectEntityConvertEndpoint):
    model = StudioFeedback
    serializer_class = StudioFeedbackSerializer
    entity_type = "feedback"


class StudioContentListEndpoint(StudioProjectEntityListEndpoint):
    model = StudioContentItem
    serializer_class = StudioContentItemSerializer
    entity_type = "content"


class StudioContentDetailEndpoint(StudioProjectEntityDetailEndpoint):
    model = StudioContentItem
    serializer_class = StudioContentItemSerializer
    entity_type = "content"


class StudioContentConvertEndpoint(StudioProjectEntityConvertEndpoint):
    model = StudioContentItem
    serializer_class = StudioContentItemSerializer
    entity_type = "content"


class StudioRoutineListEndpoint(StudioProjectEntityListEndpoint):
    model = StudioRoutine
    serializer_class = StudioRoutineSerializer
    entity_type = "routine"


class StudioRoutineDetailEndpoint(StudioProjectEntityDetailEndpoint):
    model = StudioRoutine
    serializer_class = StudioRoutineSerializer
    entity_type = "routine"


class StudioRoutineConvertEndpoint(StudioProjectEntityConvertEndpoint):
    model = StudioRoutine
    serializer_class = StudioRoutineSerializer
    entity_type = "routine"


class StudioExperimentListEndpoint(StudioProjectEntityListEndpoint):
    model = StudioExperiment
    serializer_class = StudioExperimentSerializer
    entity_type = "experiment"


class StudioExperimentDetailEndpoint(StudioProjectEntityDetailEndpoint):
    model = StudioExperiment
    serializer_class = StudioExperimentSerializer
    entity_type = "experiment"


class StudioExperimentConvertEndpoint(StudioProjectEntityConvertEndpoint):
    model = StudioExperiment
    serializer_class = StudioExperimentSerializer
    entity_type = "experiment"


class StudioOperationsEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug):
        now = timezone.now()
        projects = list(visible_projects_for(request.user, slug).order_by("name"))
        project_ids = [project.id for project in projects]
        related = ("project", "linked_issue", "linked_issue__project")
        return Response(
            {
                "projects": [
                    {
                        "id": str(project.id),
                        "name": project.name,
                        "identifier": project.identifier,
                    }
                    for project in projects
                ],
                "feedback": StudioFeedbackSerializer(
                    StudioFeedback.objects.filter(project_id__in=project_ids).select_related(*related),
                    many=True,
                ).data,
                "content_items": StudioContentItemSerializer(
                    StudioContentItem.objects.filter(project_id__in=project_ids).select_related(*related),
                    many=True,
                ).data,
                "routines": StudioRoutineSerializer(
                    StudioRoutine.objects.filter(project_id__in=project_ids).select_related(*related),
                    many=True,
                ).data,
                "experiments": StudioExperimentSerializer(
                    StudioExperiment.objects.filter(project_id__in=project_ids).select_related(*related),
                    many=True,
                ).data,
                "permissions": permission_summary(request.user, slug),
                "generated_at": now.isoformat(),
            }
        )

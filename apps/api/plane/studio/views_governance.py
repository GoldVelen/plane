# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from plane.app.views import BaseAPIView
from plane.db.models import WorkspaceMember
from plane.studio.models import (
    AcknowledgementState,
    StudioDecision,
    StudioDecisionAcknowledgement,
    StudioDecisionOption,
    StudioEvent,
    StudioMilestone,
    StudioRelease,
    StudioReleaseChecklistItem,
)
from plane.studio.permissions import StudioProjectAccessPermission, StudioWorkspaceAccessPermission, can_write_project
from plane.studio.serializers import (
    StudioDecisionAcknowledgementSerializer,
    StudioDecisionOptionSerializer,
    StudioEventSerializer,
    StudioMilestoneSerializer,
    StudioReleaseChecklistItemSerializer,
)
from plane.studio.services.events import record_studio_event
from plane.studio.views import _can_mutate_decision, _project_for_request, _visible_decisions


class StudioDecisionOptionListEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug, pk):
        decision = get_object_or_404(_visible_decisions(request, slug), id=pk)
        return Response(StudioDecisionOptionSerializer(decision.options.all(), many=True).data)

    def post(self, request, slug, pk):
        decision = get_object_or_404(_visible_decisions(request, slug), id=pk)
        if not _can_mutate_decision(request.user, slug, decision):
            raise PermissionDenied("You do not have permission to update this decision.")
        serializer = StudioDecisionOptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        option = serializer.save(decision=decision, workspace=decision.workspace, project=decision.project)
        record_studio_event(
            workspace=decision.workspace,
            project=decision.project,
            actor=request.user,
            entity_type="decision",
            entity_id=decision.id,
            action="option_added",
            payload={"option_id": str(option.id)},
        )
        return Response(StudioDecisionOptionSerializer(option).data, status=status.HTTP_201_CREATED)


class StudioDecisionOptionDetailEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def _get(self, request, slug, pk, option_id):
        decision = get_object_or_404(_visible_decisions(request, slug), id=pk)
        option = get_object_or_404(StudioDecisionOption, decision=decision, id=option_id)
        return decision, option

    def patch(self, request, slug, pk, option_id):
        decision, option = self._get(request, slug, pk, option_id)
        if not _can_mutate_decision(request.user, slug, decision):
            raise PermissionDenied("You do not have permission to update this decision.")
        serializer = StudioDecisionOptionSerializer(option, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        option = serializer.save()
        return Response(StudioDecisionOptionSerializer(option).data)

    def delete(self, request, slug, pk, option_id):
        decision, option = self._get(request, slug, pk, option_id)
        if not _can_mutate_decision(request.user, slug, decision):
            raise PermissionDenied("You do not have permission to update this decision.")
        option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioDecisionAcknowledgementListEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def get(self, request, slug, pk):
        decision = get_object_or_404(_visible_decisions(request, slug), id=pk)
        return Response(
            StudioDecisionAcknowledgementSerializer(decision.acknowledgements.select_related("user"), many=True).data
        )

    def post(self, request, slug, pk):
        decision = get_object_or_404(_visible_decisions(request, slug), id=pk)
        if not _can_mutate_decision(request.user, slug, decision):
            raise PermissionDenied("You do not have permission to update this decision.")
        user_id = request.data.get("user_id")
        member = get_object_or_404(
            WorkspaceMember.objects.filter(workspace=decision.workspace, is_active=True),
            member_id=user_id,
        )
        ack, created = StudioDecisionAcknowledgement.objects.get_or_create(
            decision=decision,
            user=member.member,
            defaults={"workspace": decision.workspace, "project": decision.project},
        )
        if not created:
            return Response(StudioDecisionAcknowledgementSerializer(ack).data, status=status.HTTP_200_OK)
        record_studio_event(
            workspace=decision.workspace,
            project=decision.project,
            actor=request.user,
            entity_type="decision",
            entity_id=decision.id,
            action="acknowledgement_requested",
            payload={"user_id": str(member.member_id)},
        )
        return Response(StudioDecisionAcknowledgementSerializer(ack).data, status=status.HTTP_201_CREATED)


class StudioDecisionAcknowledgementSelfEndpoint(BaseAPIView):
    permission_classes = [StudioWorkspaceAccessPermission]

    def patch(self, request, slug, pk):
        decision = get_object_or_404(_visible_decisions(request, slug), id=pk)
        ack = get_object_or_404(StudioDecisionAcknowledgement, decision=decision, user=request.user)
        serializer = StudioDecisionAcknowledgementSerializer(ack, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        state = serializer.validated_data.get("state", ack.state)
        ack = serializer.save(
            acted_at=timezone.now() if state != AcknowledgementState.PENDING else ack.acted_at,
        )
        record_studio_event(
            workspace=decision.workspace,
            project=decision.project,
            actor=request.user,
            entity_type="decision",
            entity_id=decision.id,
            action="acknowledged",
            payload={"state": ack.state},
        )
        return Response(StudioDecisionAcknowledgementSerializer(ack).data)


class StudioMilestoneListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        milestones = StudioMilestone.objects.filter(project=project).select_related("release", "owner")
        return Response(StudioMilestoneSerializer(milestones, many=True, context={"project": project}).data)

    def post(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        serializer = StudioMilestoneSerializer(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save(project=project)
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type="milestone",
            entity_id=milestone.id,
            action="created",
            payload={"title": milestone.title},
        )
        return Response(
            StudioMilestoneSerializer(milestone, context={"project": project}).data,
            status=status.HTTP_201_CREATED,
        )


class StudioMilestoneDetailEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def _get(self, request, slug, project_id, pk):
        project = _project_for_request(request, slug, project_id)
        milestone = get_object_or_404(StudioMilestone, project=project, id=pk)
        return project, milestone

    def patch(self, request, slug, project_id, pk):
        project, milestone = self._get(request, slug, project_id, pk)
        serializer = StudioMilestoneSerializer(
            milestone, data=request.data, partial=True, context={"project": project}
        )
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save()
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type="milestone",
            entity_id=milestone.id,
            action="updated",
            payload={"status": milestone.status},
        )
        return Response(StudioMilestoneSerializer(milestone, context={"project": project}).data)

    def delete(self, request, slug, project_id, pk):
        project, milestone = self._get(request, slug, project_id, pk)
        milestone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudioReleaseChecklistItemEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def patch(self, request, slug, project_id, pk, item_id):
        project = _project_for_request(request, slug, project_id)
        release = get_object_or_404(StudioRelease, project=project, id=pk)
        item = get_object_or_404(StudioReleaseChecklistItem, release=release, id=item_id)
        serializer = StudioReleaseChecklistItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        is_done = serializer.validated_data.get("is_done", item.is_done)
        item = serializer.save(done_at=timezone.now() if is_done else None)
        record_studio_event(
            workspace=project.workspace,
            project=project,
            actor=request.user,
            entity_type="release",
            entity_id=release.id,
            action="checklist_updated",
            payload={"key": item.key, "is_done": item.is_done},
        )
        return Response(StudioReleaseChecklistItemSerializer(item).data)


class StudioProjectEventListEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        events = StudioEvent.objects.filter(project=project)[:50]
        return Response(StudioEventSerializer(events, many=True).data)

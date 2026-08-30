# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.studio.models import StudioContentItem, StudioExperiment, StudioFeedback, StudioRoutine
from plane.studio.services.transitions import allowed_statuses, assert_transition


def _linked_issue_payload(instance):
    issue = instance.linked_issue
    if issue is None:
        return None
    project = issue.project
    return {
        "id": str(issue.id),
        "name": issue.name,
        "sequence_id": issue.sequence_id,
        "project_id": str(issue.project_id),
        "project_identifier": project.identifier if project else None,
    }


class LinkedIssueMixin(serializers.Serializer):
    linked_issue_id = serializers.UUIDField(read_only=True)
    linked_issue = serializers.SerializerMethodField()
    allowed_next_statuses = serializers.SerializerMethodField()

    def get_linked_issue(self, instance):
        return _linked_issue_payload(instance)


class StudioFeedbackSerializer(LinkedIssueMixin, serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioFeedback
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "title",
            "body",
            "source",
            "sentiment",
            "priority",
            "status",
            "category",
            "reporter_name",
            "source_url",
            "linked_issue_id",
            "linked_issue",
            "allowed_next_statuses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "created_at", "updated_at")

    def get_allowed_next_statuses(self, instance):
        current = instance.status if instance and instance.pk else "INBOX"
        return list(allowed_statuses("feedback", current))

    def validate(self, attrs):
        if self.instance and "status" in attrs:
            assert_transition("feedback", self.instance.status, attrs["status"])
        return attrs


class StudioContentItemSerializer(LinkedIssueMixin, serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioContentItem
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "title",
            "brief",
            "channel",
            "status",
            "planned_at",
            "published_at",
            "published_url",
            "notes",
            "linked_issue_id",
            "linked_issue",
            "allowed_next_statuses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "created_at", "updated_at")

    def get_allowed_next_statuses(self, instance):
        return []


class StudioRoutineSerializer(LinkedIssueMixin, serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioRoutine
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "name",
            "cadence",
            "is_active",
            "next_due_at",
            "notes",
            "linked_issue_id",
            "linked_issue",
            "allowed_next_statuses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "created_at", "updated_at")

    def get_allowed_next_statuses(self, instance):
        return []


class StudioExperimentSerializer(LinkedIssueMixin, serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioExperiment
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "title",
            "hypothesis",
            "status",
            "start_at",
            "end_at",
            "result",
            "conclusion",
            "linked_issue_id",
            "linked_issue",
            "allowed_next_statuses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "created_at", "updated_at")

    def get_allowed_next_statuses(self, instance):
        current = instance.status if instance and instance.pk else "DRAFT"
        return list(allowed_statuses("experiment", current))

    def validate(self, attrs):
        if self.instance and "status" in attrs:
            assert_transition("experiment", self.instance.status, attrs["status"])
        return attrs

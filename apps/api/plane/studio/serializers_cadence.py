# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.studio.models import StudioMetricDefinition, StudioMetricSnapshot, StudioWeeklyReview
from plane.studio.services.metrics import metric_series_payload


class StudioMetricSnapshotSerializer(serializers.ModelSerializer):
    metric_definition_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioMetricSnapshot
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "metric_definition_id",
            "captured_at",
            "numeric_value",
            "text_value",
            "source",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "metric_definition_id", "created_at", "updated_at")

    def validate(self, attrs):
        if attrs.get("numeric_value") is None and not (attrs.get("text_value") or "").strip():
            raise serializers.ValidationError({"numeric_value": "A snapshot needs a numeric or text value."})
        return attrs


class StudioMetricDefinitionSerializer(serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    series = serializers.SerializerMethodField()

    class Meta:
        model = StudioMetricDefinition
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "name",
            "key",
            "unit",
            "direction",
            "target_value",
            "frequency",
            "source_type",
            "is_core",
            "is_active",
            "series",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "created_at", "updated_at")

    def get_series(self, instance):
        snapshots = instance.snapshots.all() if instance.pk else []
        return metric_series_payload(snapshots)

    def validate_key(self, value):
        key = (value or "").strip().lower()
        if not key:
            raise serializers.ValidationError("Metric key is required.")
        return key


class StudioWeeklyReviewSerializer(serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioWeeklyReview
        fields = (
            "id",
            "workspace_id",
            "week_start",
            "retrospective",
            "health_summary",
            "focus",
            "risks",
            "next_steps",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "created_at", "updated_at")

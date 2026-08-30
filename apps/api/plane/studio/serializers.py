# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from rest_framework import serializers

from plane.db.models import Module, Project, User, WorkspaceMember
from plane.studio.models import (
    StudioDecision,
    StudioProjectProfile,
    StudioRelease,
    StudioRisk,
)
from plane.studio.services.health import advancement_expectation, evaluate_project_health


class StudioProjectProfileSerializer(serializers.ModelSerializer):
    EXPECTATION_RESET_FIELDS = (
        "portfolio_bucket",
        "lifecycle_stage",
        "focus_statement",
        "expected_update_interval_days",
    )

    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    operator_id = serializers.PrimaryKeyRelatedField(
        source="operator",
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    created_by_id = serializers.UUIDField(read_only=True)
    updated_by_id = serializers.UUIDField(read_only=True)
    health = serializers.SerializerMethodField()

    class Meta:
        model = StudioProjectProfile
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "product_type",
            "portfolio_bucket",
            "lifecycle_stage",
            "priority",
            "operator_id",
            "focus_statement",
            "expected_update_interval_days",
            "progress_expected_since",
            "last_meaningful_activity_at",
            "manual_health",
            "manual_health_reason",
            "manual_health_expires_at",
            "health",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )
        read_only_fields = (
            "id",
            "workspace_id",
            "project_id",
            "progress_expected_since",
            "health",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )

    def get_health(self, instance):
        health = self.context.get("health")
        return health or evaluate_project_health(instance.project, instance)

    def validate(self, attrs):
        instance = self.instance
        project = self.context["project"]
        operator = attrs.get("operator", instance.operator if instance else None)
        if (
            operator
            and not WorkspaceMember.objects.filter(
                workspace=project.workspace,
                member=operator,
                is_active=True,
            ).exists()
        ):
            raise serializers.ValidationError({"operator_id": "Operator must be an active member of this workspace."})

        manual_health = attrs.get("manual_health", instance.manual_health if instance else None)
        manual_reason = attrs.get("manual_health_reason", instance.manual_health_reason if instance else None)
        manual_expires = attrs.get(
            "manual_health_expires_at",
            instance.manual_health_expires_at if instance else None,
        )
        if manual_health and not (manual_reason and manual_reason.strip()):
            raise serializers.ValidationError({"manual_health_reason": "A manual health override requires a reason."})
        if (
            manual_health
            and "manual_health_expires_at" in attrs
            and manual_expires is not None
            and manual_expires <= timezone.now()
        ):
            raise serializers.ValidationError(
                {"manual_health_expires_at": "A new manual health override must expire in the future."}
            )
        if "manual_health" in attrs and not manual_health:
            attrs["manual_health_reason"] = None
            attrs["manual_health_expires_at"] = None

        activity_at = attrs.get("last_meaningful_activity_at")
        if activity_at is not None and activity_at > timezone.now():
            raise serializers.ValidationError(
                {"last_meaningful_activity_at": "Meaningful activity cannot be in the future."}
            )
        return attrs

    @staticmethod
    def _is_expected(portfolio_bucket, lifecycle_stage, focus_statement):
        expected, _, _, _ = advancement_expectation(
            portfolio_bucket,
            lifecycle_stage,
            focus_statement,
        )
        return expected

    def create(self, validated_data):
        if self._is_expected(
            validated_data.get("portfolio_bucket", StudioProjectProfile._meta.get_field("portfolio_bucket").default),
            validated_data.get("lifecycle_stage", StudioProjectProfile._meta.get_field("lifecycle_stage").default),
            validated_data.get("focus_statement", ""),
        ):
            validated_data["progress_expected_since"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        was_expected = self._is_expected(
            instance.portfolio_bucket,
            instance.lifecycle_stage,
            instance.focus_statement,
        )
        focus_statement = validated_data.get("focus_statement", instance.focus_statement)
        if isinstance(focus_statement, str):
            focus_statement = focus_statement.strip()
        will_be_expected = self._is_expected(
            validated_data.get("portfolio_bucket", instance.portfolio_bucket),
            validated_data.get("lifecycle_stage", instance.lifecycle_stage),
            focus_statement,
        )
        expectation_redefined = any(
            field in validated_data
            and (
                (
                    validated_data[field].strip()
                    if field == "focus_statement" and isinstance(validated_data[field], str)
                    else validated_data[field]
                )
                != (
                    instance.focus_statement.strip()
                    if field == "focus_statement" and isinstance(instance.focus_statement, str)
                    else getattr(instance, field)
                )
            )
            for field in self.EXPECTATION_RESET_FIELDS
        )
        if will_be_expected and not was_expected:
            validated_data["progress_expected_since"] = timezone.now()
        elif will_be_expected and expectation_redefined:
            validated_data["progress_expected_since"] = timezone.now()
        elif not will_be_expected:
            validated_data["progress_expected_since"] = None
        return super().update(instance, validated_data)


class StudioReleaseSerializer(serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    module_id = serializers.PrimaryKeyRelatedField(
        source="module",
        queryset=Module.objects.all(),
        allow_null=True,
        required=False,
    )
    created_by_id = serializers.UUIDField(read_only=True)
    updated_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioRelease
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "module_id",
            "name",
            "version",
            "channel",
            "status",
            "target_at",
            "released_at",
            "scope_summary",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )
        read_only_fields = (
            "id",
            "workspace_id",
            "project_id",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )

    def validate(self, attrs):
        project = self.context["project"]
        module = attrs.get("module", self.instance.module if self.instance else None)
        if module and module.project_id != project.id:
            raise serializers.ValidationError({"module_id": "Module must belong to the release project."})
        version = attrs.get("version", self.instance.version if self.instance else None)
        if version:
            existing = StudioRelease.objects.filter(project=project, version=version)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError(
                    {"version": "An active release with this version already exists in the project."}
                )
        return attrs


class StudioDecisionSerializer(serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        source="project",
        queryset=Project.objects.all(),
        allow_null=True,
        required=False,
    )
    proposer_id = serializers.UUIDField(read_only=True)
    created_by_id = serializers.UUIDField(read_only=True)
    updated_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioDecision
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "title",
            "question",
            "context",
            "recommendation",
            "final_decision",
            "status",
            "due_at",
            "decided_at",
            "proposer_id",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )
        read_only_fields = (
            "id",
            "workspace_id",
            "proposer_id",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )

    def validate_project_id(self, project):
        workspace = self.context["workspace"]
        if project is not None and project.workspace_id != workspace.id:
            raise serializers.ValidationError("Project must belong to this workspace.")
        return project


class StudioRiskSerializer(serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner",
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    created_by_id = serializers.UUIDField(read_only=True)
    updated_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioRisk
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "type",
            "title",
            "description",
            "probability",
            "impact",
            "score",
            "is_blocker",
            "status",
            "mitigation",
            "owner_id",
            "due_at",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )
        read_only_fields = (
            "id",
            "workspace_id",
            "project_id",
            "score",
            "created_at",
            "updated_at",
            "created_by_id",
            "updated_by_id",
        )

    def validate_owner_id(self, owner):
        if owner is None:
            return owner
        project = self.context["project"]
        if not WorkspaceMember.objects.filter(
            workspace=project.workspace,
            member=owner,
            is_active=True,
        ).exists():
            raise serializers.ValidationError("Owner must be an active member of this workspace.")
        return owner

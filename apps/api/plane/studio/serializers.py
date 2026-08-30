# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from rest_framework import serializers

from plane.db.models import Module, Project, User, WorkspaceMember
from plane.studio.models import (
    AcknowledgementState,
    DecisionMode,
    DecisionStatus,
    StudioDecision,
    StudioDecisionAcknowledgement,
    StudioDecisionOption,
    StudioEvent,
    StudioMilestone,
    StudioProjectProfile,
    StudioRelease,
    StudioReleaseChecklistItem,
    StudioRisk,
)
from plane.studio.services.health import advancement_expectation, evaluate_project_health
from plane.studio.services.transitions import allowed_statuses, assert_transition


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
    checklist_items = serializers.SerializerMethodField()
    allowed_next_statuses = serializers.SerializerMethodField()

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
            "checklist_items",
            "allowed_next_statuses",
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
        extra_kwargs = {
            "checklist_items": {"read_only": True},
            "allowed_next_statuses": {"read_only": True},
        }

    def get_checklist_items(self, instance):
        items = instance.checklist_items.all() if instance.pk else []
        return StudioReleaseChecklistItemSerializer(items, many=True).data

    def get_allowed_next_statuses(self, instance):
        if not instance.pk:
            return list(allowed_statuses("release", instance.status if instance else "PLANNED"))
        return list(allowed_statuses("release", instance.status))

    def validate(self, attrs):
        project = self.context["project"]
        if self.instance and "status" in attrs:
            assert_transition("release", self.instance.status, attrs["status"])
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
    options = serializers.SerializerMethodField()
    acknowledgements = serializers.SerializerMethodField()
    allowed_next_statuses = serializers.SerializerMethodField()

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
            "rationale",
            "status",
            "decision_mode",
            "due_at",
            "decided_at",
            "revisit_condition",
            "revisit_at",
            "proposer_id",
            "options",
            "acknowledgements",
            "allowed_next_statuses",
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

    def get_options(self, instance):
        if not instance.pk:
            return []
        return StudioDecisionOptionSerializer(instance.options.all(), many=True).data

    def get_acknowledgements(self, instance):
        if not instance.pk:
            return []
        return StudioDecisionAcknowledgementSerializer(instance.acknowledgements.select_related("user"), many=True).data

    def get_allowed_next_statuses(self, instance):
        current = instance.status if instance and instance.pk else DecisionStatus.DRAFT
        return list(allowed_statuses("decision", current))

    def validate_project_id(self, project):
        workspace = self.context["workspace"]
        if project is not None and project.workspace_id != workspace.id:
            raise serializers.ValidationError("Project must belong to this workspace.")
        return project

    def validate(self, attrs):
        instance = self.instance
        if instance and "status" in attrs:
            assert_transition("decision", instance.status, attrs["status"])
            if attrs["status"] == DecisionStatus.DECIDED:
                final_decision = attrs.get("final_decision", instance.final_decision)
                if not (final_decision or "").strip():
                    raise serializers.ValidationError(
                        {"final_decision": "A decided outcome requires a final decision."}
                    )
                mode = attrs.get("decision_mode", instance.decision_mode)
                if mode in (DecisionMode.ACK_REQUIRED, DecisionMode.BOTH_REQUIRED):
                    acks = list(instance.acknowledgements.all())
                    if any(ack.state == AcknowledgementState.OBJECTED for ack in acks):
                        raise serializers.ValidationError({"status": "An objection is blocking this decision."})
                    approved = sum(1 for ack in acks if ack.state == AcknowledgementState.APPROVED)
                    required = 2 if mode == DecisionMode.BOTH_REQUIRED else 1
                    if approved < required:
                        raise serializers.ValidationError(
                            {"status": "This decision still needs required acknowledgements."}
                        )
                attrs.setdefault("decided_at", timezone.now())
        return attrs


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
    allowed_next_statuses = serializers.SerializerMethodField()

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
            "allowed_next_statuses",
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

    def get_allowed_next_statuses(self, instance):
        current = instance.status if instance and instance.pk else "OPEN"
        return list(allowed_statuses("risk", current))

    def validate(self, attrs):
        if self.instance and "status" in attrs:
            assert_transition("risk", self.instance.status, attrs["status"])
        return attrs

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


class StudioReleaseChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudioReleaseChecklistItem
        fields = ("id", "release_id", "key", "title", "is_done", "done_at", "sort_order")
        read_only_fields = ("id", "release_id", "key", "title", "sort_order")


class StudioDecisionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudioDecisionOption
        fields = ("id", "decision_id", "title", "description", "benefits", "costs", "risks", "sort_order")
        read_only_fields = ("id", "decision_id")


class StudioDecisionAcknowledgementSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioDecisionAcknowledgement
        fields = ("id", "decision_id", "user_id", "state", "note", "acted_at")
        read_only_fields = ("id", "decision_id", "user_id", "acted_at")


class StudioMilestoneSerializer(serializers.ModelSerializer):
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    release_id = serializers.PrimaryKeyRelatedField(
        source="release",
        queryset=StudioRelease.objects.all(),
        allow_null=True,
        required=False,
    )
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner",
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    allowed_next_statuses = serializers.SerializerMethodField()

    class Meta:
        model = StudioMilestone
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "release_id",
            "type",
            "title",
            "description",
            "target_at",
            "status",
            "owner_id",
            "completed_at",
            "allowed_next_statuses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace_id", "project_id", "created_at", "updated_at")

    def get_allowed_next_statuses(self, instance):
        current = instance.status if instance and instance.pk else "PLANNED"
        return list(allowed_statuses("milestone", current))

    def validate(self, attrs):
        project = self.context["project"]
        if self.instance and "status" in attrs:
            assert_transition("milestone", self.instance.status, attrs["status"])
        release = attrs.get("release", self.instance.release if self.instance else None)
        if release and release.project_id != project.id:
            raise serializers.ValidationError({"release_id": "Release must belong to this project."})
        return attrs


class StudioEventSerializer(serializers.ModelSerializer):
    actor_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    workspace_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = StudioEvent
        fields = (
            "id",
            "workspace_id",
            "project_id",
            "actor_id",
            "entity_type",
            "entity_id",
            "action",
            "payload",
            "created_at",
        )
        read_only_fields = fields

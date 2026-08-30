# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from plane.db.models import ProjectBaseModel, WorkspaceBaseModel


class ProductType(models.TextChoices):
    IOS_APP = "IOS_APP", "iOS app"
    WECHAT_MINI_PROGRAM = "WECHAT_MINI_PROGRAM", "WeChat mini program"
    WEB_APP = "WEB_APP", "Web app"
    SERVICE = "SERVICE", "Service"
    CONTENT = "CONTENT", "Content"
    RESEARCH = "RESEARCH", "Research"
    OTHER = "OTHER", "Other"


class PortfolioBucket(models.TextChoices):
    FOCUS = "FOCUS", "Focus"
    NEXT = "NEXT", "Next"
    INCUBATING = "INCUBATING", "Incubating"
    KEEP_ALIVE = "KEEP_ALIVE", "Keep alive"
    PAUSED = "PAUSED", "Paused"
    ARCHIVED = "ARCHIVED", "Archived"


class LifecycleStage(models.TextChoices):
    IDEA = "IDEA", "Idea"
    RESEARCH = "RESEARCH", "Research"
    VALIDATED = "VALIDATED", "Validated"
    DESIGN = "DESIGN", "Design"
    BUILD = "BUILD", "Build"
    TEST = "TEST", "Test"
    RELEASE_READY = "RELEASE_READY", "Release ready"
    LIVE = "LIVE", "Live"
    GROWTH = "GROWTH", "Growth"
    MAINTENANCE = "MAINTENANCE", "Maintenance"


class OperatingPriority(models.TextChoices):
    P0 = "P0", "P0"
    P1 = "P1", "P1"
    P2 = "P2", "P2"
    P3 = "P3", "P3"


class HealthStatus(models.TextChoices):
    ON_TRACK = "ON_TRACK", "On track"
    AT_RISK = "AT_RISK", "At risk"
    BLOCKED = "BLOCKED", "Blocked"
    STALE = "STALE", "Stale"
    PAUSED = "PAUSED", "Paused"


class ReleaseChannel(models.TextChoices):
    INTERNAL = "INTERNAL", "Internal"
    TEST = "TEST", "Test"
    BETA = "BETA", "Beta"
    PRODUCTION = "PRODUCTION", "Production"


class ReleaseStatus(models.TextChoices):
    PLANNED = "PLANNED", "Planned"
    SCOPING = "SCOPING", "Scoping"
    BUILDING = "BUILDING", "Building"
    QA = "QA", "QA"
    READY = "READY", "Ready"
    SUBMITTED = "SUBMITTED", "Submitted"
    REVIEW = "REVIEW", "Review"
    RELEASED = "RELEASED", "Released"
    ROLLED_BACK = "ROLLED_BACK", "Rolled back"
    CANCELLED = "CANCELLED", "Cancelled"


class DecisionStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    NEEDS_DECISION = "NEEDS_DECISION", "Needs decision"
    DECIDED = "DECIDED", "Decided"
    REVISIT = "REVISIT", "Revisit"
    REVERSED = "REVERSED", "Reversed"
    CANCELLED = "CANCELLED", "Cancelled"


class RiskType(models.TextChoices):
    PRODUCT = "PRODUCT", "Product"
    TECHNICAL = "TECHNICAL", "Technical"
    DELIVERY = "DELIVERY", "Delivery"
    LEGAL = "LEGAL", "Legal"
    FINANCIAL = "FINANCIAL", "Financial"
    MARKET = "MARKET", "Market"
    OPERATIONS = "OPERATIONS", "Operations"
    SECURITY = "SECURITY", "Security"


class RiskStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    MITIGATING = "MITIGATING", "Mitigating"
    MONITORING = "MONITORING", "Monitoring"
    ACCEPTED = "ACCEPTED", "Accepted"
    CLOSED = "CLOSED", "Closed"


class StudioProjectProfile(ProjectBaseModel):
    product_type = models.CharField(max_length=32, choices=ProductType.choices, default=ProductType.OTHER)
    portfolio_bucket = models.CharField(
        max_length=24,
        choices=PortfolioBucket.choices,
        default=PortfolioBucket.INCUBATING,
        db_index=True,
    )
    lifecycle_stage = models.CharField(
        max_length=24,
        choices=LifecycleStage.choices,
        default=LifecycleStage.IDEA,
        db_index=True,
    )
    priority = models.CharField(max_length=2, choices=OperatingPriority.choices, default=OperatingPriority.P2)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="operated_studio_projects",
        null=True,
        blank=True,
    )
    focus_statement = models.CharField(max_length=300, blank=True, default="")
    expected_update_interval_days = models.PositiveSmallIntegerField(
        default=14,
        validators=[MinValueValidator(1), MaxValueValidator(365)],
    )
    progress_expected_since = models.DateTimeField(null=True, blank=True)
    last_meaningful_activity_at = models.DateTimeField(null=True, blank=True)
    manual_health = models.CharField(max_length=16, choices=HealthStatus.choices, null=True, blank=True)
    manual_health_reason = models.CharField(max_length=500, null=True, blank=True)
    manual_health_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "studio_project_profiles"
        ordering = ("project__name",)
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True),
                name="studio_profile_unique_active_project",
            )
        ]


class StudioRelease(ProjectBaseModel):
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.SET_NULL,
        related_name="studio_releases",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=80)
    version = models.CharField(max_length=40)
    channel = models.CharField(max_length=16, choices=ReleaseChannel.choices, default=ReleaseChannel.INTERNAL)
    status = models.CharField(max_length=16, choices=ReleaseStatus.choices, default=ReleaseStatus.PLANNED)
    target_at = models.DateTimeField(null=True, blank=True, db_index=True)
    released_at = models.DateTimeField(null=True, blank=True)
    scope_summary = models.TextField(max_length=2000, blank=True, default="")

    class Meta:
        db_table = "studio_releases"
        ordering = ("target_at", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "version"],
                condition=Q(deleted_at__isnull=True),
                name="studio_release_unique_active_version",
            )
        ]


class StudioDecision(WorkspaceBaseModel):
    title = models.CharField(max_length=160)
    question = models.TextField(max_length=2000)
    context = models.TextField(max_length=5000, blank=True, default="")
    recommendation = models.TextField(max_length=5000, blank=True, default="")
    final_decision = models.TextField(max_length=5000, blank=True, default="")
    status = models.CharField(max_length=24, choices=DecisionStatus.choices, default=DecisionStatus.DRAFT)
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    proposer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="proposed_studio_decisions",
    )

    class Meta:
        db_table = "studio_decisions"
        ordering = ("due_at", "-created_at")


class StudioRisk(ProjectBaseModel):
    type = models.CharField(max_length=16, choices=RiskType.choices)
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=5000, blank=True, default="")
    probability = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    impact = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    score = models.PositiveSmallIntegerField(editable=False)
    is_blocker = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=16, choices=RiskStatus.choices, default=RiskStatus.OPEN)
    mitigation = models.TextField(max_length=5000, blank=True, default="")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="owned_studio_risks",
        null=True,
        blank=True,
    )
    due_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.score = self.probability * self.impact
        super().save(*args, **kwargs)

    class Meta:
        db_table = "studio_risks"
        ordering = ("-score", "due_at", "-created_at")

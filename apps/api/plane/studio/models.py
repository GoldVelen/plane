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


class DecisionMode(models.TextChoices):
    SINGLE = "SINGLE", "Single"
    ACK_REQUIRED = "ACK_REQUIRED", "Acknowledgement required"
    BOTH_REQUIRED = "BOTH_REQUIRED", "Both required"
    RECORD_ONLY = "RECORD_ONLY", "Record only"


class AcknowledgementState(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    OBJECTED = "OBJECTED", "Objected"


class MilestoneType(models.TextChoices):
    PRODUCT = "PRODUCT", "Product"
    OPERATING = "OPERATING", "Operating"
    GOVERNANCE = "GOVERNANCE", "Governance"


class MilestoneStatus(models.TextChoices):
    PLANNED = "PLANNED", "Planned"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    DONE = "DONE", "Done"
    MISSED = "MISSED", "Missed"
    CANCELLED = "CANCELLED", "Cancelled"


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
    rationale = models.TextField(max_length=5000, blank=True, default="")
    status = models.CharField(max_length=24, choices=DecisionStatus.choices, default=DecisionStatus.DRAFT)
    decision_mode = models.CharField(
        max_length=24,
        choices=DecisionMode.choices,
        default=DecisionMode.RECORD_ONLY,
    )
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    revisit_condition = models.CharField(max_length=500, blank=True, default="")
    revisit_at = models.DateTimeField(null=True, blank=True)
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


class StudioDecisionOption(WorkspaceBaseModel):
    decision = models.ForeignKey(
        StudioDecision,
        on_delete=models.CASCADE,
        related_name="options",
    )
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=2000, blank=True, default="")
    benefits = models.TextField(max_length=2000, blank=True, default="")
    costs = models.TextField(max_length=2000, blank=True, default="")
    risks = models.TextField(max_length=2000, blank=True, default="")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "studio_decision_options"
        ordering = ("sort_order", "created_at")


class StudioDecisionAcknowledgement(WorkspaceBaseModel):
    decision = models.ForeignKey(
        StudioDecision,
        on_delete=models.CASCADE,
        related_name="acknowledgements",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="studio_decision_acknowledgements",
    )
    state = models.CharField(
        max_length=16,
        choices=AcknowledgementState.choices,
        default=AcknowledgementState.PENDING,
    )
    note = models.CharField(max_length=500, blank=True, default="")
    acted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "studio_decision_acknowledgements"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["decision", "user"],
                condition=Q(deleted_at__isnull=True),
                name="studio_decision_ack_unique_active_user",
            )
        ]


class StudioMilestone(ProjectBaseModel):
    release = models.ForeignKey(
        StudioRelease,
        on_delete=models.SET_NULL,
        related_name="milestones",
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=16, choices=MilestoneType.choices, default=MilestoneType.PRODUCT)
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=2000, blank=True, default="")
    target_at = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=16, choices=MilestoneStatus.choices, default=MilestoneStatus.PLANNED)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="owned_studio_milestones",
        null=True,
        blank=True,
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "studio_milestones"
        ordering = ("target_at", "created_at")


class StudioReleaseChecklistItem(ProjectBaseModel):
    release = models.ForeignKey(
        StudioRelease,
        on_delete=models.CASCADE,
        related_name="checklist_items",
    )
    key = models.CharField(max_length=64)
    title = models.CharField(max_length=160)
    is_done = models.BooleanField(default=False)
    done_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "studio_release_checklist_items"
        ordering = ("sort_order", "created_at")


class StudioEvent(WorkspaceBaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="studio_events",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(max_length=32, db_index=True)
    entity_id = models.UUIDField(db_index=True)
    action = models.CharField(max_length=64)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "studio_events"
        ordering = ("-created_at",)


class FeedbackSource(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    EMAIL = "EMAIL", "Email"
    APP_STORE = "APP_STORE", "App Store"
    WECHAT = "WECHAT", "WeChat"
    SOCIAL = "SOCIAL", "Social"
    SUPPORT = "SUPPORT", "Support"
    OTHER = "OTHER", "Other"


class Sentiment(models.TextChoices):
    POSITIVE = "POSITIVE", "Positive"
    NEUTRAL = "NEUTRAL", "Neutral"
    NEGATIVE = "NEGATIVE", "Negative"
    UNKNOWN = "UNKNOWN", "Unknown"


class FeedbackStatus(models.TextChoices):
    INBOX = "INBOX", "Inbox"
    TRIAGED = "TRIAGED", "Triaged"
    PLANNED = "PLANNED", "Planned"
    RESOLVED = "RESOLVED", "Resolved"
    WONT_DO = "WONT_DO", "Won't do"
    DUPLICATE = "DUPLICATE", "Duplicate"


class ContentStatus(models.TextChoices):
    IDEA = "IDEA", "Idea"
    DRAFT = "DRAFT", "Draft"
    REVIEW = "REVIEW", "Review"
    APPROVED = "APPROVED", "Approved"
    SCHEDULED = "SCHEDULED", "Scheduled"
    PUBLISHED = "PUBLISHED", "Published"
    CANCELLED = "CANCELLED", "Cancelled"


class ContentChannel(models.TextChoices):
    WECHAT = "WECHAT", "WeChat"
    X = "X", "X"
    BLOG = "BLOG", "Blog"
    EMAIL = "EMAIL", "Email"
    VIDEO = "VIDEO", "Video"
    OTHER = "OTHER", "Other"


class ExperimentStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    RUNNING = "RUNNING", "Running"
    COMPLETED = "COMPLETED", "Completed"
    STOPPED = "STOPPED", "Stopped"


class RoutineCadence(models.TextChoices):
    DAILY = "DAILY", "Daily"
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"
    AD_HOC = "AD_HOC", "Ad hoc"


class StudioFeedback(ProjectBaseModel):
    title = models.CharField(max_length=160)
    body = models.TextField(max_length=5000, blank=True, default="")
    source = models.CharField(max_length=16, choices=FeedbackSource.choices, default=FeedbackSource.MANUAL)
    sentiment = models.CharField(max_length=16, choices=Sentiment.choices, default=Sentiment.UNKNOWN)
    priority = models.CharField(max_length=2, choices=OperatingPriority.choices, default=OperatingPriority.P2)
    status = models.CharField(
        max_length=16,
        choices=FeedbackStatus.choices,
        default=FeedbackStatus.INBOX,
        db_index=True,
    )
    category = models.CharField(max_length=64, blank=True, default="")
    reporter_name = models.CharField(max_length=120, blank=True, default="")
    source_url = models.CharField(max_length=500, blank=True, default="")
    linked_issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        related_name="studio_feedback_links",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "studio_feedback"
        ordering = ("-created_at",)


class StudioContentItem(ProjectBaseModel):
    title = models.CharField(max_length=160)
    brief = models.TextField(max_length=2000, blank=True, default="")
    channel = models.CharField(max_length=16, choices=ContentChannel.choices, default=ContentChannel.OTHER)
    status = models.CharField(max_length=16, choices=ContentStatus.choices, default=ContentStatus.IDEA, db_index=True)
    planned_at = models.DateTimeField(null=True, blank=True, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    published_url = models.CharField(max_length=500, blank=True, default="")
    notes = models.TextField(max_length=2000, blank=True, default="")
    linked_issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        related_name="studio_content_links",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "studio_content_items"
        ordering = ("planned_at", "-created_at")


class StudioRoutine(ProjectBaseModel):
    name = models.CharField(max_length=160)
    cadence = models.CharField(max_length=16, choices=RoutineCadence.choices, default=RoutineCadence.WEEKLY)
    is_active = models.BooleanField(default=True, db_index=True)
    next_due_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(max_length=2000, blank=True, default="")
    linked_issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        related_name="studio_routine_links",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "studio_routines"
        ordering = ("name",)


class StudioExperiment(ProjectBaseModel):
    title = models.CharField(max_length=160)
    hypothesis = models.TextField(max_length=2000, blank=True, default="")
    status = models.CharField(
        max_length=16,
        choices=ExperimentStatus.choices,
        default=ExperimentStatus.DRAFT,
        db_index=True,
    )
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    result = models.TextField(max_length=5000, blank=True, default="")
    conclusion = models.TextField(max_length=5000, blank=True, default="")
    linked_issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        related_name="studio_experiment_links",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "studio_experiments"
        ordering = ("-created_at",)


class MetricUnit(models.TextChoices):
    COUNT = "COUNT", "Count"
    PERCENT = "PERCENT", "Percent"
    CURRENCY = "CURRENCY", "Currency"
    DURATION = "DURATION", "Duration"
    SCORE = "SCORE", "Score"
    OTHER = "OTHER", "Other"


class MetricDirection(models.TextChoices):
    UP_IS_GOOD = "UP_IS_GOOD", "Up is good"
    DOWN_IS_GOOD = "DOWN_IS_GOOD", "Down is good"
    TARGET_RANGE = "TARGET_RANGE", "Target range"
    NEUTRAL = "NEUTRAL", "Neutral"


class MetricFrequency(models.TextChoices):
    DAILY = "DAILY", "Daily"
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"
    AD_HOC = "AD_HOC", "Ad hoc"


class MetricSourceType(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    GITHUB = "GITHUB", "GitHub"
    CUSTOM = "CUSTOM", "Custom"


class StudioMetricDefinition(ProjectBaseModel):
    name = models.CharField(max_length=160)
    key = models.CharField(max_length=64)
    unit = models.CharField(max_length=16, choices=MetricUnit.choices, default=MetricUnit.COUNT)
    direction = models.CharField(max_length=16, choices=MetricDirection.choices, default=MetricDirection.NEUTRAL)
    target_value = models.FloatField(null=True, blank=True)
    frequency = models.CharField(max_length=16, choices=MetricFrequency.choices, default=MetricFrequency.WEEKLY)
    source_type = models.CharField(max_length=16, choices=MetricSourceType.choices, default=MetricSourceType.MANUAL)
    is_core = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "studio_metric_definitions"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "key"],
                condition=Q(deleted_at__isnull=True),
                name="studio_metric_unique_active_project_key",
            )
        ]


class StudioMetricSnapshot(ProjectBaseModel):
    metric_definition = models.ForeignKey(
        StudioMetricDefinition,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    captured_at = models.DateTimeField(db_index=True)
    numeric_value = models.FloatField(null=True, blank=True)
    text_value = models.CharField(max_length=160, blank=True, default="")
    source = models.CharField(max_length=16, default="MANUAL")
    note = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        db_table = "studio_metric_snapshots"
        ordering = ("captured_at",)


class StudioWeeklyReview(WorkspaceBaseModel):
    week_start = models.DateField(db_index=True)
    retrospective = models.TextField(max_length=5000, blank=True, default="")
    health_summary = models.TextField(max_length=5000, blank=True, default="")
    focus = models.TextField(max_length=2000, blank=True, default="")
    risks = models.TextField(max_length=2000, blank=True, default="")
    next_steps = models.TextField(max_length=2000, blank=True, default="")

    class Meta:
        db_table = "studio_weekly_reviews"
        ordering = ("-week_start",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "week_start"],
                condition=Q(deleted_at__isnull=True),
                name="studio_weekly_review_unique_active_week",
            )
        ]

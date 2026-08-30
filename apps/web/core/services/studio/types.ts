/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssuePriorities, TStateGroups } from "@plane/types";

export type TStudioPortfolioBucket = "FOCUS" | "NEXT" | "INCUBATING" | "KEEP_ALIVE" | "PAUSED" | "ARCHIVED";
export type TStudioProductType =
  | "IOS_APP"
  | "WECHAT_MINI_PROGRAM"
  | "WEB_APP"
  | "SERVICE"
  | "CONTENT"
  | "RESEARCH"
  | "OTHER";

export type TStudioLifecycleStage =
  | "IDEA"
  | "RESEARCH"
  | "VALIDATED"
  | "DESIGN"
  | "BUILD"
  | "TEST"
  | "RELEASE_READY"
  | "LIVE"
  | "GROWTH"
  | "MAINTENANCE";

export type TStudioPriority = "P0" | "P1" | "P2" | "P3";
export type TStudioHealthStatus = "ON_TRACK" | "AT_RISK" | "BLOCKED" | "STALE" | "PAUSED";
export type TStudioReleaseChannel = "INTERNAL" | "TEST" | "BETA" | "PRODUCTION";
export type TStudioReleaseStatus =
  | "PLANNED"
  | "SCOPING"
  | "BUILDING"
  | "QA"
  | "READY"
  | "SUBMITTED"
  | "REVIEW"
  | "RELEASED"
  | "ROLLED_BACK"
  | "CANCELLED";
export type TStudioDecisionStatus = "DRAFT" | "NEEDS_DECISION" | "DECIDED" | "REVISIT" | "REVERSED" | "CANCELLED";
export type TStudioRiskStatus = "OPEN" | "MITIGATING" | "MONITORING" | "ACCEPTED" | "CLOSED";
export type TStudioRiskType =
  | "PRODUCT"
  | "TECHNICAL"
  | "DELIVERY"
  | "LEGAL"
  | "FINANCIAL"
  | "MARKET"
  | "OPERATIONS"
  | "SECURITY";
export type TStudioDecisionMode = "SINGLE" | "ACK_REQUIRED" | "BOTH_REQUIRED" | "RECORD_ONLY";
export type TStudioAckState = "PENDING" | "APPROVED" | "OBJECTED";
export type TStudioMilestoneType = "PRODUCT" | "OPERATING" | "GOVERNANCE";
export type TStudioMilestoneStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "MISSED" | "CANCELLED";

export interface IStudioPermissions {
  can_write_workspace: boolean;
  writable_project_ids: string[];
}

export interface IStudioHealth {
  status: TStudioHealthStatus;
  computed_status: TStudioHealthStatus;
  reason: string;
  reason_code: string | null;
  reason_codes: string[];
  reason_params: Record<string, unknown> | null;
  reasons: string[];
  is_manual: boolean;
  expected_to_advance: boolean;
  cadence_days: number;
  progress_expected_since: string | null;
  last_meaningful_activity_at: string | null;
  next_update_due_at: string | null;
  evidence: Record<string, unknown>;
}

export interface IStudioAttention {
  status: Extract<TStudioHealthStatus, "BLOCKED" | "AT_RISK" | "STALE">;
  reason: string;
  reason_code: string | null;
  reason_codes: string[];
  reason_params: Record<string, unknown> | null;
  is_manual: boolean;
  evidence: Record<string, unknown>;
}

export interface IStudioProjectReference {
  id: string;
  name: string;
  identifier: string;
  logo_props: Record<string, unknown> | null;
  project_lead_id: string | null;
  archived_at: string | null;
}

export interface IStudioProjectProfile {
  id: string;
  workspace_id: string;
  project_id: string;
  product_type: TStudioProductType;
  portfolio_bucket: TStudioPortfolioBucket;
  lifecycle_stage: TStudioLifecycleStage;
  priority: TStudioPriority;
  operator_id: string | null;
  focus_statement: string;
  expected_update_interval_days: number;
  progress_expected_since: string | null;
  last_meaningful_activity_at: string | null;
  manual_health: TStudioHealthStatus | null;
  manual_health_reason: string | null;
  manual_health_expires_at: string | null;
  created_at: string;
  updated_at: string;
  health: IStudioHealth;
}

export type TStudioProjectProfileInput = Partial<
  Pick<
    IStudioProjectProfile,
    | "product_type"
    | "portfolio_bucket"
    | "lifecycle_stage"
    | "priority"
    | "operator_id"
    | "focus_statement"
    | "expected_update_interval_days"
    | "last_meaningful_activity_at"
    | "manual_health"
    | "manual_health_reason"
    | "manual_health_expires_at"
  >
>;

export interface IStudioChecklistItem {
  id: string;
  release_id: string;
  key: string;
  title: string;
  is_done: boolean;
  done_at: string | null;
  sort_order: number;
}

export interface IStudioRelease {
  id: string;
  workspace_id: string;
  project_id: string;
  module_id: string | null;
  name: string;
  version: string;
  channel: TStudioReleaseChannel;
  status: TStudioReleaseStatus;
  target_at: string | null;
  released_at: string | null;
  scope_summary: string;
  checklist_items?: IStudioChecklistItem[];
  allowed_next_statuses?: TStudioReleaseStatus[];
  created_at: string;
  updated_at: string;
}

export type TStudioReleaseInput = Partial<
  Pick<
    IStudioRelease,
    "module_id" | "name" | "version" | "channel" | "status" | "target_at" | "released_at" | "scope_summary"
  >
>;

export interface IStudioDecisionOption {
  id: string;
  decision_id: string;
  title: string;
  description: string;
  benefits: string;
  costs: string;
  risks: string;
  sort_order: number;
}

export interface IStudioDecisionAcknowledgement {
  id: string;
  decision_id: string;
  user_id: string;
  state: TStudioAckState;
  note: string;
  acted_at: string | null;
}

export interface IStudioDecision {
  id: string;
  workspace_id: string;
  project_id: string | null;
  proposer_id: string | null;
  title: string;
  question: string;
  context: string;
  recommendation: string;
  final_decision: string;
  rationale: string;
  status: TStudioDecisionStatus;
  decision_mode: TStudioDecisionMode;
  due_at: string | null;
  decided_at: string | null;
  revisit_condition: string;
  revisit_at: string | null;
  options?: IStudioDecisionOption[];
  acknowledgements?: IStudioDecisionAcknowledgement[];
  allowed_next_statuses?: TStudioDecisionStatus[];
  created_at: string;
  updated_at: string;
}

export type TStudioDecisionInput = Partial<
  Pick<
    IStudioDecision,
    | "project_id"
    | "title"
    | "question"
    | "context"
    | "recommendation"
    | "final_decision"
    | "rationale"
    | "status"
    | "decision_mode"
    | "due_at"
    | "decided_at"
  >
>;

export interface IStudioMilestone {
  id: string;
  workspace_id: string;
  project_id: string;
  release_id: string | null;
  type: TStudioMilestoneType;
  title: string;
  description: string;
  target_at: string;
  status: TStudioMilestoneStatus;
  owner_id: string | null;
  completed_at: string | null;
  allowed_next_statuses?: TStudioMilestoneStatus[];
  created_at: string;
  updated_at: string;
}

export type TStudioMilestoneInput = Partial<
  Pick<IStudioMilestone, "release_id" | "type" | "title" | "description" | "target_at" | "status" | "owner_id">
>;

export interface IStudioEvent {
  id: string;
  workspace_id: string;
  project_id: string | null;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface IStudioRisk {
  id: string;
  workspace_id: string;
  project_id: string;
  owner_id: string | null;
  type: TStudioRiskType;
  title: string;
  description: string;
  probability: number;
  impact: number;
  score: number;
  is_blocker: boolean;
  status: TStudioRiskStatus;
  mitigation: string;
  due_at: string | null;
  allowed_next_statuses?: TStudioRiskStatus[];
  created_at: string;
  updated_at: string;
}

export type TStudioRiskInput = Partial<
  Pick<
    IStudioRisk,
    | "owner_id"
    | "type"
    | "title"
    | "description"
    | "probability"
    | "impact"
    | "is_blocker"
    | "status"
    | "mitigation"
    | "due_at"
  >
>;

export interface IStudioPortfolioProject {
  project: IStudioProjectReference;
  profile: IStudioProjectProfile | null;
  health: IStudioHealth | null;
  attention: IStudioAttention | null;
}

export interface IStudioCrossProjectWork {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project_name: string;
  project_identifier: string;
  priority: TIssuePriorities | null;
  state: {
    id: string;
    name: string;
    group: TStateGroups;
    color: string;
  } | null;
  target_date: string | null;
  updated_at: string;
}

export interface IStudioToday {
  focus_projects: IStudioPortfolioProject[];
  needs_attention: IStudioPortfolioProject[];
  upcoming_releases: Array<IStudioRelease & { project: IStudioProjectReference | null }>;
  pending_decisions: Array<IStudioDecision & { project: IStudioProjectReference | null }>;
  cross_project_work: IStudioCrossProjectWork[];
  cadence: IStudioCadence;
  permissions: IStudioPermissions;
  focus_warning: string | null;
  focus_warning_code: string | null;
  focus_warning_params: Record<string, unknown> | null;
  generated_at: string;
}

export type TStudioMetricUnit = "COUNT" | "PERCENT" | "CURRENCY" | "DURATION" | "SCORE" | "OTHER";
export type TStudioMetricDirection = "UP_IS_GOOD" | "DOWN_IS_GOOD" | "TARGET_RANGE" | "NEUTRAL";
export type TStudioMetricFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "AD_HOC";
export type TStudioMetricSourceType = "MANUAL" | "GITHUB" | "CUSTOM";

export interface IStudioMetricPoint {
  id: string;
  captured_at: string | null;
  numeric_value: number | null;
  text_value: string;
  note: string;
}

export interface IStudioMetricSeries {
  point_count: number;
  draws_line: boolean;
  min_line_points: number;
  points: IStudioMetricPoint[];
}

export interface IStudioMetricDefinition {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  key: string;
  unit: TStudioMetricUnit;
  direction: TStudioMetricDirection;
  target_value: number | null;
  frequency: TStudioMetricFrequency;
  source_type: TStudioMetricSourceType;
  is_core: boolean;
  is_active: boolean;
  series: IStudioMetricSeries;
  created_at: string;
  updated_at: string;
}

export type TStudioMetricInput = Partial<
  Pick<
    IStudioMetricDefinition,
    "name" | "key" | "unit" | "direction" | "target_value" | "frequency" | "source_type" | "is_core" | "is_active"
  >
>;

export interface IStudioWeeklyReview {
  id: string;
  workspace_id: string;
  week_start: string;
  retrospective: string;
  health_summary: string;
  focus: string;
  risks: string;
  next_steps: string;
  created_at: string;
  updated_at: string;
}

export type TStudioWeeklyReviewInput = Partial<
  Pick<IStudioWeeklyReview, "week_start" | "retrospective" | "health_summary" | "focus" | "risks" | "next_steps">
>;

export interface IStudioCadence {
  week_start: string;
  focus: string;
  risks: string;
  next_steps: string;
  weekly_review: IStudioWeeklyReview | null;
}

export type TStudioGithubStatus = "PENDING_EXTERNAL_CREDENTIAL" | "CONNECTED" | "DEGRADED";
export type TStudioGithubKind = "PULL_REQUEST" | "CI" | "RELEASE" | "LAST_COMMIT";

export interface IStudioGithubProjection {
  id: string;
  kind: TStudioGithubKind;
  external_id: string;
  captured_at: string;
  title: string;
  url: string;
}

export interface IStudioGithubStatus {
  repository: string;
  status: TStudioGithubStatus;
  credential_status: TStudioGithubStatus;
  connected: boolean;
  last_captured_at: string | null;
  degraded_reason: string | null;
  projections: IStudioGithubProjection[];
}

export interface IStudioTimeline {
  events: IStudioEvent[];
  permissions: IStudioPermissions;
  generated_at: string;
}

export interface IStudioPortfolio {
  projects: IStudioPortfolioProject[];
  available_filters: {
    portfolio_buckets: TStudioPortfolioBucket[];
    lifecycle_stages: TStudioLifecycleStage[];
    health_statuses: TStudioHealthStatus[];
    product_types: TStudioProductType[];
    priorities: TStudioPriority[];
  };
  permissions: IStudioPermissions;
  generated_at: string;
}

export interface IStudioWorkSummary {
  work_items: {
    total: number;
    backlog: number;
    unstarted: number;
    started: number;
    completed: number;
    cancelled: number;
  };
  cycles: {
    total: number;
    active: number;
  };
  modules: {
    total: number;
    active: number;
  };
  last_work_item_activity_at: string | null;
}

export type TStudioFeedbackStatus = "INBOX" | "TRIAGED" | "PLANNED" | "RESOLVED" | "WONT_DO" | "DUPLICATE";
export type TStudioFeedbackSource = "MANUAL" | "EMAIL" | "APP_STORE" | "WECHAT" | "SOCIAL" | "SUPPORT" | "OTHER";
export type TStudioSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "UNKNOWN";
export type TStudioContentStatus = "IDEA" | "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "CANCELLED";
export type TStudioContentChannel = "WECHAT" | "X" | "BLOG" | "EMAIL" | "VIDEO" | "OTHER";
export type TStudioExperimentStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "STOPPED";
export type TStudioRoutineCadence = "DAILY" | "WEEKLY" | "MONTHLY" | "AD_HOC";

export interface IStudioLinkedIssue {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project_identifier: string | null;
}

export interface IStudioFeedback {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  body: string;
  source: TStudioFeedbackSource;
  sentiment: TStudioSentiment;
  priority: TStudioPriority;
  status: TStudioFeedbackStatus;
  category: string;
  reporter_name: string;
  source_url: string;
  linked_issue_id: string | null;
  linked_issue: IStudioLinkedIssue | null;
  allowed_next_statuses?: TStudioFeedbackStatus[];
  created_at: string;
  updated_at: string;
}

export type TStudioFeedbackInput = Partial<
  Pick<
    IStudioFeedback,
    "title" | "body" | "source" | "sentiment" | "priority" | "status" | "category" | "reporter_name" | "source_url"
  >
>;

export interface IStudioContentItem {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  brief: string;
  channel: TStudioContentChannel;
  status: TStudioContentStatus;
  planned_at: string | null;
  published_at: string | null;
  published_url: string;
  notes: string;
  linked_issue_id: string | null;
  linked_issue: IStudioLinkedIssue | null;
  created_at: string;
  updated_at: string;
}

export type TStudioContentInput = Partial<
  Pick<
    IStudioContentItem,
    "title" | "brief" | "channel" | "status" | "planned_at" | "published_at" | "published_url" | "notes"
  >
>;

export interface IStudioRoutine {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  cadence: TStudioRoutineCadence;
  is_active: boolean;
  next_due_at: string | null;
  notes: string;
  linked_issue_id: string | null;
  linked_issue: IStudioLinkedIssue | null;
  created_at: string;
  updated_at: string;
}

export type TStudioRoutineInput = Partial<
  Pick<IStudioRoutine, "name" | "cadence" | "is_active" | "next_due_at" | "notes">
>;

export interface IStudioExperiment {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  hypothesis: string;
  status: TStudioExperimentStatus;
  start_at: string | null;
  end_at: string | null;
  result: string;
  conclusion: string;
  linked_issue_id: string | null;
  linked_issue: IStudioLinkedIssue | null;
  allowed_next_statuses?: TStudioExperimentStatus[];
  created_at: string;
  updated_at: string;
}

export type TStudioExperimentInput = Partial<
  Pick<IStudioExperiment, "title" | "hypothesis" | "status" | "start_at" | "end_at" | "result" | "conclusion">
>;

export interface IStudioOperations {
  projects: Array<Pick<IStudioProjectReference, "id" | "name" | "identifier">>;
  feedback: IStudioFeedback[];
  content_items: IStudioContentItem[];
  routines: IStudioRoutine[];
  experiments: IStudioExperiment[];
  permissions: IStudioPermissions;
  generated_at: string;
}

export interface IStudioProjectOverview {
  project: IStudioProjectReference;
  profile: IStudioProjectProfile | null;
  health: IStudioHealth | null;
  work_summary: IStudioWorkSummary;
  releases: IStudioRelease[];
  decisions: IStudioDecision[];
  risks: IStudioRisk[];
  milestones: IStudioMilestone[];
  feedback: IStudioFeedback[];
  content_items: IStudioContentItem[];
  routines: IStudioRoutine[];
  experiments: IStudioExperiment[];
  metrics: IStudioMetricDefinition[];
  github: IStudioGithubStatus;
  events: IStudioEvent[];
  permissions: IStudioPermissions & { can_write_project: boolean };
  generated_at: string;
}

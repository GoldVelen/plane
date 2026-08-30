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
  created_at: string;
  updated_at: string;
}

export type TStudioReleaseInput = Partial<
  Pick<
    IStudioRelease,
    "module_id" | "name" | "version" | "channel" | "status" | "target_at" | "released_at" | "scope_summary"
  >
>;

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
  status: TStudioDecisionStatus;
  due_at: string | null;
  decided_at: string | null;
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
    | "status"
    | "due_at"
    | "decided_at"
  >
>;

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
  permissions: IStudioPermissions;
  focus_warning: string | null;
  focus_warning_code: string | null;
  focus_warning_params: Record<string, unknown> | null;
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

export interface IStudioProjectOverview {
  project: IStudioProjectReference;
  profile: IStudioProjectProfile | null;
  health: IStudioHealth | null;
  work_summary: IStudioWorkSummary;
  releases: IStudioRelease[];
  decisions: IStudioDecision[];
  risks: IStudioRisk[];
  permissions: IStudioPermissions & { can_write_project: boolean };
  generated_at: string;
}

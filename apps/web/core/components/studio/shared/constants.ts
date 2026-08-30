/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TStudioContentChannel,
  TStudioContentStatus,
  TStudioDecisionStatus,
  TStudioExperimentStatus,
  TStudioFeedbackSource,
  TStudioFeedbackStatus,
  TStudioHealthStatus,
  TStudioLifecycleStage,
  TStudioPortfolioBucket,
  TStudioPriority,
  TStudioProductType,
  TStudioReleaseChannel,
  TStudioReleaseStatus,
  TStudioRiskStatus,
  TStudioRiskType,
  TStudioRoutineCadence,
  TStudioSentiment,
} from "@/services/studio";
import type { TTranslationStore } from "@plane/i18n";

export const STUDIO_PORTFOLIO_BUCKETS: TStudioPortfolioBucket[] = [
  "FOCUS",
  "NEXT",
  "INCUBATING",
  "KEEP_ALIVE",
  "PAUSED",
  "ARCHIVED",
];

export const STUDIO_LIFECYCLE_STAGES: TStudioLifecycleStage[] = [
  "IDEA",
  "RESEARCH",
  "VALIDATED",
  "DESIGN",
  "BUILD",
  "TEST",
  "RELEASE_READY",
  "LIVE",
  "GROWTH",
  "MAINTENANCE",
];

export const STUDIO_PRIORITIES: TStudioPriority[] = ["P0", "P1", "P2", "P3"];
export const STUDIO_PRODUCT_TYPES: TStudioProductType[] = [
  "IOS_APP",
  "WECHAT_MINI_PROGRAM",
  "WEB_APP",
  "SERVICE",
  "CONTENT",
  "RESEARCH",
  "OTHER",
];
export const STUDIO_HEALTH_STATUSES: TStudioHealthStatus[] = ["ON_TRACK", "AT_RISK", "BLOCKED", "STALE", "PAUSED"];
export const STUDIO_RELEASE_CHANNELS: TStudioReleaseChannel[] = ["INTERNAL", "TEST", "BETA", "PRODUCTION"];
export const STUDIO_RELEASE_STATUSES: TStudioReleaseStatus[] = [
  "PLANNED",
  "SCOPING",
  "BUILDING",
  "QA",
  "READY",
  "SUBMITTED",
  "REVIEW",
  "RELEASED",
  "ROLLED_BACK",
  "CANCELLED",
];
export const STUDIO_DECISION_STATUSES: TStudioDecisionStatus[] = [
  "DRAFT",
  "NEEDS_DECISION",
  "DECIDED",
  "REVISIT",
  "REVERSED",
  "CANCELLED",
];
export const STUDIO_RISK_STATUSES: TStudioRiskStatus[] = ["OPEN", "MITIGATING", "MONITORING", "ACCEPTED", "CLOSED"];
export const STUDIO_DECISION_MODES = ["RECORD_ONLY", "SINGLE", "ACK_REQUIRED", "BOTH_REQUIRED"] as const;
export const STUDIO_MILESTONE_TYPES = ["PRODUCT", "OPERATING", "GOVERNANCE"] as const;
export const STUDIO_MILESTONE_STATUSES = ["PLANNED", "IN_PROGRESS", "DONE", "MISSED", "CANCELLED"] as const;
export const STUDIO_RISK_TYPES: TStudioRiskType[] = [
  "PRODUCT",
  "TECHNICAL",
  "DELIVERY",
  "LEGAL",
  "FINANCIAL",
  "MARKET",
  "OPERATIONS",
  "SECURITY",
];
export const STUDIO_FEEDBACK_STATUSES: TStudioFeedbackStatus[] = [
  "INBOX",
  "TRIAGED",
  "PLANNED",
  "RESOLVED",
  "WONT_DO",
  "DUPLICATE",
];
export const STUDIO_FEEDBACK_SOURCES: TStudioFeedbackSource[] = [
  "MANUAL",
  "EMAIL",
  "APP_STORE",
  "WECHAT",
  "SOCIAL",
  "SUPPORT",
  "OTHER",
];
export const STUDIO_SENTIMENTS: TStudioSentiment[] = ["POSITIVE", "NEUTRAL", "NEGATIVE", "UNKNOWN"];
export const STUDIO_CONTENT_STATUSES: TStudioContentStatus[] = [
  "IDEA",
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "CANCELLED",
];
export const STUDIO_CONTENT_CHANNELS: TStudioContentChannel[] = ["WECHAT", "X", "BLOG", "EMAIL", "VIDEO", "OTHER"];
export const STUDIO_EXPERIMENT_STATUSES: TStudioExperimentStatus[] = ["DRAFT", "RUNNING", "COMPLETED", "STOPPED"];
export const STUDIO_ROUTINE_CADENCES: TStudioRoutineCadence[] = ["DAILY", "WEEKLY", "MONTHLY", "AD_HOC"];

export type TStudioEnumDomain =
  | "bucket"
  | "lifecycle"
  | "health"
  | "priority"
  | "product_type"
  | "release_channel"
  | "release_status"
  | "decision_status"
  | "decision_mode"
  | "ack_state"
  | "risk_type"
  | "risk_status"
  | "milestone_type"
  | "milestone_status"
  | "feedback_status"
  | "feedback_source"
  | "sentiment"
  | "content_status"
  | "content_channel"
  | "experiment_status"
  | "routine_cadence"
  | "github_kind";

/**
 * Stable translation-key mapping for Studio domain values. Enum codes stay English
 * in the database, API, TypeScript types, and routes; only the displayed label is translated.
 */
export const studioEnumLabel = (t: TTranslationStore["t"], domain: TStudioEnumDomain, value: string): string =>
  t(`studio.enums.${domain}.${value}`);

export const toDateTimeLocalValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.valueOf() - timezoneOffset).toISOString().slice(0, 16);
};

export const fromDateTimeLocalValue = (value: string) => (value ? new Date(value).toISOString() : null);

/**
 * Exact-match translation map for Studio API validation messages. The backend
 * returns these DRF strings verbatim; the frontend maps them to localized keys so
 * form-error toasts follow the current language. Unknown server messages fall
 * through untranslated rather than being guessed.
 */
const STUDIO_API_ERROR_MESSAGE_KEYS: Record<string, string> = {
  "Operator must be an active member of this workspace.": "studio.api_error.operator_not_member",
  "A manual health override requires a reason.": "studio.api_error.override_reason_required",
  "A new manual health override must expire in the future.": "studio.api_error.override_expires_in_past",
  "Meaningful activity cannot be in the future.": "studio.api_error.activity_in_future",
  "Module must belong to the release project.": "studio.api_error.module_project_mismatch",
  "An active release with this version already exists in the project.": "studio.api_error.duplicate_version",
  "Project must belong to this workspace.": "studio.api_error.project_workspace_mismatch",
  "Owner must be an active member of this workspace.": "studio.api_error.owner_not_member",
  "You do not have permission to perform this action.": "studio.api_error.permission_denied",
  "A decided outcome requires a final decision.": "studio.api_error.final_decision_required",
  "This decision still needs required acknowledgements.": "studio.api_error.acknowledgements_required",
  "An objection is blocking this decision.": "studio.api_error.decision_objected",
  "Could not create a Plane work item from this record.": "studio.api_error.convert_failed",
  "A snapshot needs a numeric or text value.": "studio.api_error.snapshot_value_required",
  "Metric key is required.": "studio.api_error.metric_key_required",
};

const extractStudioErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    if ("detail" in error && typeof error.detail === "string") return error.detail;
    if ("error" in error && typeof error.error === "string") return error.error;
    const firstFieldError = Object.values(error).find(
      (value): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string")
    );
    if (firstFieldError?.[0]) return firstFieldError[0];
  }
  return fallback;
};

export const getStudioErrorMessage = (
  error: unknown,
  fallback: string,
  t?: (key: string, params?: Record<string, unknown>) => string
): string => {
  const raw = extractStudioErrorMessage(error, fallback);
  if (t && raw !== fallback) {
    const key = STUDIO_API_ERROR_MESSAGE_KEYS[raw];
    if (key) return t(key);
  }
  return raw;
};

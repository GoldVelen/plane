/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Mail, MessageCircle, MessageSquare } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";

export type TPlanFeatureData = React.ReactNode | boolean | null;

// TODO: we should change this type and use TProductSubscriptionType instead. Need changes in common constants.
export type TPlanePlans = "free" | "one" | "pro" | "business" | "enterprise";

export type TPlanDetail = {
  id: EProductSubscriptionEnum;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPriceSecondaryDescriptionKey?: string;
  yearlyPriceSecondaryDescriptionKey?: string;
  isActive: boolean;
};

type TPlanFeatureDetails = {
  title?: React.ReactNode;
  i18nKey?: string;
  comingSoon?: boolean;
  selfHostedOnly?: boolean;
  cloud: Record<TPlanePlans, TPlanFeatureData>;
  "self-hosted"?: Record<TPlanePlans, TPlanFeatureData>;
};

type TPlansComparisonDetails = {
  id: string;
  title?: React.ReactNode;
  i18nKey?: string;
  comingSoon?: boolean;
  cloudOnly?: boolean;
  selfHostedOnly?: boolean;
  features: TPlanFeatureDetails[];
};

type PlanePlans = {
  planDetails: Record<TPlanePlans, TPlanDetail>;
  planHighlights: Record<TPlanePlans, string[]>;
  planComparison: TPlansComparisonDetails[];
};

function ForumIcon({ className }: { className?: string }) {
  return <MessageSquare className={cn(className, "size-5 text-secondary")} />;
}

function PlanCopy({ i18nKey }: { i18nKey: string }) {
  const { t } = useTranslation();
  return <>{t(i18nKey)}</>;
}

export function ComingSoonBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "w-fit rounded-sm bg-accent-primary px-1.5 py-0.5 text-9 font-semibold whitespace-nowrap text-on-color",
        className
      )}
    >
      {t("legacy_ui.coming_soon")}
    </span>
  );
}

export const PLANS_LIST: TPlanePlans[] = ["free", "one", "pro", "business", "enterprise"];

export const PLANS_COMPARISON_LIST: TPlansComparisonDetails[] = [
  {
    id: "project-work-tracking",
    i18nKey: "legacy_ui.project_work_tracking",
    features: [
      {
        i18nKey: "projects",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "work_items",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "comments",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "cycles",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "modules",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "intake",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "project_settings.estimates.title",

        cloud: {
          free: <PlanCopy i18nKey="legacy_ui.basic" />,
          one: <PlanCopy i18nKey="legacy_ui.basic" />,
          pro: <PlanCopy i18nKey="legacy_ui.advanced" />,
          business: <PlanCopy i18nKey="legacy_ui.advanced" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.advanced" />,
        },
      },
    ],
  },
  {
    id: "project-work-management",
    i18nKey: "legacy_ui.project_work_management",
    features: [
      {
        i18nKey: "legacy_ui.bulk_ops",

        cloud: {
          free: false,
          one: <PlanCopy i18nKey="legacy_ui.limited_props" />,
          pro: <PlanCopy i18nKey="legacy_ui.all_props" />,
          business: (
            <span className="flex flex-col items-end gap-1 lg:items-center">
              <ComingSoonBadge />
              <PlanCopy i18nKey="legacy_ui.work_item_transfers_and_conversions" />
            </span>
          ),
          enterprise: (
            <span className="flex flex-col items-end gap-1 lg:items-center">
              <ComingSoonBadge />
              <PlanCopy i18nKey="legacy_ui.work_item_transfers_and_conversions" />
            </span>
          ),
        },
      },
      {
        i18nKey: "legacy_ui.time_tracking_worklogs",

        cloud: {
          free: false,
          one: <PlanCopy i18nKey="legacy_ui.basic" />,
          pro: <PlanCopy i18nKey="legacy_ui.historical_timesheets" />,
          business: <PlanCopy i18nKey="legacy_ui.historical_timesheets_and_approvals" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.historical_timesheets_and_approvals" />,
        },
      },
      {
        i18nKey: "active_cycles",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "work_item_types.label",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.custom_properties",

        cloud: {
          free: false,
          one: false,
          pro: <PlanCopy i18nKey="legacy_ui.project_level_custom_properties" />,
          business: <PlanCopy i18nKey="legacy_ui.workspace_level_properties_and_roll_ups" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.workspace_level_properties_and_roll_ups" />,
        },
      },
      {
        i18nKey: "legacy_ui.dependencies_in_gantt",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.work_item_transfers",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.auto_transfer_cycle_work_items",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "common.epics",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.initiatives",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.checkpoints",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.module_overview",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.auto_assignment_in_modules",

        cloud: {
          free: false,
          one: false,
          pro: <PlanCopy i18nKey="project_settings.estimates.systems.points.linear" />,
          business: <PlanCopy i18nKey="legacy_ui.round_robin_and_capacity" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.round_robin_and_capacity" />,
        },
      },
      // {
      //   title: "Project Overview",
      //   description: "See just-in-time snapshots of your project with\nessential metrics.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        i18nKey: "legacy_ui.public_private_and_secret_projects",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.state_of_projects",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Project Updates",
      //   description:
      //     "Keep stakeholders in the loop with a dedicated\nspace for updates that everyone in the project can\nsee.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        i18nKey: "legacy_ui.pre_defined_work_item_templates",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.teamspace_cycles",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.project_templates",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.baselines_and_deviations",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.scheduled_comms",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.intake_assignees",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.custom_slas",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.intake_forms",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.emails_for_intake",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "visualization",
    i18nKey: "legacy_ui.visualization",
    features: [
      {
        i18nKey: "legacy_ui.layouts",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "views",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.shared_views",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.publish_views",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.dashboards_and_widgets",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "analytics-reports",
    i18nKey: "legacy_ui.analytics_reports",
    features: [
      {
        i18nKey: "legacy_ui.progress_charts",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.cycle_reports",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.insights",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Time Capsule",
      //   description: "Go back in your project's timeline and see point-in-\ntime snapshots.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: false,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        i18nKey: "legacy_ui.advanced_pages_analytics",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.custom_reports",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "navigation",
    i18nKey: "legacy_ui.navigation",
    features: [
      {
        i18nKey: "legacy_ui.power_k",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Search",
      //   description: "Search via natural-language queries, operators, or\nPQL",
      //   cloud: {
      //     free: "Basic text search",
      //     one: "Basic text search",
      //     pro: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     business: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     enterprise: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //   },
      // },
      {
        title: "PQL",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "workspace-user-management",
    i18nKey: "legacy_ui.workspace_and_user_management",
    features: [
      {
        i18nKey: "legacy_ui.member_limit",

        cloud: {
          free: "12",
          one: "",
          pro: <PlanCopy i18nKey="legacy_ui.unlimited" />,
          business: <PlanCopy i18nKey="legacy_ui.unlimited" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.unlimited" />,
        },
        "self-hosted": {
          free: "~50",
          one: "~50",
          pro: "~200",
          business: "~200",
          enterprise: <PlanCopy i18nKey="legacy_ui.unlimited" />,
        },
      },
      {
        i18nKey: "legacy_ui.roles",

        cloud: {
          free: <PlanCopy i18nKey="legacy_ui.basic" />,
          one: <PlanCopy i18nKey="legacy_ui.basic" />,
          pro: <PlanCopy i18nKey="legacy_ui.pre_defined_roles" />,
          business: "RBAC",
          enterprise: <PlanCopy i18nKey="legacy_ui.gac" />,
        },
      },
      {
        i18nKey: "common.roles.guests",

        cloud: {
          free: false,
          one: <PlanCopy i18nKey="legacy_ui.5_per_paid_member" />,
          pro: <PlanCopy i18nKey="legacy_ui.5_per_paid_member" />,
          business: <PlanCopy i18nKey="legacy_ui.5_per_paid_member" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.5_per_paid_member" />,
        },
      },
      {
        i18nKey: "legacy_ui.approvals",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.admin_interface",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.workspace_activity_logs",

        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.api_enabled_audit_logs",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "automations-workflows",
    i18nKey: "legacy_ui.automations_and_workflows",
    features: [
      {
        i18nKey: "legacy_ui.trigger_and_action",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.decisions_and_loops_automation",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.number_of_automations",

        cloud: {
          free: false,
          one: false,
          pro: "5,000",
          business: "10,000",
          enterprise: <PlanCopy i18nKey="legacy_ui.unlimited" />,
        },
      },
    ],
  },
  {
    id: "knowledge-management",
    i18nKey: "legacy_ui.knowledge_management",
    features: [
      {
        i18nKey: "pages",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.real_time_collab",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.work_item_embeds",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.link_to_work_items",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "publish",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.wiki",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "workspace_settings.settings.exports.title",

        cloud: {
          free: false,
          one: false,
          pro: <PlanCopy i18nKey="legacy_ui.one_download_at_a_time" />,
          business: <PlanCopy i18nKey="legacy_ui.queued_downloads" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.queued_downloads" />,
        },
      },
      {
        i18nKey: "templates.settings.title",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.versions",

        cloud: {
          free: false,
          one: false,
          pro: <PlanCopy i18nKey="legacy_ui.2_days" />,
          business: <PlanCopy i18nKey="workspace_settings.settings.api_tokens.expiration_options.three_months" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.unlimited" />,
        },
      },
      {
        i18nKey: "legacy_ui.databases_formulas",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "wiki.upgrade_flow.tabs.nested_pages",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: <PlanCopy i18nKey="legacy_ui.word_compatible_other_format_downloads" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.word_compatible_other_format_downloads" />,
        },
      },
    ],
  },
  {
    id: "importers",
    i18nKey: "legacy_ui.importers",
    features: [
      {
        title: "Jira",

        cloud: {
          free: <PlanCopy i18nKey="legacy_ui.without_custom_props" />,
          one: <PlanCopy i18nKey="legacy_ui.without_custom_props" />,
          pro: <PlanCopy i18nKey="legacy_ui.with_custom_props" />,
          business: <PlanCopy i18nKey="legacy_ui.with_custom_props" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.with_custom_props" />,
        },
      },
      {
        title: "GitHub",

        cloud: {
          free: <PlanCopy i18nKey="legacy_ui.without_custom_props" />,
          one: <PlanCopy i18nKey="legacy_ui.without_custom_props" />,
          pro: <PlanCopy i18nKey="legacy_ui.with_custom_props" />,
          business: <PlanCopy i18nKey="legacy_ui.with_custom_props" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.with_custom_props" />,
        },
      },
    ],
  },
  {
    id: "integrations",
    i18nKey: "integrations.integrations",
    comingSoon: true,
    features: [
      {
        title: "GitHub",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Slack",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zapier",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zendesk",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Freshdesk",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "storage",
    i18nKey: "legacy_ui.storage",
    cloudOnly: true,
    features: [
      {
        i18nKey: "legacy_ui.space",

        cloud: {
          free: <PlanCopy i18nKey="legacy_ui.5gb" />,
          one: false,
          pro: <PlanCopy i18nKey="legacy_ui.1_tb" />,
          business: <PlanCopy i18nKey="legacy_ui.5_tb" />,
          enterprise: <PlanCopy i18nKey="notification.snooze.custom" />,
        },
      },
      {
        i18nKey: "legacy_ui.max_file_size",

        cloud: {
          free: <PlanCopy i18nKey="legacy_ui.5_mb" />,
          one: false,
          pro: <PlanCopy i18nKey="legacy_ui.100_mb" />,
          business: <PlanCopy i18nKey="legacy_ui.200_mb" />,
          enterprise: <PlanCopy i18nKey="notification.snooze.custom" />,
        },
      },
    ],
  },
  {
    id: "security",
    i18nKey: "security",
    features: [
      {
        title: "SAML",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "OIDC",

        selfHostedOnly: true,
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.domain_security",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.two_factor_authentication_and_passkeys",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.password_policy",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.ldap",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "self-hosted",
    i18nKey: "legacy_ui.self_hosted",
    selfHostedOnly: true,
    features: [
      {
        i18nKey: "legacy_ui.god_mode",

        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.one_click_deployment",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.digital_ocean_marketplace_app",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.heroku_platform_app",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "AWS AMI",

        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        i18nKey: "legacy_ui.private_deployments",

        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "support",
    i18nKey: "support",
    features: [
      {
        i18nKey: "legacy_ui.channels",

        cloud: {
          free: (
            <>
              <ForumIcon className="size-4" />
            </>
          ),
          one: (
            <div className="flex items-center gap-1">
              <Mail className="size-4 flex-shrink-0" />
              <ForumIcon className="size-4 flex-shrink-0" />
            </div>
          ),
          pro: (
            <div className="flex items-center gap-1">
              <Mail className="size-4 flex-shrink-0" />
              <ForumIcon className="size-4 flex-shrink-0" />
              <MessageCircle className="size-4 flex-shrink-0" />
            </div>
          ),
          business: <PlanCopy i18nKey="legacy_ui.full_suite_professional_services" />,
          enterprise: <PlanCopy i18nKey="legacy_ui.full_suite_professional_services" />,
        },
      },
      {
        title: "SLA",

        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
];

export const PLANE_PLANS: PlanePlans = {
  planDetails: {
    free: {
      id: EProductSubscriptionEnum.FREE,

      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
    },
    one: {
      id: EProductSubscriptionEnum.ONE,

      monthlyPrice: 799,
      yearlyPrice: 799,
      monthlyPriceSecondaryDescriptionKey: "legacy_ui.per_workspace",
      yearlyPriceSecondaryDescriptionKey: "legacy_ui.per_workspace",

      isActive: false,
    },
    pro: {
      id: EProductSubscriptionEnum.PRO,

      monthlyPrice: 8,
      yearlyPrice: 6,
      monthlyPriceSecondaryDescriptionKey: "legacy_ui.billed_monthly",
      yearlyPriceSecondaryDescriptionKey: "legacy_ui.billed_yearly",

      isActive: true,
    },
    business: {
      id: EProductSubscriptionEnum.BUSINESS,

      monthlyPriceSecondaryDescriptionKey: "legacy_ui.billed_monthly",
      yearlyPriceSecondaryDescriptionKey: "legacy_ui.billed_yearly",

      isActive: false,
    },
    enterprise: {
      id: EProductSubscriptionEnum.ENTERPRISE,

      monthlyPriceSecondaryDescriptionKey: "legacy_ui.billed_monthly",
      yearlyPriceSecondaryDescriptionKey: "legacy_ui.billed_yearly",

      isActive: false,
    },
  },
  planHighlights: {
    free: [
      "legacy_ui.upto_12_users",
      "pages",
      "legacy_ui.unlimited_projects",
      "legacy_ui.unlimited_cycles_and_modules",
    ],
    one: ["legacy_ui.upto_50_users", "legacy_ui.oidc_and_saml", "active_cycles", "legacy_ui.limited_time_tracking"],
    pro: [
      "legacy_ui.unlimited_users",
      "legacy_ui.custom_work_items_properties",
      "templates.settings.options.work_item.label",
      "legacy_ui.full_time_tracking",
    ],
    business: ["RBAC", "legacy_ui.project_templates", "legacy_ui.baselines_and_deviations", "legacy_ui.custom_reports"],
    enterprise: [
      "legacy_ui.private_managed_deployments",
      "legacy_ui.gac",
      "legacy_ui.ldap_support",
      "legacy_ui.databases_formulas",
    ],
  },
  planComparison: PLANS_COMPARISON_LIST,
};

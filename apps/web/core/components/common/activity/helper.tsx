/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC, ReactNode } from "react";
import {
  RotateCcw,
  Network,
  Inbox,
  AlignLeft,
  Paperclip,
  Type,
  FileText,
  Hash,
  Clock,
  Bell,
  GitBranch,
  Timer,
  ListTodo,
  Layers,
} from "lucide-react";
// components

import {
  LinkIcon,
  ArchiveIcon,
  CycleIcon,
  GlobeIcon,
  DueDatePropertyIcon,
  EstimatePropertyIcon,
  GridLayoutIcon,
  IntakeIcon,
  LabelPropertyIcon,
  MembersPropertyIcon,
  ModuleIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  StatePropertyIcon,
} from "@plane/propel/icons";
import { store } from "@/lib/store-context";
import type { TProjectActivity } from "@plane/types";

type ActivityIconMap = {
  [key: string]: FC<{ className?: string }>;
};
export const iconsMap: ActivityIconMap = {
  priority: PriorityPropertyIcon,
  archived_at: ArchiveIcon,
  restored: RotateCcw,
  link: LinkIcon,
  start_date: StartDatePropertyIcon,
  target_date: DueDatePropertyIcon,
  label: LabelPropertyIcon,
  inbox: Inbox,
  description: AlignLeft,
  assignee: MembersPropertyIcon,
  attachment: Paperclip,
  name: Type,
  state: StatePropertyIcon,
  estimate: EstimatePropertyIcon,
  cycle: CycleIcon,
  module: ModuleIcon,
  page: FileText,
  network: GlobeIcon,
  identifier: Hash,
  timezone: Clock,
  is_project_updates_enabled: Bell,
  is_epic_enabled: GridLayoutIcon,
  is_workflow_enabled: GitBranch,
  is_time_tracking_enabled: Timer,
  is_issue_type_enabled: ListTodo,
  default: Network,
  module_view: ModuleIcon,
  cycle_view: CycleIcon,
  issue_views_view: Layers,
  page_view: FileText,
  intake_view: IntakeIcon,
};

export const messages = (
  activity: TProjectActivity,
  t: (key: string, params?: Record<string, unknown>) => string
): { message: string | ReactNode; customUserName?: string } => {
  const activityType = activity.field;
  const newValue = activity.new_value;
  const oldValue = activity.old_value;
  const verb = activity.verb;
  const workspaceDetail = store.workspaceRoot.getWorkspaceById(activity.workspace);

  const translateVerb = (value: string | undefined) => {
    switch (value) {
      case "created":
        return t("studio.forms.action_created");
      case "added":
        return t("legacy_ui.added");
      case "removed":
        return t("legacy_ui.removed");
      case "deleted":
        return t("legacy_ui.deleted");
      case "restored":
      case "restore":
        return t("legacy_ui.restored");
      case "archived":
      case "archive":
        return t("legacy_ui.archived");
      case "enabled":
      case "true":
        return t("legacy_ui.enabled");
      case "disabled":
      case "false":
        return t("legacy_ui.disabled");
      default:
        return t("update");
    }
  };

  const translatedActivityType = () => {
    switch (activityType) {
      case "priority":
        return t("priority");
      case "state":
        return t("state");
      case "estimate":
        return t("estimate");
      case "cycle":
      case "cycles":
      case "cycle_view":
        return t("cycles");
      case "module":
      case "modules":
      case "module_view":
        return t("modules");
      case "page":
      case "page_view":
        return t("pages");
      case "label":
      case "labels":
        return t("labels");
      case "inbox":
      case "intake_view":
        return t("inbox");
      default:
        return t("settings");
    }
  };

  switch (activityType) {
    case "priority":
      return {
        message: (
          <>
            {t("legacy_ui.set_the_priority_to")}{" "}
            <span className="font-medium text-primary">{newValue || t("none")}</span>
          </>
        ),
      };
    case "archived_at":
      return {
        message: newValue === "restore" ? t("legacy_ui.restored_the_project") : t("legacy_ui.archived_the_project"),
        customUserName: newValue === "archive" ? "Plane" : undefined,
      };
    case "name":
      return {
        message: (
          <>
            {t("legacy_ui.renamed_the_project_to")} <span className="font-medium text-primary">{newValue}</span>
          </>
        ),
      };
    case "description":
      return {
        message: newValue
          ? t("legacy_ui.updated_the_project_description")
          : t("legacy_ui.removed_the_project_description"),
      };
    case "start_date":
      return {
        message: (
          <>
            {newValue ? (
              <>
                {t("legacy_ui.set_the_start_date_to")} <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              t("legacy_ui.removed_the_start_date")
            )}
          </>
        ),
      };
    case "target_date":
      return {
        message: (
          <>
            {newValue ? (
              <>
                {t("legacy_ui.set_the_target_date_to")} <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              t("legacy_ui.removed_the_target_date")
            )}
          </>
        ),
      };
    case "state":
      return {
        message: (
          <>
            {t("legacy_ui.set_the_state_to")} <span className="font-medium text-primary">{newValue || t("none")}</span>
          </>
        ),
      };
    case "estimate":
      return {
        message: (
          <>
            {newValue ? (
              <>
                {t("legacy_ui.set_the_estimate_point_to")} <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              <>
                {t("legacy_ui.removed_the_estimate_point")}
                {oldValue && (
                  <>
                    {" "}
                    <span className="font-medium text-primary">{oldValue}</span>
                  </>
                )}
              </>
            )}
          </>
        ),
      };
    case "cycles":
      return {
        message: (
          <>
            <span>
              {translateVerb(verb)} {t("legacy_ui.this_project")}{" "}
              {verb === "removed" ? t("legacy_ui.from") : t("legacy_ui.to")} {t("legacy_ui.the_cycle")}{" "}
            </span>
            {verb !== "removed" ? (
              <a
                href={`/${workspaceDetail?.slug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex font-medium text-primary"
              >
                {activity.new_value}
              </a>
            ) : (
              <span className="font-medium text-primary">{activity.old_value || t("legacy_ui.unknown_cycle")}</span>
            )}
          </>
        ),
      };
    case "modules":
      return {
        message: (
          <>
            <span>
              {translateVerb(verb)} {t("legacy_ui.this_project")}{" "}
              {verb === "removed" ? t("legacy_ui.from") : t("legacy_ui.to")} {t("legacy_ui.the_module")}{" "}
            </span>
            <span className="font-medium text-primary">
              {verb === "removed" ? oldValue : newValue || t("legacy_ui.unknown_module")}
            </span>
          </>
        ),
      };
    case "labels":
      return {
        message: (
          <>
            {translateVerb(verb)} {t("legacy_ui.the_label")}{" "}
            <span className="font-medium text-primary">{newValue || oldValue || t("legacy_ui.untitled_label")}</span>
          </>
        ),
      };
    case "inbox":
      return {
        message: (
          <>
            {newValue ? t("legacy_ui.enabled") : t("legacy_ui.disabled")} {t("legacy_ui.inbox")}
          </>
        ),
      };
    case "page":
      return {
        message: (
          <>
            {newValue ? t("studio.forms.action_created") : t("legacy_ui.removed")} {t("legacy_ui.the_project_page")}{" "}
            <span className="font-medium text-primary">
              {newValue || oldValue || t("templates.settings.form.page.name.placeholder")}
            </span>
          </>
        ),
      };
    case "network":
      return {
        message: (
          <>
            {newValue ? t("legacy_ui.enabled") : t("legacy_ui.disabled")} {t("legacy_ui.network_access")}
          </>
        ),
      };
    case "identifier":
      return {
        message: (
          <>
            {t("legacy_ui.updated_project_identifier_to")}{" "}
            <span className="font-medium text-primary">{newValue || t("none")}</span>
          </>
        ),
      };
    case "timezone":
      return {
        message: (
          <>
            {t("legacy_ui.changed_project_timezone_to")}{" "}
            <span className="font-medium text-primary">{newValue || t("common.default")}</span>
          </>
        ),
      };
    case "module_view":
    case "cycle_view":
    case "issue_views_view":
    case "page_view":
    case "intake_view":
      return {
        message: (
          <>
            {translateVerb(newValue)} {translatedActivityType()} {t("legacy_ui.view")}
          </>
        ),
      };
    case "is_project_updates_enabled":
      return {
        message: (
          <>
            {translateVerb(newValue)} {t("legacy_ui.project_updates")}
          </>
        ),
      };
    case "is_epic_enabled":
      return {
        message: (
          <>
            {translateVerb(newValue)} {t("legacy_ui.epics")}
          </>
        ),
      };
    case "is_workflow_enabled":
      return {
        message: (
          <>
            {translateVerb(newValue)} {t("legacy_ui.custom_workflow")}
          </>
        ),
      };
    case "is_time_tracking_enabled":
      return {
        message: (
          <>
            {translateVerb(newValue)} {t("legacy_ui.time_tracking")}
          </>
        ),
      };
    case "is_issue_type_enabled":
      return {
        message: (
          <>
            {translateVerb(newValue)} {t("work_item_types.label")}
          </>
        ),
      };
    default:
      return {
        message: `${translateVerb(verb)} ${translatedActivityType()}`,
      };
  }
};

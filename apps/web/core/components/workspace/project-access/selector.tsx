/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@plane/propel/icons";
import { EProjectAccessScope } from "@plane/types";
import type { IWorkspaceProjectAccess, TUserPermissions } from "@plane/types";
import { CustomSelect, MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useProject } from "@/hooks/store/use-project";
import { getAllowedProjectRoles } from "./utils";

type TProjectAccessSelectorProps = {
  value: IWorkspaceProjectAccess;
  workspaceRole: TUserPermissions;
  onChange: (value: IWorkspaceProjectAccess) => void;
  disabled?: boolean;
  hasProjectError?: boolean;
  className?: string;
};

const PROJECT_ACCESS_SCOPE_KEYS = {
  [EProjectAccessScope.ALL]: "workspace_settings.settings.members.project_access.scope.all",
  [EProjectAccessScope.SELECTED]: "workspace_settings.settings.members.project_access.scope.selected",
  [EProjectAccessScope.NONE]: "workspace_settings.settings.members.project_access.scope.none",
} as const;

const PROJECT_ROLE_KEYS = {
  [EUserPermissions.ADMIN]: "workspace_settings.settings.members.project_access.roles.admin",
  [EUserPermissions.MEMBER]: "workspace_settings.settings.members.project_access.roles.member",
  [EUserPermissions.GUEST]: "workspace_settings.settings.members.project_access.roles.guest",
} as const;

export const ProjectAccessSelector = observer(function ProjectAccessSelector(props: TProjectAccessSelectorProps) {
  const { value, workspaceRole, onChange, disabled = false, hasProjectError = false, className } = props;
  const { t } = useTranslation();
  const { workspaceProjectIds, getProjectById } = useProject();

  const scopeOptions = Object.values(EProjectAccessScope).filter(
    (scope) => workspaceRole !== EUserPermissions.GUEST || scope !== EProjectAccessScope.ALL
  );
  const projectRoleOptions = getAllowedProjectRoles(workspaceRole);
  const projectOptions = (workspaceProjectIds ?? []).map((projectId) => {
    const project = getProjectById(projectId);
    return {
      value: projectId,
      data: {
        id: projectId,
        identifier: project?.identifier ?? "",
        name: project?.name ?? "",
      },
    };
  });

  const scopeDescriptionKey =
    value.project_access_scope === EProjectAccessScope.ALL
      ? "workspace_settings.settings.members.project_access.scope_descriptions.all"
      : value.project_access_scope === EProjectAccessScope.NONE
        ? "workspace_settings.settings.members.project_access.scope_descriptions.none"
        : "workspace_settings.settings.members.project_access.scope_descriptions.selected";

  return (
    <div className={cn("grid gap-3 rounded-md border border-subtle bg-surface-1 p-3 sm:grid-cols-2", className)}>
      <label className="flex flex-col gap-1 text-caption-sm-regular text-secondary">
        {t("workspace_settings.settings.members.project_access.project_scope")}
        <CustomSelect
          value={value.project_access_scope}
          label={t(PROJECT_ACCESS_SCOPE_KEYS[value.project_access_scope])}
          onChange={(scope: EProjectAccessScope) =>
            onChange({
              ...value,
              project_access_scope: scope,
              project_ids: scope === EProjectAccessScope.SELECTED ? value.project_ids : [],
            })
          }
          disabled={disabled}
          input
        >
          {scopeOptions.map((scope) => (
            <CustomSelect.Option key={scope} value={scope}>
              {t(PROJECT_ACCESS_SCOPE_KEYS[scope])}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </label>

      <label className="flex flex-col gap-1 text-caption-sm-regular text-secondary">
        {t("workspace_settings.settings.members.project_access.project_role")}
        <CustomSelect
          value={value.default_project_role}
          label={t(PROJECT_ROLE_KEYS[value.default_project_role as keyof typeof PROJECT_ROLE_KEYS])}
          onChange={(projectRole: TUserPermissions) => onChange({ ...value, default_project_role: projectRole })}
          disabled={disabled}
          input
        >
          {projectRoleOptions.map((projectRole) => (
            <CustomSelect.Option key={projectRole} value={projectRole}>
              {t(PROJECT_ROLE_KEYS[projectRole as keyof typeof PROJECT_ROLE_KEYS])}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </label>

      {value.project_access_scope === EProjectAccessScope.SELECTED && (
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-caption-sm-regular text-secondary">
            {t("workspace_settings.settings.members.project_access.projects")}
          </span>
          <MultiSelectDropdown
            value={value.project_ids}
            onChange={(projectIds) => onChange({ ...value, project_ids: projectIds })}
            options={projectOptions}
            keyExtractor={(option) => option.value}
            queryArray={["identifier", "name"]}
            inputIcon={<SearchIcon className="size-3.5 text-placeholder" />}
            inputPlaceholder={t("workspace_settings.settings.members.project_access.search_projects")}
            disabled={disabled}
            buttonContainerClassName="w-full"
            buttonContent={(_isOpen, selectedProjectIds) => (
              <div
                className={cn(
                  "flex h-8 w-full items-center justify-between rounded-md border border-strong px-2.5 text-body-xs-regular",
                  hasProjectError && "border-danger-strong"
                )}
              >
                <span className={value.project_ids.length === 0 ? "text-placeholder" : "text-primary"}>
                  {value.project_ids.length === 0
                    ? t("workspace_settings.settings.members.project_access.select_projects")
                    : t("workspace_settings.settings.members.project_access.selected_projects", {
                        count: Array.isArray(selectedProjectIds) ? selectedProjectIds.length : 0,
                      })}
                </span>
                <ChevronDownIcon className="size-3.5 text-placeholder" />
              </div>
            )}
            optionsContainerClassName="w-72"
            renderItem={({ value: projectId, selected }) => {
              const project = getProjectById(projectId);
              return (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <span className="mr-2 text-placeholder">{project?.identifier}</span>
                    {project?.name}
                  </span>
                  {selected && <CheckIcon className="size-3.5 flex-shrink-0" />}
                </div>
              );
            }}
          />
          {hasProjectError && (
            <span className="text-caption-sm-regular text-danger-primary">
              {t("workspace_settings.settings.members.project_access.errors.select_project")}
            </span>
          )}
        </div>
      )}

      <p className="text-caption-sm-regular text-tertiary sm:col-span-2">{t(scopeDescriptionKey)}</p>
    </div>
  );
});

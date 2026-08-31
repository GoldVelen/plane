/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control, FieldArrayWithId, FormState, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { ROLE_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import { CustomSelect, Input } from "@plane/ui";
import { cn } from "@plane/utils";
import type { TUserPermissions } from "@plane/types";
import { EProjectAccessScope } from "@plane/types";
import { ProjectAccessSelector, getDefaultProjectAccess } from "@/components/workspace/project-access";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import type { InvitationFormValues } from "@/hooks/use-workspace-invitation";

type TInvitationFieldsProps = {
  workspaceSlug: string;
  fields: FieldArrayWithId<InvitationFormValues, "emails", "id">[];
  control: Control<InvitationFormValues>;
  formState: FormState<InvitationFormValues>;
  setValue: UseFormSetValue<InvitationFormValues>;
  remove: (index: number) => void;
  className?: string;
};

export const InvitationFields = observer(function InvitationFields(props: TInvitationFieldsProps) {
  const {
    workspaceSlug,
    fields,
    control,
    formState: { errors },
    setValue,
    remove,
    className,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  // derived values
  const currentWorkspaceRole = workspaceInfoBySlug(workspaceSlug.toString())?.role;

  return (
    <div className={cn("mb-3 space-y-4", className)}>
      {fields.map((field, index) => (
        <div key={field.id} className="group relative rounded-md border border-subtle p-3 text-body-xs-regular">
          <div className="flex w-full items-start justify-between gap-x-4">
            <div className="w-full">
              <Controller
                control={control}
                name={`emails.${index}.email`}
                rules={{
                  required: t("workspace_settings.settings.members.modal.errors.required"),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t("workspace_settings.settings.members.modal.errors.invalid"),
                  },
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <>
                    <Input
                      id={`emails.${index}.email`}
                      name={`emails.${index}.email`}
                      type="text"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      hasError={Boolean(errors.emails?.[index]?.email)}
                      placeholder={t("workspace_settings.settings.members.modal.placeholder")}
                      className="w-full text-caption-sm-regular sm:text-body-xs-regular"
                    />
                    {errors.emails?.[index]?.email && (
                      <span className="ml-1 text-caption-sm-regular text-danger-primary">
                        {errors.emails?.[index]?.email?.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <Controller
                  control={control}
                  name={`emails.${index}.role`}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <CustomSelect
                      value={value}
                      label={
                        <span className="text-caption-sm-regular sm:text-body-xs-regular">
                          {t(ROLE_DETAILS[value as keyof typeof ROLE_DETAILS].i18n_title)}
                        </span>
                      }
                      onChange={(workspaceRole: TUserPermissions) => {
                        onChange(workspaceRole);
                        const defaults = getDefaultProjectAccess(workspaceRole);
                        setValue(`emails.${index}.project_access_scope`, defaults.project_access_scope, {
                          shouldValidate: true,
                        });
                        setValue(`emails.${index}.default_project_role`, defaults.default_project_role, {
                          shouldValidate: true,
                        });
                        setValue(`emails.${index}.project_ids`, defaults.project_ids, { shouldValidate: true });
                      }}
                      className="w-24 flex-grow"
                      input
                    >
                      {Object.entries(ROLE_DETAILS).map(([key, roleDetails]) => {
                        if (currentWorkspaceRole && currentWorkspaceRole >= parseInt(key))
                          return (
                            <CustomSelect.Option key={key} value={parseInt(key)}>
                              {t(roleDetails.i18n_title)}
                            </CustomSelect.Option>
                          );
                      })}
                    </CustomSelect>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <div className="flex-item flex w-6">
                  <button
                    type="button"
                    className="place-items-center self-center rounded-sm"
                    onClick={() => remove(index)}
                  >
                    <CloseIcon className="h-4 w-4 text-secondary" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <Controller
              control={control}
              name={`emails.${index}.role`}
              render={({ field: workspaceRoleField }) => (
                <Controller
                  control={control}
                  name={`emails.${index}.project_access_scope`}
                  render={({ field: scopeField }) => (
                    <Controller
                      control={control}
                      name={`emails.${index}.default_project_role`}
                      render={({ field: projectRoleField }) => (
                        <Controller
                          control={control}
                          name={`emails.${index}.project_ids`}
                          rules={{
                            validate: (projectIds, formValues) =>
                              formValues.emails[index].project_access_scope !== EProjectAccessScope.SELECTED ||
                              projectIds.length > 0,
                          }}
                          render={({ field: projectIdsField }) => (
                            <ProjectAccessSelector
                              workspaceRole={workspaceRoleField.value}
                              value={{
                                project_access_scope: scopeField.value,
                                default_project_role: projectRoleField.value,
                                project_ids: projectIdsField.value,
                              }}
                              onChange={(projectAccess) => {
                                scopeField.onChange(projectAccess.project_access_scope);
                                projectRoleField.onChange(projectAccess.default_project_role);
                                projectIdsField.onChange(projectAccess.project_ids);
                              }}
                              hasProjectError={Boolean(errors.emails?.[index]?.project_ids)}
                            />
                          )}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

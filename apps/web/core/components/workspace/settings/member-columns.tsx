/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { Disclosure } from "@headlessui/react";
// plane imports
import { ROLE_DETAILS, EUserPermissions, EUserPermissionsLevel, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TrashIcon, SuspendedUserIcon } from "@plane/propel/icons";
import { Pill, EPillVariant, EPillSize } from "@plane/propel/pill";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EProjectAccessScope } from "@plane/types";
import type { IUser, IWorkspaceMember } from "@plane/types";
// plane ui
import { CustomSelect, PopoverMenu } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { MemberAccessModal } from "@/components/workspace/project-access";

export type RowData = Omit<IWorkspaceMember, "role"> & {
  role: EUserPermissions;
  is_active: boolean;
};

type NameProps = {
  rowData: RowData;
  workspaceSlug: string;
  isAdmin: boolean;
  currentUser: IUser | undefined;
  setRemoveMemberModal: (rowData: RowData) => void;
};

type AccountTypeProps = {
  rowData: RowData;
  workspaceSlug: string;
};

type ProjectAccessProps = AccountTypeProps & {
  isAdmin: boolean;
  currentUserId?: string;
};

export function NameColumn(props: NameProps) {
  const { rowData, workspaceSlug, isAdmin, currentUser, setRemoveMemberModal } = props;
  const { t } = useTranslation();
  // derived values
  const { avatar_url, display_name, email, first_name, id, last_name } = rowData.member;
  const isSuspended = rowData.is_active === false;

  return (
    <Disclosure>
      {() => (
        <div className="group relative">
          <div className="flex w-72 items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-1 items-center gap-x-2 gap-y-2">
              {isSuspended ? (
                <div className="rounded-full bg-layer-1">
                  <SuspendedUserIcon className="size-6 text-placeholder" />
                </div>
              ) : avatar_url && avatar_url.trim() !== "" ? (
                <Link href={`/${workspaceSlug}/profile/${id}`}>
                  <span className="relative flex size-6 items-center justify-center rounded-full text-on-color capitalize">
                    <img
                      src={getFileURL(avatar_url)}
                      className="absolute top-0 left-0 h-full w-full rounded-full object-cover"
                      alt={display_name || email}
                    />
                  </span>
                </Link>
              ) : (
                <Link href={`/${workspaceSlug}/profile/${id}`}>
                  <span className="relative flex size-6 items-center justify-center rounded-full bg-layer-3 text-11 text-tertiary capitalize">
                    {(email ?? display_name ?? "?")[0]}
                  </span>
                </Link>
              )}
              <span className={isSuspended ? "text-placeholder" : ""}>
                {first_name} {last_name}
              </span>
            </div>

            {!isSuspended && (isAdmin || id === currentUser?.id) && (
              <PopoverMenu
                data={[""]}
                keyExtractor={(item) => item}
                popoverClassName="justify-end"
                buttonClassName="outline-none	origin-center rotate-90 size-8 aspect-square flex-shrink-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                render={() => (
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-x-3"
                    onClick={() => setRemoveMemberModal(rowData)}
                    data-ph-element={MEMBER_TRACKER_ELEMENTS.WORKSPACE_MEMBER_TABLE_CONTEXT_MENU}
                  >
                    <TrashIcon className="size-3.5 align-middle" />
                    {id === currentUser?.id ? t("leave") : t("common.remove")}
                  </button>
                )}
              />
            )}
          </div>
        </div>
      )}
    </Disclosure>
  );
}

export const AccountTypeColumn = observer(function AccountTypeColumn(props: AccountTypeProps) {
  const { rowData, workspaceSlug } = props;
  const { t } = useTranslation();
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const {
    workspace: { updateMember },
  } = useMember();
  const { data: currentUser } = useUser();

  // derived values
  const isCurrentUser = currentUser?.id === rowData.member.id;
  const isAdminRole = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isRoleNonEditable = isCurrentUser || !isAdminRole;
  const isSuspended = rowData.is_active === false;

  return (
    <>
      {isSuspended ? (
        <div className="flex w-32">
          <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="border-none">
            {t("workspace_settings.settings.members.status.suspended")}
          </Pill>
        </div>
      ) : isRoleNonEditable ? (
        <div className="flex w-32">
          <span>{t(ROLE_DETAILS[rowData.role as keyof typeof ROLE_DETAILS].i18n_title)}</span>
        </div>
      ) : (
        <Controller
          name="role"
          control={control}
          rules={{ required: t("project_settings.members.errors.role_required") }}
          render={({ field: { value } }) => (
            <CustomSelect
              value={value as EUserPermissions}
              onChange={async (workspaceRole: EUserPermissions) => {
                if (!workspaceSlug) return;
                try {
                  await updateMember(workspaceSlug.toString(), rowData.member.id, {
                    role: workspaceRole,
                  });
                } catch (err: unknown) {
                  const error = err as { error?: string | string[] };
                  const errorString = Array.isArray(error?.error) ? error.error[0] : error?.error;

                  setToast({
                    type: TOAST_TYPE.ERROR,
                    title: t("toast.error"),
                    message: errorString ?? t("workspace_settings.settings.members.toasts.role_update_failed"),
                  });
                }
              }}
              label={
                <div className="flex">
                  <span>{t(ROLE_DETAILS[rowData.role as keyof typeof ROLE_DETAILS].i18n_title)}</span>
                </div>
              }
              buttonClassName={`!px-0 !justify-start hover:bg-surface-1 ${errors.role ? "border-danger-strong" : "border-none"}`}
              className="w-32 rounded-md p-0"
              input
            >
              {Object.entries(ROLE_DETAILS).map(([role, roleDetails]) => (
                <CustomSelect.Option key={role} value={Number(role) as EUserPermissions}>
                  {t(roleDetails.i18n_title)}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      )}
    </>
  );
});

export const ProjectAccessColumn = observer(function ProjectAccessColumn(props: ProjectAccessProps) {
  const { rowData, workspaceSlug, isAdmin, currentUserId } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const projectCount = rowData.project_ids?.length ?? 0;
  const scope = rowData.project_access_scope ?? EProjectAccessScope.SELECTED;
  const label =
    scope === EProjectAccessScope.ALL
      ? t("workspace_settings.settings.members.project_access.summary.all")
      : scope === EProjectAccessScope.NONE
        ? t("workspace_settings.settings.members.project_access.summary.none")
        : t("workspace_settings.settings.members.project_access.summary.selected", { count: projectCount });
  const canEdit = isAdmin && rowData.member.id !== currentUserId && rowData.is_active;

  return (
    <>
      {isModalOpen && (
        <MemberAccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workspaceSlug={workspaceSlug}
          member={rowData}
        />
      )}
      {canEdit ? (
        <button
          type="button"
          className="w-40 truncate text-left text-accent-primary hover:underline"
          onClick={() => setIsModalOpen(true)}
        >
          {label}
        </button>
      ) : (
        <span className="block w-40 truncate">{label}</span>
      )}
    </>
  );
});

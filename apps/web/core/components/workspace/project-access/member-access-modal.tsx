/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EProjectAccessScope } from "@plane/types";
import type { IWorkspaceMember, IWorkspaceProjectAccess, TUserPermissions } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useMember } from "@/hooks/store/use-member";
import { ProjectAccessSelector } from "./selector";

type TMemberAccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  member: IWorkspaceMember;
};

const getMemberProjectAccess = (member: IWorkspaceMember): IWorkspaceProjectAccess => ({
  project_access_scope: member.project_access_scope ?? EProjectAccessScope.SELECTED,
  default_project_role: member.default_project_role ?? (member.role as TUserPermissions),
  project_ids: member.project_ids ?? [],
});

export const MemberAccessModal = observer(function MemberAccessModal(props: TMemberAccessModalProps) {
  const { isOpen, onClose, workspaceSlug, member } = props;
  const [projectAccess, setProjectAccess] = useState<IWorkspaceProjectAccess>(() => getMemberProjectAccess(member));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProjectError, setShowProjectError] = useState(false);
  const { t } = useTranslation();
  const {
    workspace: { updateMember },
  } = useMember();

  useEffect(() => {
    if (!isOpen) return;
    setProjectAccess(getMemberProjectAccess(member));
    setShowProjectError(false);
  }, [isOpen, member]);

  const handleSubmit = async () => {
    if (projectAccess.project_access_scope === EProjectAccessScope.SELECTED && projectAccess.project_ids.length === 0) {
      setShowProjectError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMember(workspaceSlug, member.member.id, projectAccess);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.members.project_access.updated_title"),
        message: t("workspace_settings.settings.members.project_access.updated_message"),
      });
      onClose();
    } catch (error: unknown) {
      const responseError = error as { error?: string | string[] };
      const message = Array.isArray(responseError.error) ? responseError.error[0] : responseError.error;
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.members.project_access.update_failed_title"),
        message: message ?? t("something_went_wrong_please_try_again"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XL} handleClose={onClose}>
      <div className="p-5">
        <Dialog.Title as="h3" className="text-body-md-medium text-primary">
          {t("workspace_settings.settings.members.project_access.edit_title", {
            name: member.member.display_name || member.member.email,
          })}
        </Dialog.Title>
        <p className="mt-1 text-body-xs-regular text-secondary">
          {t("workspace_settings.settings.members.project_access.edit_description")}
        </p>

        <ProjectAccessSelector
          className="mt-4"
          value={projectAccess}
          workspaceRole={member.role as TUserPermissions}
          onChange={(value) => {
            setProjectAccess(value);
            if (value.project_ids.length > 0 || value.project_access_scope !== EProjectAccessScope.SELECTED)
              setShowProjectError(false);
          }}
          hasProjectError={showProjectError}
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" loading={isSubmitting} onClick={handleSubmit}>
            {t("save_changes")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

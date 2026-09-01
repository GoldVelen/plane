/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// types
import { PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ICycle } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useAppRouter } from "@/hooks/use-app-router";

interface ICycleDelete {
  cycle: ICycle;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  projectId: string;
}

export const CycleDeleteModal = observer(function CycleDeleteModal(props: ICycleDelete) {
  const { isOpen, handleClose, cycle, workspaceSlug, projectId } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { deleteCycle } = useCycle();
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  const { cycleId } = useParams();
  const searchParams = useSearchParams();
  const peekCycle = searchParams.get("peekCycle");

  const formSubmit = async () => {
    if (!cycle) return;

    setLoader(true);
    try {
      await deleteCycle(workspaceSlug, projectId, cycle.id)
        .then(() => {
          if (cycleId || peekCycle) router.push(`/${workspaceSlug}/projects/${projectId}/cycles`);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("legacy_ui.cycle_deleted_successfully"),
          });
        })
        .catch((errors) => {
          const isPermissionError = errors?.error === "You don't have the required permissions.";
          const currentError = isPermissionError
            ? PROJECT_ERROR_MESSAGES.permissionError
            : PROJECT_ERROR_MESSAGES.cycleDeleteError;
          setToast({
            title: t(currentError.i18n_title),
            type: TOAST_TYPE.ERROR,
            message: currentError.i18n_message && t(currentError.i18n_message),
          });
        })
        .finally(() => handleClose());
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("legacy_ui.warning"),
        message: t("legacy_ui.something_went_wrong_please_try_again_later"),
      });
    }

    setLoader(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("legacy_ui.delete_cycle")}
      content={
        <>
          {t("legacy_ui.are_you_sure_you_want_to_delete_cycle")}
          {' "'}
          <span className="font-medium break-words text-primary">{cycle?.name}</span>
          {'"'}
          {t("legacy_ui.all_of_the_data_related_to_the_cycle_will_be_permanently_removed_this_action_can")}
        </>
      }
    />
  );
});

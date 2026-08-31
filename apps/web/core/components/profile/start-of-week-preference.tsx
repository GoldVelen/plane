/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EStartOfTheWeek } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
import { getLocalizedWeekdayLabel } from "./weekday-label";
// hooks
import { useUserProfile } from "@/hooks/store/user";

export const StartOfWeekPreference = observer(function StartOfWeekPreference() {
  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();
  const { currentLocale, t } = useTranslation();

  const getStartOfWeekLabel = (startOfWeek: EStartOfTheWeek) => getLocalizedWeekdayLabel(startOfWeek, currentLocale);

  const handleStartOfWeekChange = async (val: number) => {
    try {
      await updateUserProfile({ start_of_the_week: val });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("power_k.preferences_actions.toast.generic.success"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("power_k.preferences_actions.toast.generic.error"),
      });
    }
  };

  return (
    <SettingsControlItem
      title={t("power_k.preferences_actions.update_start_of_week")}
      control={
        <CustomSelect
          value={userProfile.start_of_the_week}
          label={getStartOfWeekLabel(userProfile.start_of_the_week)}
          onChange={handleStartOfWeekChange}
          buttonClassName="border border-subtle-1"
          input
          maxHeight="lg"
          placement="bottom-end"
        >
          <>
            {START_OF_THE_WEEK_OPTIONS.map((day) => (
              <CustomSelect.Option key={day.value} value={day.value}>
                {getLocalizedWeekdayLabel(day.value, currentLocale)}
              </CustomSelect.Option>
            ))}
          </>
        </CustomSelect>
      }
    />
  );
});

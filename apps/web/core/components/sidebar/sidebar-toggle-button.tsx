/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PanelLeft } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const AppSidebarToggleButton = observer(function AppSidebarToggleButton() {
  const { t } = useTranslation();
  // store hooks
  const { toggleSidebar, sidebarPeek, toggleSidebarPeek } = useAppTheme();

  return (
    <IconButton
      size="base"
      variant="ghost"
      icon={PanelLeft}
      aria-label={t("aria_labels.projects_sidebar.expand_sidebar")}
      onClick={() => {
        if (sidebarPeek) toggleSidebarPeek(false);
        toggleSidebar();
      }}
    />
  );
});

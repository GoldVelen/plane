/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { X } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { PROFILE_SETTINGS } from "@plane/constants";
import { IconButton } from "@plane/propel/icon-button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import { ProfileSettingsContent } from "./content";
import { ProfileSettingsSidebarRoot } from "./sidebar";

export const ProfileSettingsModal = observer(function ProfileSettingsModal() {
  // store hooks
  const { profileSettingsModal, toggleProfileSettingsModal } = useCommandPalette();
  // derived values
  const activeTab = profileSettingsModal.activeTab ?? "general";

  const handleClose = useCallback(() => {
    toggleProfileSettingsModal({
      isOpen: false,
    });
    setTimeout(() => {
      toggleProfileSettingsModal({
        activeTab: null,
      });
    }, 300);
  }, [toggleProfileSettingsModal]);

  return (
    <ModalCore
      isOpen={profileSettingsModal.isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIXL}
      className="h-[calc(100dvh-2rem)] md:h-175"
    >
      <div className="@container relative size-full">
        <div className="flex size-full flex-col">
          <SettingsMobileNav
            activePath={PROFILE_SETTINGS[activeTab].i18n_label}
            className="pr-12"
            hamburgerContent={(mobileProps) => (
              <ProfileSettingsSidebarRoot
                {...mobileProps}
                activeTab={activeTab}
                updateActiveTab={(tab) => toggleProfileSettingsModal({ activeTab: tab })}
              />
            )}
          />
          <div className="flex min-h-0 flex-1">
            <ProfileSettingsSidebarRoot
              activeTab={activeTab}
              className="hidden w-[250px] rounded-l-xl md:block"
              updateActiveTab={(tab) => toggleProfileSettingsModal({ activeTab: tab })}
            />
            <ProfileSettingsContent
              activeTab={activeTab}
              className="w-full flex-1 rounded-b-xl md:rounded-r-xl md:rounded-bl-none"
            />
          </div>
        </div>
        <div className="absolute top-3.5 right-3.5">
          <IconButton size="base" variant="tertiary" icon={X} onClick={handleClose} />
        </div>
      </div>
    </ModalCore>
  );
});

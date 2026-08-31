/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { PROFILE_SETTINGS, PROFILE_SETTINGS_TABS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TProfileSettingsTabs } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { ProfileSettingsContent } from "@/components/settings/profile/content";
import { ProfileSettingsSidebarRoot } from "@/components/settings/profile/sidebar";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import type { Route } from "../+types/layout";

function ProfileSettingsPage(props: Route.ComponentProps) {
  const { profileTabId } = props.params;
  // router
  const router = useAppRouter();
  // store hooks
  const { data: currentUser } = useUser();
  // translation
  const { t } = useTranslation();
  // derived values
  const isAValidTab = PROFILE_SETTINGS_TABS.includes(profileTabId as TProfileSettingsTabs);

  if (!currentUser || !isAValidTab)
    return (
      <div className="grid size-full place-items-center px-4">
        <LogoSpinner />
      </div>
    );

  const activeTab = profileTabId as TProfileSettingsTabs;

  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t("general_settings")}`} />
      <div className="relative flex size-full flex-col">
        <SettingsMobileNav
          activePath={PROFILE_SETTINGS[activeTab].i18n_label}
          hamburgerContent={(mobileProps) => (
            <ProfileSettingsSidebarRoot
              {...mobileProps}
              activeTab={activeTab}
              updateActiveTab={(tab) => router.push(`/settings/profile/${tab}`)}
            />
          )}
        />
        <div className="flex min-h-0 flex-1">
          <ProfileSettingsSidebarRoot
            activeTab={activeTab}
            className="hidden w-[250px] md:block"
            updateActiveTab={(tab) => router.push(`/settings/profile/${tab}`)}
          />
          <ProfileSettingsContent
            activeTab={activeTab}
            className="w-full grow md:mx-auto md:max-w-225 md:px-page-x md:py-20"
          />
        </div>
      </div>
    </>
  );
}

export default observer(ProfileSettingsPage);

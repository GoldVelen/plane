/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import Link from "next/link";
// ui
import { Button } from "@plane/propel/button";
// layouts
import DefaultLayout from "@/layouts/default-layout";

export function NotAWorkspaceMember() {
  const { t } = useTranslation();
  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">{t("legacy_ui.not_authorized")}</h3>
            <p className="mx-auto w-1/2 text-13 text-secondary">
              {t("you")}
              {"'"}
              {t("legacy_ui.re_not_a_member_of_this_workspace_please_contact_the_workspace_admin_to_get_an_i")}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Link href="/invitations">
              <span>
                <Button variant="secondary">{t("legacy_ui.check_pending_invites")}</Button>
              </span>
            </Link>
            <Link href="/create-workspace">
              <span>
                <Button variant="primary">{t("legacy_ui.create_new_workspace")}</Button>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}

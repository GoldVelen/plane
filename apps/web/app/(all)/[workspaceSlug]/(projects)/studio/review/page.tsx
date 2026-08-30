/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { CalendarLayoutIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
import { AppHeader } from "@/components/core/app-header";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { StudioWeeklyReviewView } from "@/components/studio/cadence";

export default function StudioWeeklyReviewPage({ params }: { params: { workspaceSlug: string } }) {
  const { t } = useTranslation();

  return (
    <>
      <AppHeader
        header={
          <Header>
            <Header.LeftItem>
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink
                      label={t("studio.navigation.review")}
                      icon={<CalendarLayoutIcon className="size-4 text-tertiary" />}
                    />
                  }
                />
              </Breadcrumbs>
            </Header.LeftItem>
          </Header>
        }
      />
      <StudioWeeklyReviewView workspaceSlug={params.workspaceSlug} />
    </>
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { OverviewIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { AppHeader } from "@/components/core/app-header";
import { StudioProjectOverviewView } from "@/components/studio/project-overview";

export default function StudioProjectOverviewPage({
  params,
}: {
  params: { workspaceSlug: string; projectId: string };
}) {
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
                      label={t("common.overview")}
                      icon={<OverviewIcon className="size-4 text-tertiary" />}
                    />
                  }
                />
              </Breadcrumbs>
            </Header.LeftItem>
          </Header>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <StudioProjectOverviewView workspaceSlug={params.workspaceSlug} projectId={params.projectId} />
      </div>
    </>
  );
}

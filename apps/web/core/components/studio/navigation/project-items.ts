/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EUserPermissions } from "@plane/constants";
import { OverviewIcon } from "@plane/propel/icons";
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";

export const getStudioProjectNavigationItems = (workspaceSlug: string, projectId: string): TNavigationItem[] => [
  {
    i18n_key: "common.overview",
    key: "overview",
    name: "Overview",
    href: `/${workspaceSlug}/projects/${projectId}/overview`,
    icon: OverviewIcon,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    shouldRender: true,
    sortOrder: 0,
  },
];

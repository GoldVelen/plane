/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        route(":workspaceSlug/studio/portfolio", "./(all)/[workspaceSlug]/(projects)/studio/portfolio/page.tsx"),
        route(":workspaceSlug/studio/operations", "./(all)/[workspaceSlug]/(projects)/studio/operations/page.tsx"),
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/overview",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/overview/page.tsx"
          ),
          route(
            ":workspaceSlug/projects/:projectId/operations",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/operations/page.tsx"
          ),
        ]),
      ]),
    ]),
  ]),
];

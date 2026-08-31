/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EUserPermissions } from "@plane/constants";
import { EProjectAccessScope } from "@plane/types";
import type { IWorkspaceProjectAccess, TUserPermissions } from "@plane/types";

export const getDefaultProjectAccess = (workspaceRole: TUserPermissions): IWorkspaceProjectAccess => ({
  project_access_scope:
    workspaceRole === EUserPermissions.ADMIN ? EProjectAccessScope.ALL : EProjectAccessScope.SELECTED,
  default_project_role: workspaceRole,
  project_ids: [],
});

export const getAllowedProjectRoles = (workspaceRole: TUserPermissions): TUserPermissions[] => {
  if (workspaceRole === EUserPermissions.ADMIN) return [EUserPermissions.ADMIN];
  if (workspaceRole === EUserPermissions.GUEST) return [EUserPermissions.GUEST];
  return [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST];
};

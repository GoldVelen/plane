/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EUserPermissions } from "@plane/constants";
import { EProjectAccessScope } from "@plane/types";
import { getAllowedProjectRoles, getDefaultProjectAccess } from "./utils";

describe("workspace project access defaults", () => {
  it("adds workspace admins to all public projects as project admins", () => {
    assert.deepEqual(getDefaultProjectAccess(EUserPermissions.ADMIN), {
      project_access_scope: EProjectAccessScope.ALL,
      default_project_role: EUserPermissions.ADMIN,
      project_ids: [],
    });
  });

  it("requires members and guests to select projects explicitly", () => {
    assert.equal(getDefaultProjectAccess(EUserPermissions.MEMBER).project_access_scope, EProjectAccessScope.SELECTED);
    assert.equal(getDefaultProjectAccess(EUserPermissions.GUEST).project_access_scope, EProjectAccessScope.SELECTED);
  });

  it("keeps workspace admin and guest project roles aligned with their workspace roles", () => {
    assert.deepEqual(getAllowedProjectRoles(EUserPermissions.ADMIN), [EUserPermissions.ADMIN]);
    assert.deepEqual(getAllowedProjectRoles(EUserPermissions.GUEST), [EUserPermissions.GUEST]);
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticViewFilterCondition } from "./static-view-filter.ts";

describe("getStaticViewFilterCondition", () => {
  it("returns the workspace-wide unassigned filter without depending on a profile user", () => {
    assert.deepEqual(getStaticViewFilterCondition(undefined, "unassigned"), { assignees: "None" });
  });

  it("keeps the existing personal static view filters", () => {
    assert.deepEqual(getStaticViewFilterCondition("user-1", "assigned"), { assignees: "user-1" });
    assert.deepEqual(getStaticViewFilterCondition("user-1", "created"), { created_by: "user-1" });
    assert.deepEqual(getStaticViewFilterCondition("user-1", "subscribed"), { subscriber: "user-1" });
    assert.equal(getStaticViewFilterCondition("user-1", "all-issues"), undefined);
  });
});

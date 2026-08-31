/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLocalizedWeekdayLabel } from "./weekday-label";

describe("getLocalizedWeekdayLabel", () => {
  it("formats the same stored weekday for the active interface locale", () => {
    assert.equal(getLocalizedWeekdayLabel(0, "en"), "Sunday");
    assert.equal(getLocalizedWeekdayLabel(0, "zh-CN"), "星期日");
    assert.equal(getLocalizedWeekdayLabel(1, "zh-CN"), "星期一");
  });
});

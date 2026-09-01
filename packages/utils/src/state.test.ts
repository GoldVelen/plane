/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTranslatedStateName } from "./state";

const translations: Record<string, string> = {
  "common.default_state.backlog": "待办",
  "common.default_state.todo": "待处理",
  "common.default_state.in_progress": "进行中",
  "common.default_state.done": "已完成",
  "common.default_state.cancelled": "已取消",
};

const t = (key: string) => translations[key] ?? key;

describe("getTranslatedStateName", () => {
  it("translates default English state names case-insensitively", () => {
    assert.equal(getTranslatedStateName("Backlog", t), "待办");
    assert.equal(getTranslatedStateName("todo", t), "待处理");
    assert.equal(getTranslatedStateName("In Progress", t), "进行中");
    assert.equal(getTranslatedStateName("Done", t), "已完成");
    assert.equal(getTranslatedStateName("Cancelled", t), "已取消");
    assert.equal(getTranslatedStateName("Canceled", t), "已取消");
  });

  it("leaves custom state names unchanged", () => {
    assert.equal(getTranslatedStateName("Ready for QA", t), "Ready for QA");
  });

  it("returns an empty string for missing names", () => {
    assert.equal(getTranslatedStateName(undefined, t), "");
    assert.equal(getTranslatedStateName(null, t), "");
  });

  it("falls back to the original name when the translation is missing", () => {
    assert.equal(
      getTranslatedStateName("Backlog", (key) => key),
      "Backlog"
    );
  });
});

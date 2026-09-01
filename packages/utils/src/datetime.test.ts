/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setDefaultOptions } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { renderFormattedDate } from "./datetime";

describe("renderFormattedDate", () => {
  it("uses the active date locale for the default display format", () => {
    const date = new Date(2026, 8, 3, 12, 0, 0);

    setDefaultOptions({ locale: zhCN });
    assert.equal(renderFormattedDate(date), "2026年9月03日");

    setDefaultOptions({ locale: enUS });
    assert.equal(renderFormattedDate(date), "Sep 03, 2026");
  });
});

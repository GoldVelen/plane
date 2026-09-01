/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDefaultOptions } from "date-fns";
import { SUPPORTED_LANGUAGES } from "../constants/language";
import { setDateLocale } from "./date-locale";

describe("date locale", () => {
  it("loads a date-fns locale for every supported application language", async () => {
    for (const language of SUPPORTED_LANGUAGES) {
      // The assertion intentionally observes the global default after each sequential update.
      // eslint-disable-next-line no-await-in-loop
      await setDateLocale(language.value);
      assert.ok(getDefaultOptions().locale?.code, `Missing date locale for ${language.value}`);
    }
  });
});

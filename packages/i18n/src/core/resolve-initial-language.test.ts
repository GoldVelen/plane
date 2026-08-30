/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FALLBACK_LANGUAGE } from "../constants/language";
import { matchSupportedLanguage, resolveInitialLanguage } from "./resolve-initial-language";

describe("resolveInitialLanguage", () => {
  it("keeps FALLBACK_LANGUAGE as English", () => {
    assert.equal(FALLBACK_LANGUAGE, "en");
  });

  it("prefers a supported stored language over the navigator list", () => {
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: "zh-CN",
        navigatorLanguages: ["en", "fr"],
      }),
      "zh-CN"
    );
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: "en",
        navigatorLanguages: ["zh-CN"],
      }),
      "en"
    );
  });

  it("ignores unsupported stored values and falls through to navigator", () => {
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: "not-a-locale",
        navigatorLanguages: ["zh-CN", "en"],
      }),
      "zh-CN"
    );
  });

  it("selects the first exact navigator match", () => {
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: ["zh-CN", "en"],
      }),
      "zh-CN"
    );
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: ["en-US", "en", "zh-CN"],
      }),
      "en"
    );
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: ["pt-BR"],
      }),
      "pt-BR"
    );
  });

  it("does not map a language prefix such as zh onto zh-CN", () => {
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: ["zh", "en"],
      }),
      "en"
    );
    assert.equal(matchSupportedLanguage("zh"), null);
    assert.equal(matchSupportedLanguage("zh-Hans-CN"), null);
  });

  it("canonicalizes case-insensitive exact tags", () => {
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: ["zh-cn"],
      }),
      "zh-CN"
    );
    assert.equal(matchSupportedLanguage("ZH-TW"), "zh-TW");
  });

  it("falls back to English when nothing matches", () => {
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: ["zh-Hans-CN", "en-US"],
      }),
      "en"
    );
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: "",
        navigatorLanguages: [],
      }),
      "en"
    );
    assert.equal(
      resolveInitialLanguage({
        storedLanguage: null,
        navigatorLanguages: null,
      }),
      "en"
    );
  });
});

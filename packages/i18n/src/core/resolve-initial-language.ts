/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FALLBACK_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "../constants/language";
import type { TLanguage } from "../types";

const SUPPORTED_LANGUAGE_BY_LOWERCASE = new Map(
  SUPPORTED_LANGUAGES.map((language) => [language.value.toLowerCase(), language.value] as const)
);

/**
 * Exact supported-language match. Tags are compared case-insensitively because
 * BCP 47 is case-insensitive (`zh-cn` == `zh-CN`); prefixes such as `zh` are
 * not mapped onto `zh-CN` / `zh-TW`.
 */
export function matchSupportedLanguage(candidate: string | null | undefined): TLanguage | null {
  if (!candidate) return null;
  return SUPPORTED_LANGUAGE_BY_LOWERCASE.get(candidate.toLowerCase()) ?? null;
}

export function resolveInitialLanguage(input: {
  storedLanguage: string | null | undefined;
  navigatorLanguages: readonly string[] | null | undefined;
}): TLanguage {
  const stored = matchSupportedLanguage(input.storedLanguage);
  if (stored) return stored;

  for (const candidate of input.navigatorLanguages ?? []) {
    const matched = matchSupportedLanguage(candidate);
    if (matched) return matched;
  }

  return FALLBACK_LANGUAGE;
}

export function readStoredLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readNavigatorLanguages(): string[] {
  if (typeof navigator === "undefined") return [];

  const fromList = Array.isArray(navigator.languages)
    ? navigator.languages.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
  if (fromList.length > 0) return fromList;

  if (typeof navigator.language === "string" && navigator.language.length > 0) {
    return [navigator.language];
  }

  return [];
}

/**
 * Client: localStorage `userLanguage` → first exact navigator match → `en`.
 * SSR / no `window`: always `FALLBACK_LANGUAGE` (`en`).
 */
export function resolveRuntimeInitialLanguage(): TLanguage {
  if (typeof window === "undefined") return FALLBACK_LANGUAGE;
  return resolveInitialLanguage({
    storedLanguage: readStoredLanguage(),
    navigatorLanguages: readNavigatorLanguages(),
  });
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { getStateNameTranslationKey } from "@plane/constants";

type TTranslate = (key: string) => string;

/**
 * Translate a project state name when it matches a default (Backlog, Todo, …).
 * Custom / renamed states are returned unchanged.
 */
export function getTranslatedStateName(name: string | undefined | null, t: TTranslate): string {
  if (!name) return "";
  const key = getStateNameTranslationKey(name);
  if (!key) return name;
  const translated = t(key);
  // i18next returns the key itself when the translation is missing.
  return !translated || translated === key ? name : translated;
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { useTranslation } from "@plane/i18n";

/**
 * Locale-aware date formatting for Studio surfaces. Follows the current profile
 * language via Intl.DateTimeFormat instead of hard-coding a locale; invalid dates
 * and empty values resolve to a translated "not set" label.
 */
export function useStudioDateFormatter() {
  const { currentLocale, t } = useTranslation();

  return useCallback(
    (value: string | null, options?: Intl.DateTimeFormatOptions) => {
      if (!value) return t("studio.common.not_set");

      const date = new Date(value);
      if (Number.isNaN(date.valueOf())) return t("studio.common.not_set");

      return new Intl.DateTimeFormat(
        currentLocale,
        options ?? { month: "short", day: "numeric", year: "numeric" }
      ).format(date);
    },
    [currentLocale, t]
  );
}

const RELATIVE_TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 5],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/**
 * Locale-aware "time ago" text for Studio surfaces, built on Intl.RelativeTimeFormat
 * so it follows the current profile language (e.g. "2 hours ago" / "2小时前").
 * Future timestamps render with the matching positive form.
 */
export function useStudioRelativeTimeFormatter() {
  const { currentLocale, t } = useTranslation();

  return useCallback(
    (value: string | null): string => {
      if (!value) return t("studio.common.not_set");

      const date = new Date(value);
      if (Number.isNaN(date.valueOf())) return t("studio.common.not_set");

      let deltaSeconds = Math.round((date.valueOf() - Date.now()) / 1000);
      const absSeconds = Math.abs(deltaSeconds);
      if (absSeconds < 45) return t("studio.common.just_now");

      let unit: Intl.RelativeTimeFormatUnit = "year";
      for (const [candidate, limit] of RELATIVE_TIME_UNITS) {
        if (Math.abs(deltaSeconds) < limit) {
          unit = candidate;
          break;
        }
        deltaSeconds /= limit;
      }

      return new Intl.RelativeTimeFormat(currentLocale, { numeric: "always" }).format(Math.round(deltaSeconds), unit);
    },
    [currentLocale, t]
  );
}

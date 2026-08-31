/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

const SUNDAY_ANCHOR_UTC = Date.UTC(2024, 0, 7);

export function getLocalizedWeekdayLabel(weekday: number, locale: string): string {
  const date = new Date(SUNDAY_ANCHOR_UTC + weekday * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
}

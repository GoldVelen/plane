/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarLayouts } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

export const MONTHS_LIST: {
  [monthNumber: number]: {
    value: number;
  };
} = {
  1: { value: 1 },
  2: { value: 2 },
  3: { value: 3 },
  4: { value: 4 },
  5: { value: 5 },
  6: { value: 6 },
  7: { value: 7 },
  8: { value: 8 },
  9: { value: 9 },
  10: { value: 10 },
  11: { value: 11 },
  12: { value: 12 },
};

export const DAYS_LIST: {
  [dayIndex: number]: {
    value: EStartOfTheWeek;
  };
} = {
  1: {
    value: EStartOfTheWeek.SUNDAY,
  },
  2: {
    value: EStartOfTheWeek.MONDAY,
  },
  3: {
    value: EStartOfTheWeek.TUESDAY,
  },
  4: {
    value: EStartOfTheWeek.WEDNESDAY,
  },
  5: {
    value: EStartOfTheWeek.THURSDAY,
  },
  6: {
    value: EStartOfTheWeek.FRIDAY,
  },
  7: {
    value: EStartOfTheWeek.SATURDAY,
  },
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    titleTranslationKey: string;
  };
} = {
  month: {
    key: "month",
    titleTranslationKey: "common.month",
  },
  week: {
    key: "week",
    titleTranslationKey: "common.week",
  },
};

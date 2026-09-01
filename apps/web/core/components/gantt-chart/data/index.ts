/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
import { i18nInstance } from "@plane/i18n";
import type { WeekMonthDataType, ChartDataType, TGanttViews } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

// constants
export const generateWeeks = (startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY): WeekMonthDataType[] => [
  ...weeks.slice(startOfWeek),
  ...weeks.slice(0, startOfWeek),
];

const currentLocale = () => i18nInstance.resolvedLanguage ?? i18nInstance.language ?? "en";
const monthTitle = (month: number, format: "long" | "short") =>
  new Intl.DateTimeFormat(currentLocale(), { month: format }).format(new Date(2024, month, 1));
const weekdayTitle = (day: number, format: "long" | "short" | "narrow") =>
  new Intl.DateTimeFormat(currentLocale(), { weekday: format }).format(new Date(2024, 0, 7 + day));

export const weeks: WeekMonthDataType[] = [
  {
    key: 0,
    get shortTitle() {
      return weekdayTitle(0, "short");
    },
    get title() {
      return weekdayTitle(0, "long");
    },
    get abbreviation() {
      return weekdayTitle(0, "narrow");
    },
  },
  {
    key: 1,
    get shortTitle() {
      return weekdayTitle(1, "short");
    },
    get title() {
      return weekdayTitle(1, "long");
    },
    get abbreviation() {
      return weekdayTitle(1, "narrow");
    },
  },
  {
    key: 2,
    get shortTitle() {
      return weekdayTitle(2, "short");
    },
    get title() {
      return weekdayTitle(2, "long");
    },
    get abbreviation() {
      return weekdayTitle(2, "narrow");
    },
  },
  {
    key: 3,
    get shortTitle() {
      return weekdayTitle(3, "short");
    },
    get title() {
      return weekdayTitle(3, "long");
    },
    get abbreviation() {
      return weekdayTitle(3, "narrow");
    },
  },
  {
    key: 4,
    get shortTitle() {
      return weekdayTitle(4, "short");
    },
    get title() {
      return weekdayTitle(4, "long");
    },
    get abbreviation() {
      return weekdayTitle(4, "narrow");
    },
  },
  {
    key: 5,
    get shortTitle() {
      return weekdayTitle(5, "short");
    },
    get title() {
      return weekdayTitle(5, "long");
    },
    get abbreviation() {
      return weekdayTitle(5, "narrow");
    },
  },
  {
    key: 6,
    get shortTitle() {
      return weekdayTitle(6, "short");
    },
    get title() {
      return weekdayTitle(6, "long");
    },
    get abbreviation() {
      return weekdayTitle(6, "narrow");
    },
  },
];

export const months: WeekMonthDataType[] = [
  ...Array.from({ length: 12 }, (_, month) => ({
    key: month,
    get shortTitle() {
      return monthTitle(month, "short");
    },
    get title() {
      return monthTitle(month, "long");
    },
    get abbreviation() {
      return monthTitle(month, "short");
    },
  })),
];

export const quarters: WeekMonthDataType[] = [
  ...Array.from({ length: 4 }, (_, quarter) => ({
    key: quarter,
    shortTitle: `Q${quarter + 1}`,
    get title() {
      return `${monthTitle(quarter * 3, "short")} - ${monthTitle(quarter * 3 + 2, "short")}`;
    },
    abbreviation: `Q${quarter + 1}`,
  })),
];

export const charCapitalize = (word: string) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`;

export const bindZero = (value: number) => (value > 9 ? `${value}` : `0${value}`);

export const timePreview = (date: Date) => {
  return new Intl.DateTimeFormat(currentLocale(), { hour: "numeric", minute: "2-digit" }).format(date);
};

export const datePreview = (date: Date, includeTime: boolean = false) => {
  return new Intl.DateTimeFormat(currentLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
};

// context data
export const VIEWS_LIST: ChartDataType[] = [
  {
    key: "week",
    i18n_title: "common.week",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 4, // it will preview week dates with weekends highlighted with 1 week limitations ex: title (Wed 1, Thu 2, Fri 3)
      dayWidth: 60,
    },
  },
  {
    key: "month",
    i18n_title: "common.month",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 6, // it will preview monthly all dates with weekends highlighted with no limitations ex: title (1, 2, 3)
      dayWidth: 20,
    },
  },
  {
    key: "quarter",
    i18n_title: "common.quarter",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 24, // it will preview week starting dates all months data and there is 3 months limitation for preview ex: title (2, 9, 16, 23, 30)
      dayWidth: 5,
    },
  },
];

export const currentViewDataWithView = (view: TGanttViews = "month") =>
  VIEWS_LIST.find((_viewData) => _viewData.key === view);

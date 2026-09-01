/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { EStartOfTheWeek } from "@plane/types";

export const PROFILE_VIEWER_TAB = [
  {
    key: "summary",
    route: "",
    i18n_label: "profile.tabs.summary",
    selected: "/",
  },
];

export const PROFILE_ADMINS_TAB = [
  {
    key: "assigned",
    route: "assigned",
    i18n_label: "profile.tabs.assigned",
    selected: "/assigned/",
  },
  {
    key: "created",
    route: "created",
    i18n_label: "profile.tabs.created",
    selected: "/created/",
  },
  {
    key: "subscribed",
    route: "subscribed",
    i18n_label: "profile.tabs.subscribed",
    selected: "/subscribed/",
  },
  {
    key: "activity",
    route: "activity",
    i18n_label: "profile.tabs.activity",
    selected: "/activity/",
  },
];

/**
 * @description The locale-independent options for the start of the week
 * @type {Array<{value: EStartOfTheWeek}>}
 * @constant
 */
export const START_OF_THE_WEEK_OPTIONS = [
  {
    value: EStartOfTheWeek.SUNDAY,
  },
  {
    value: EStartOfTheWeek.MONDAY,
  },
  {
    value: EStartOfTheWeek.TUESDAY,
  },
  {
    value: EStartOfTheWeek.WEDNESDAY,
  },
  {
    value: EStartOfTheWeek.THURSDAY,
  },
  {
    value: EStartOfTheWeek.FRIDAY,
  },
  {
    value: EStartOfTheWeek.SATURDAY,
  },
];

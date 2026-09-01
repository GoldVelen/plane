/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Member property constants - Single source of truth for member spreadsheet properties

export type TMemberOrderByOptions =
  | "display_name"
  | "-display_name"
  | "full_name"
  | "-full_name"
  | "email"
  | "-email"
  | "joining_date"
  | "-joining_date"
  | "role"
  | "-role";

export interface IProjectMemberDisplayProperties {
  full_name: boolean;
  display_name: boolean;
  email: boolean;
  joining_date: boolean;
  role: boolean;
}

export const MEMBER_PROPERTY_DETAILS: {
  [key in keyof IProjectMemberDisplayProperties]: {
    i18n_title: string;
    ascendingOrderKey: TMemberOrderByOptions;
    ascendingOrderTitleKey: string;
    descendingOrderKey: TMemberOrderByOptions;
    descendingOrderTitleKey: string;
    iconName: string;
    isSortingAllowed: boolean;
  };
} = {
  full_name: {
    i18n_title: "project_members.full_name",
    ascendingOrderKey: "full_name",
    ascendingOrderTitleKey: "common.order_by.asc",
    descendingOrderKey: "-full_name",
    descendingOrderTitleKey: "common.order_by.desc",
    iconName: "User",
    isSortingAllowed: true,
  },
  display_name: {
    i18n_title: "project_members.display_name",
    ascendingOrderKey: "display_name",
    ascendingOrderTitleKey: "common.order_by.asc",
    descendingOrderKey: "-display_name",
    descendingOrderTitleKey: "common.order_by.desc",
    iconName: "User",
    isSortingAllowed: true,
  },
  email: {
    i18n_title: "project_members.email",
    ascendingOrderKey: "email",
    ascendingOrderTitleKey: "common.order_by.asc",
    descendingOrderKey: "-email",
    descendingOrderTitleKey: "common.order_by.desc",
    iconName: "Mail",
    isSortingAllowed: true,
  },
  joining_date: {
    i18n_title: "project_members.joining_date",
    ascendingOrderKey: "joining_date",
    ascendingOrderTitleKey: "common.order_by.asc",
    descendingOrderKey: "-joining_date",
    descendingOrderTitleKey: "common.order_by.desc",
    iconName: "Calendar",
    isSortingAllowed: true,
  },
  role: {
    i18n_title: "project_members.role",
    ascendingOrderKey: "role",
    ascendingOrderTitleKey: "common.order_by.asc",
    descendingOrderKey: "-role",
    descendingOrderTitleKey: "common.order_by.desc",
    iconName: "Shield",
    isSortingAllowed: true,
  },
};

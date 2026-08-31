/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueParams, TStaticViewTypes } from "@plane/types";

type TStaticViewFilterCondition = Partial<Record<TIssueParams, string>>;

export const getStaticViewFilterCondition = (
  currentUserId: string | undefined,
  type: TStaticViewTypes
): TStaticViewFilterCondition | undefined => {
  if (type === "unassigned") return { assignees: "None" };
  if (!currentUserId) return undefined;

  switch (type) {
    case "assigned":
      return { assignees: currentUserId };
    case "created":
      return { created_by: currentUserId };
    case "subscribed":
      return { subscriber: currentUserId };
    case "all-issues":
    default:
      return undefined;
  }
};

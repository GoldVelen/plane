/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import type { TBadgeVariant } from "@plane/propel/badge";
import type { TStudioHealthStatus } from "@/services/studio";
import { studioEnumLabel } from "./constants";
import type { TStudioEnumDomain } from "./constants";

const healthVariants: Record<TStudioHealthStatus, TBadgeVariant> = {
  ON_TRACK: "success",
  AT_RISK: "warning",
  BLOCKED: "danger",
  STALE: "warning",
  PAUSED: "neutral",
};

const genericVariant = (status: string): TBadgeVariant => {
  if (["RELEASED", "DECIDED", "CLOSED", "RESOLVED", "COMPLETED", "PUBLISHED"].includes(status)) return "success";
  if (["CANCELLED", "REVERSED", "ROLLED_BACK", "ACCEPTED", "WONT_DO", "DUPLICATE", "STOPPED"].includes(status))
    return "neutral";
  if (
    ["READY", "BUILDING", "QA", "SUBMITTED", "REVIEW", "MITIGATING", "MONITORING", "RUNNING", "TRIAGED"].includes(
      status
    )
  )
    return "brand";
  if (["OPEN", "NEEDS_DECISION", "PLANNED", "REVISIT", "INBOX"].includes(status)) return "warning";
  return "neutral";
};

export function StudioHealthBadge({ status }: { status: TStudioHealthStatus }) {
  const { t } = useTranslation();

  return (
    <Badge variant={healthVariants[status]} size="sm">
      {studioEnumLabel(t, "health", status)}
    </Badge>
  );
}

export function StudioStatusBadge({ status, domain }: { status: string; domain: TStudioEnumDomain }) {
  const { t } = useTranslation();

  return (
    <Badge variant={genericVariant(status)} size="sm">
      {studioEnumLabel(t, domain, status)}
    </Badge>
  );
}

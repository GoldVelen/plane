/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { useTranslation } from "@plane/i18n";

type THealthReasonSource = {
  reason: string;
  reason_code?: string | null;
  reason_codes?: string[] | null;
  reason_params?: Record<string, unknown> | null;
  is_manual?: boolean;
};

/**
 * Renders a server-computed health reason in the current language.
 *
 * The API keeps the legacy `reason` string for backward compatibility, but the UI
 * treats `reason_code`/`reason_codes` + `reason_params` as the translation source.
 * A manual override reason is user input and is shown verbatim in every language —
 * signalled either by `is_manual` or by the "manual_override" code that the
 * attention projection carries. When no codes are present (old API payload), the
 * raw reason falls through.
 */
export function useStudioHealthReasonText() {
  const { t } = useTranslation();

  return useCallback(
    (source: THealthReasonSource | null | undefined): string => {
      if (!source) return "";
      const codes = source.reason_codes ?? (source.reason_code ? [source.reason_code] : []);
      if (source.is_manual || codes.includes("manual_override")) return source.reason;
      if (codes.length === 0) return source.reason;

      const params: Record<string, unknown> = { ...source.reason_params };
      if (typeof params.portfolio_bucket === "string") {
        params.portfolio_bucket = t(`studio.enums.bucket.${params.portfolio_bucket}`);
      }
      if (typeof params.lifecycle_stage === "string") {
        params.lifecycle_stage = t(`studio.enums.lifecycle.${params.lifecycle_stage}`);
      }

      return codes.map((code) => t(`studio.health.reason.${code}`, params)).join(t("studio.health.reason_separator"));
    },
    [t]
  );
}

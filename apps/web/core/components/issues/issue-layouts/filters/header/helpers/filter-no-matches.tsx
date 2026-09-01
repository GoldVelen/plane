/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";

export function FilterNoMatches() {
  const { t } = useTranslation();

  return <p className="text-11 text-placeholder italic">{t("common.search.no_matches_found")}</p>;
}

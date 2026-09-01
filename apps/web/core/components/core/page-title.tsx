/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useTranslation } from "@plane/i18n";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export function PageHead(props: PageHeadTitleProps) {
  const { t } = useTranslation();
  const { title } = props;

  useEffect(() => {
    document.title = title ?? t("legacy_ui.plane_simple_extensible_open_source_project_management_tool");
  }, [t, title]);

  return null;
}

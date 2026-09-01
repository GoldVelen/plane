/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { i18nInstance } from "@plane/i18n";
import type { Route } from "./+types/layout";

export default function SetPasswordLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: i18nInstance.t("legacy_ui.set_password_plane") }];

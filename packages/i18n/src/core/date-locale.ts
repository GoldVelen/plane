/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { setDefaultOptions } from "date-fns";
import type { Locale } from "date-fns";
import type { TLanguage } from "../types";

type TDateLocaleLoader = () => Promise<Locale>;

const DATE_LOCALE_LOADERS: Record<TLanguage, TDateLocaleLoader> = {
  en: async () => (await import("date-fns/locale/en-US")).enUS,
  fr: async () => (await import("date-fns/locale/fr")).fr,
  es: async () => (await import("date-fns/locale/es")).es,
  ja: async () => (await import("date-fns/locale/ja")).ja,
  "zh-CN": async () => (await import("date-fns/locale/zh-CN")).zhCN,
  "zh-TW": async () => (await import("date-fns/locale/zh-TW")).zhTW,
  ru: async () => (await import("date-fns/locale/ru")).ru,
  it: async () => (await import("date-fns/locale/it")).it,
  cs: async () => (await import("date-fns/locale/cs")).cs,
  sk: async () => (await import("date-fns/locale/sk")).sk,
  de: async () => (await import("date-fns/locale/de")).de,
  ua: async () => (await import("date-fns/locale/uk")).uk,
  pl: async () => (await import("date-fns/locale/pl")).pl,
  ko: async () => (await import("date-fns/locale/ko")).ko,
  "pt-BR": async () => (await import("date-fns/locale/pt-BR")).ptBR,
  id: async () => (await import("date-fns/locale/id")).id,
  ro: async () => (await import("date-fns/locale/ro")).ro,
  "vi-VN": async () => (await import("date-fns/locale/vi")).vi,
  "tr-TR": async () => (await import("date-fns/locale/tr")).tr,
};

export async function setDateLocale(language: TLanguage): Promise<void> {
  const locale = await DATE_LOCALE_LOADERS[language]();
  setDefaultOptions({ locale });
}

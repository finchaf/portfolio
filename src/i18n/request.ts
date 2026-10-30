import { locale as rootLocale } from "next/root-params";
import { getRequestConfig } from "next-intl/server";

import { CATALOG } from "./catalog";
import { DEFAULT_LOCALE, isLocale } from "./locales";

export default getRequestConfig(async () => {
  const param = await rootLocale();
  const locale = isLocale(param) ? param : DEFAULT_LOCALE;
  return { locale, messages: CATALOG[locale] };
});

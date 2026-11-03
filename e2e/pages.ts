import { LOCALES } from "../src/i18n/locales";
import { localizedPath } from "../src/i18n/localized-path";
import { EVERY_PATH } from "../src/lib/pages";

/** Every address of the site: each page in each language. */
export const ADDRESSES = EVERY_PATH.flatMap((path) =>
  LOCALES.map((locale) => localizedPath(locale, path)),
);

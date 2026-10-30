import { SITE_ORIGIN } from "../lib/site";
import { LOCALES, type Locale } from "./locales";
import { localizedPath } from "./localized-path";

export interface Alternates {
  canonical: string;
  languages: Record<Locale | "x-default", string>;
}

/**
 * `canonical` and the `hreflang` set of one page: the page in its language, the page in every
 * language, and `x-default`, the home page's bare address that Caddy sends to the reader's language.
 *
 * @param path the page's path without the prefix: `""` for the home page, `"/flow"`
 */
export function alternates(locale: Locale, path: string): Alternates {
  const languages = Object.fromEntries(
    LOCALES.map((each) => [each, `${SITE_ORIGIN}${localizedPath(each, path)}`]),
  ) as Record<Locale, string>;
  return {
    canonical: languages[locale],
    languages: { ...languages, "x-default": SITE_ORIGIN },
  };
}

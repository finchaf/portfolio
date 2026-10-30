import type { Locale } from "./locales";

/**
 * A page's address in a language.
 *
 * @param path the page's path without the prefix: `""` for the home page, `"/flow"`
 */
export function localizedPath(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}

/** The same page in another language: the first segment of a pathname is its language. */
export function switchLocale(pathname: string, locale: Locale): string {
  return localizedPath(locale, pathname.replace(/^\/[^/]+/, ""));
}

import type { AnyPagePath } from "../lib/pages";
import type { Locale } from "./locales";

/**
 * A page's address in a language. Only a page of `src/lib/pages.ts`: one address per page, so a
 * `"/"` for the home page, which Caddy would send on with a redirect, is refused here.
 *
 * @param path the page's path without the prefix: `""` for the home page, `"/flow"`
 */
export function localizedPath(locale: Locale, path: AnyPagePath): string {
  return `/${locale}${path}`;
}

/**
 * The same page in another language: the first segment of a pathname is its language. The rest is
 * the browser's address as it stands, so it is kept as it comes rather than read as a page.
 */
export function switchLocale(pathname: string, locale: Locale): string {
  return `/${locale}${pathname.replace(/^\/[^/]+/, "")}`;
}

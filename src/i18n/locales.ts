/** The site's languages, in the order the language switcher lists them. */
export const LOCALES = ["ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** The language of a request that names none: the same rule as Caddy's for `/`. */
export const DEFAULT_LOCALE: Locale = "ru";

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

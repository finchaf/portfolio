import type { Locale } from "../i18n/locales";
import images from "./share-images.json" with { type: "json" };
import type { PAGES } from "./pages";

type Card = (typeof PAGES)[keyof typeof PAGES];

/** The size of every link picture, and what the pictures are. */
export const SHARE_IMAGE = { width: 1200, height: 630, type: "image/png" } as const;

/**
 * Where a page's link picture lives. The path stays and the version changes with the file, so a
 * platform that caches by address fetches the new one, and a post that holds the old address keeps
 * a working picture.
 */
export function shareImagePath(locale: Locale, card: Card): string {
  return `/og/${locale}/${card}.png?v=${images.files[`${locale}/${card}`]}`;
}

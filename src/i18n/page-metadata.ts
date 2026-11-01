import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PAGES, type PagePath } from "../lib/pages";
import { SHARE_IMAGE, shareImagePath } from "../lib/share-images";
import { SITE_NAME, SITE_ORIGIN } from "../lib/site";
import { alternates } from "./alternates";
import { isLocale, LOCALES, type Locale } from "./locales";

/** A language as Open Graph names it. */
const OPEN_GRAPH_LOCALE: Record<Locale, string> = { ru: "ru_RU", en: "en_US" };

/**
 * A page's `title`, `description`, `canonical`, `hreflang` and link preview, from `meta` in its
 * catalog.
 *
 * @param params the page's route parameters: a language that is not the site's is a 404
 */
export async function pageMetadata(params: { locale: string }, path: PagePath): Promise<Metadata> {
  const { locale } = params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: `${PAGES[path]}.meta` });
  const links = alternates(locale, path);
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: links,
    openGraph: {
      type: "website",
      url: links.canonical,
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALE[locale],
      alternateLocale: LOCALES.filter((each) => each !== locale).map(
        (each) => OPEN_GRAPH_LOCALE[each],
      ),
      title: t("shareTitle"),
      description: t("description"),
      images: [
        {
          ...SHARE_IMAGE,
          url: `${SITE_ORIGIN}${shareImagePath(locale, PAGES[path])}`,
          alt: t("imageAlt"),
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

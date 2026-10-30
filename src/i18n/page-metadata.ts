import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PAGES, type PagePath } from "../lib/pages";
import { SITE_IMAGE } from "../lib/site";
import { alternates } from "./alternates";
import { isLocale } from "./locales";

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
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: alternates(locale, path),
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("description"),
      images: [SITE_IMAGE],
    },
    twitter: { card: "summary_large_image" },
  };
}

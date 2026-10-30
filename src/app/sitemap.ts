import type { MetadataRoute } from "next";

import { alternates } from "@/i18n/alternates";
import { LOCALES } from "@/i18n/locales";
import { PAGE_PATHS } from "@/lib/pages";

// The export has no server: without this the build refuses a metadata route.
export const dynamic = "force-static";

/** /sitemap.xml: every page in every language, each with its hreflang set. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGE_PATHS.flatMap((path) =>
    LOCALES.map((locale) => {
      const { canonical, languages } = alternates(locale, path);
      return { url: canonical, alternates: { languages } };
    }),
  );
}

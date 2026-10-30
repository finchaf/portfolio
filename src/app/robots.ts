import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "@/lib/site";

// The export has no server: without this the build refuses a metadata route.
export const dynamic = "force-static";

/** /robots.txt: every page may be crawled, and the 404 says `noindex` for itself. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_ORIGIN}/sitemap.xml` };
}

import { useLocale, useTranslations } from "next-intl";

import { GITHUB_URL, SITE_ORIGIN, TELEGRAM_URL } from "@/lib/site";

/** Who this site is about, for search engines: the `Person` of schema.org. */
export function PersonData() {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t("name"),
    jobTitle: t("role"),
    url: `${SITE_ORIGIN}/${locale}`,
    sameAs: [GITHUB_URL, TELEGRAM_URL],
  };
  return (
    <script
      // Our own strings; `<` is escaped so that none of them can close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replaceAll("<", "\\u003c") }}
      type="application/ld+json"
    />
  );
}

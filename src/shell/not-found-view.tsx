import { CATALOG } from "@/i18n/catalog";
import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PageTitle } from "@/ui/page-title";

/** The 404 of every address: built once, it cannot know the reader's language, so it speaks both. */
export function NotFoundView() {
  return (
    <>
      {LOCALES.map((locale) => {
        const { notFound } = CATALOG[locale].shell;
        return (
          <section className="flex flex-col gap-2" key={locale} lang={locale}>
            <PageTitle>{notFound.title}</PageTitle>
            <a className="underline underline-offset-4" href={localizedPath(locale, "")}>
              {notFound.home}
            </a>
          </section>
        );
      })}
    </>
  );
}

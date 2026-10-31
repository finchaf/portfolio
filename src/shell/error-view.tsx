"use client";

import { useParams } from "next/navigation";

import { CATALOG } from "@/i18n/catalog";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { PageTitle } from "@/ui/page-title";

/**
 * What a reader sees when a page fails in the browser. The catalog is read directly: no provider
 * carries it to the client, and these two strings have no arguments to format.
 */
export function ErrorView({ retry }: { retry: () => void }) {
  const { locale } = useParams<{ locale: string }>();
  const { error } = CATALOG[isLocale(locale) ? locale : DEFAULT_LOCALE].shell;
  return (
    <div className="flex flex-col items-start gap-3 px-4 pt-[calc(var(--header)+1rem)] pb-[calc(var(--dock)+1rem)] lg:px-8">
      <PageTitle>{error.title}</PageTitle>
      <button className="underline underline-offset-4" onClick={retry} type="button">
        {error.retry}
      </button>
    </div>
  );
}

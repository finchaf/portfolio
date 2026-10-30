import "../globals.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ViewTransition } from "react";

import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/i18n/locales";
import { SITE_ORIGIN } from "@/lib/site";
import { Header } from "@/shell/header";
import { SkipLink } from "@/shell/skip-link";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Only the listed languages exist: the export has no server to render another one on request.
export const dynamicParams = false;

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    namespace: "shell",
  });
  return { metadataBase: new URL(SITE_ORIGIN), applicationName: t("siteName") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4" id="content" tabIndex={-1}>
          {/* A page change is a cross-fade; pages name their own shared elements as they grow. */}
          <ViewTransition>
            <div>{children}</div>
          </ViewTransition>
        </main>
      </body>
    </html>
  );
}

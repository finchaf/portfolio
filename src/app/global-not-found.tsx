import "@/themes/fonts";
import "./globals.css";

import type { Metadata } from "next";

import { CATALOG } from "@/i18n/catalog";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { SITE_ICONS } from "@/lib/site";
import { NotFoundView } from "@/shell/not-found-view";
import { ThemeScript } from "@/themes/theme-script";

export const metadata: Metadata = {
  title: LOCALES.map((locale) => CATALOG[locale].shell.notFound.title).join(" · "),
  icons: SITE_ICONS,
};

export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col gap-8 p-4" id="content">
          <NotFoundView />
        </main>
      </body>
    </html>
  );
}

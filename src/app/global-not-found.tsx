import "@/themes/fonts";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { CATALOG } from "@/i18n/catalog";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { SITE_ICONS, SITE_VIEWPORT } from "@/lib/site";
import { LOST_SCRIPT, NotFoundView } from "@/shell/not-found-view";
import { ThemeScript } from "@/themes/theme-script";

export const metadata: Metadata = {
  title: LOCALES.map((locale) => CATALOG[locale].shell.notFound.title).join(" · "),
  icons: SITE_ICONS,
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* A constant of ours, never input: the language of the 404 before it paints. */}
        <script dangerouslySetInnerHTML={{ __html: LOST_SCRIPT }} id="lost" />
      </head>
      <body className="flex min-h-dvh flex-col bg-page text-ink">
        <main className="flex flex-1 flex-col" id="content">
          <NotFoundView />
        </main>
      </body>
    </html>
  );
}

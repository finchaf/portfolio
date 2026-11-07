"use client";

import "@/themes/fonts";
import "./globals.css";

import { useParams } from "next/navigation";

import { SHELL } from "@/i18n/shell-catalog";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { ErrorView } from "@/shell/error-view";
import { ThemeScript } from "@/themes/theme-script";

/**
 * When the shell itself fails, the header, the footer or the layout, no error boundary of a page is
 * left to catch it: this one takes the place of the layout, in the reader's language and the
 * home's theme, with the same words and the same way back as a page's.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  const { locale } = useParams<{ locale?: string }>();
  const language = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <title>{SHELL[language].error.title}</title>
      </head>
      <body className="flex min-h-dvh flex-col bg-page text-ink">
        <main className="flex flex-1 flex-col" id="content">
          <ErrorView retry={reset} />
        </main>
      </body>
    </html>
  );
}

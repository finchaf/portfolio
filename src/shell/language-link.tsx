"use client";

import { usePathname } from "next/navigation";

import type { Locale } from "@/i18n/locales";
import { switchLocale } from "@/i18n/localized-path";

/**
 * The page the reader is on, in another language. A plain link: <html> belongs to the language, so
 * a move inside the app would make a new one, without what the script in <head> put on it. A new
 * document runs that script again.
 */
export function LanguageLink({ locale, label }: { locale: Locale; label: string }) {
  return (
    <a
      className="underline-offset-4 hover:underline"
      href={switchLocale(usePathname(), locale)}
      hrefLang={locale}
      lang={locale}
    >
      {label}
    </a>
  );
}

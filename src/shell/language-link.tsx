"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/i18n/locales";
import { switchLocale } from "@/i18n/localized-path";

/** The page the reader is on, in another language. */
export function LanguageLink({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link
      className="underline-offset-4 hover:underline"
      href={switchLocale(usePathname(), locale)}
      hrefLang={locale}
      lang={locale}
    >
      {label}
    </Link>
  );
}

"use client";

import { usePathname } from "next/navigation";

import { LOCALES, type Locale } from "@/i18n/locales";
import { switchLocale } from "@/i18n/localized-path";
import { SegmentedParts } from "@/ui/segmented";

export interface LanguageTabsProps {
  locale: Locale;
  /** The group's name, and each language in its own words. */
  labels: Record<"label" | Locale, string>;
}

/**
 * The page the reader is on, in each language, as the page's tabs. Plain links: <html> belongs to the
 * language, so a move inside the app would make a new one, without what the script in <head> put on
 * it. A new document runs that script again.
 */
export function LanguageTabs({ locale, labels }: LanguageTabsProps) {
  const pathname = usePathname();
  return (
    <div aria-label={labels.label} className="segmented" role="group">
      {LOCALES.map((each, index) => (
        <a
          aria-current={each === locale ? "true" : undefined}
          className="segmented-option"
          href={switchLocale(pathname, each)}
          hrefLang={each}
          key={each}
          lang={each}
        >
          <SegmentedParts index={index} label={labels[each]} />
        </a>
      ))}
    </div>
  );
}

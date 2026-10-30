import { useLocale, useTranslations } from "next-intl";

import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";

import { LanguageLink } from "./language-link";
import { NavLink } from "./nav-link";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const other = LOCALES.find((each) => each !== locale) ?? locale;
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-4">
      <nav aria-label={t("shell.navigation")}>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {PAGE_PATHS.map((path) => (
            <li key={path}>
              <NavLink href={localizedPath(locale, path)}>{t(`${PAGES[path]}.title`)}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <LanguageLink label={t(`shell.language.${other}`)} locale={other} />
    </header>
  );
}

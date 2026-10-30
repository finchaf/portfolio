import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
import { TELEGRAM_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";
import { FinchMark } from "@/ui/finch-mark";

import { LanguageLink } from "./language-link";
import { NavLink } from "./nav-link";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * One header for every page. On a wide screen the three groups sit in a row; on a phone the sections
 * become a bar at the bottom, in reach of a thumb, and the settings fold into a popover, which is
 * declarative and needs no script. The blur sits on a pseudo-element: on the header itself it would
 * trap the fixed bar inside.
 */
export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const other = LOCALES.find((each) => each !== locale) ?? locale;
  return (
    <header className="sticky top-0 z-30 flex h-(--header) items-center justify-between gap-3 px-4 before:absolute before:inset-0 before:-z-10 before:bg-page/85 before:backdrop-blur-md lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
      <Link className="flex min-w-0 items-center gap-2" data-brand href={localizedPath(locale, "")}>
        <FinchMark className="size-7 shrink-0" />
        <span className="flex items-baseline gap-2 whitespace-nowrap" data-brand-text>
          <span
            className="font-display text-[17px] leading-none font-extrabold tracking-[-0.035em]"
            data-brand-name
          >
            {t("shell.siteName")}
          </span>
          <span className="text-sm text-muted max-xl:hidden">{t("shell.role")}</span>
        </span>
      </Link>

      <nav
        aria-label={t("shell.navigation")}
        className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 [scrollbar-width:none] overflow-x-auto rounded-full bg-surface p-1 shadow-lg ring-1 ring-line lg:static lg:translate-x-0 lg:shadow-none lg:ring-0"
      >
        <ul className="flex gap-0.5">
          {PAGE_PATHS.map((path) => (
            <li key={path}>
              <NavLink href={localizedPath(locale, path)}>{t(`${PAGES[path]}.title`)}</NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center justify-end gap-2 lg:gap-4">
        <button
          aria-label={t("shell.settings")}
          className="grid size-9 place-items-center rounded-full bg-surface text-ink lg:hidden"
          popoverTarget="settings"
          type="button"
        >
          <svg aria-hidden className="size-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="4" cy="10" r="1.6" />
            <circle cx="10" cy="10" r="1.6" />
            <circle cx="16" cy="10" r="1.6" />
          </svg>
        </button>
        <div
          className="fixed inset-auto top-[calc(var(--header)+0.25rem)] right-3 m-0 flex-col items-end gap-3 rounded-2xl border-0 bg-surface p-3 text-ink shadow-lg ring-1 ring-line open:flex lg:static lg:flex lg:flex-row lg:items-center lg:gap-4 lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0"
          id="settings"
          popover="auto"
        >
          <ThemeSwitcher
            labels={{
              label: t("shell.theme.label"),
              system: t("shell.theme.system"),
              light: t("shell.theme.light"),
              dark: t("shell.theme.dark"),
            }}
          />
          <LanguageLink label={t(`shell.language.${other}`)} locale={other} />
        </div>
        <ButtonLink href={TELEGRAM_URL} size="small">
          {t("shell.write")}
        </ButtonLink>
      </div>
    </header>
  );
}

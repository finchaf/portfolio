import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
import { GITHUB_URL, REPOSITORY_URL, SITE_COMMIT, SITE_UPDATED, TELEGRAM_URL } from "@/lib/site";
import { LocalClock } from "@/ui/local-clock";
import { Wordmark } from "@/ui/logo";

import { LanguageLink } from "./language-link";
import { ThemeSwitcher } from "./theme-switcher";

const COLOPHONS = ["home", "pora", "flow", "projects"] as const;

/**
 * The end of every page: who and where, how to reach them, the settings of the site and what it is
 * made of. A wide, tall enough screen uncovers it from under the page; `sticky` does that alone.
 */
export function Footer() {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();
  const other = LOCALES.find((each) => each !== locale) ?? locale;
  return (
    <footer className="bg-surface pb-[calc(var(--dock)+1rem)] text-ink [@media(min-width:64rem)_and_(min-height:44rem)]:sticky [@media(min-width:64rem)_and_(min-height:44rem)]:bottom-0">
      <div className="mx-auto flex w-full max-w-[87.5rem] flex-col gap-10 px-4 pt-10 lg:gap-14 lg:px-8 lg:pt-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 font-medium">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              {t("shell.footer.status")}
            </p>
            <p className="text-muted">
              {t("shell.footer.city")}
              <LocalClock locale={locale} />
            </p>
            <p className="max-w-xs text-muted">{t("shell.footer.reply")}</p>
          </div>

          <div>
            <h2 className="pb-2 font-mono text-sm text-muted">{t("shell.footer.sections")}</h2>
            <ul className="flex flex-col gap-1.5">
              {PAGE_PATHS.map((path) => (
                <li key={path}>
                  <Link
                    className="underline-offset-4 hover:underline"
                    href={localizedPath(locale, path)}
                  >
                    {t(`${PAGES[path]}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="pb-2 font-mono text-sm text-muted">{t("shell.footer.contact")}</h2>
            <ul className="flex flex-col gap-1.5">
              <li>
                <a className="underline-offset-4 hover:underline" href={TELEGRAM_URL}>
                  {t("shell.footer.telegram")}
                </a>
              </li>
              <li>
                <a className="underline-offset-4 hover:underline" href={GITHUB_URL}>
                  {t("shell.footer.github")}
                </a>
              </li>
              <li>
                <a className="underline-offset-4 hover:underline" href={REPOSITORY_URL}>
                  {t("shell.footer.source")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="pb-2 font-mono text-sm text-muted">{t("shell.footer.settings")}</h2>
            <div className="flex flex-col items-start gap-2.5">
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
          </div>
        </div>

        <Wordmark className="h-auto w-full" />

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm text-muted">
          <p>{t("shell.footer.copyright")}</p>
          <p>
            {COLOPHONS.map((world) => (
              <span data-colophon={world} key={world}>
                {t(`shell.footer.colophon.${world}`)}
              </span>
            ))}
          </p>
          {SITE_COMMIT && (
            <p>
              <a
                className="underline underline-offset-4"
                href={`${REPOSITORY_URL}/commit/${SITE_COMMIT}`}
              >
                {t("shell.footer.updated", {
                  date: format.dateTime(new Date(SITE_UPDATED), { dateStyle: "short" }),
                })}
              </a>
            </p>
          )}
          <p>
            <a className="underline underline-offset-4" href="#content">
              {t("shell.footer.top")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

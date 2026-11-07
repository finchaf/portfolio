import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { isLocale, type Locale } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
import {
  EMAIL,
  GITHUB_HANDLE,
  GITHUB_URL,
  REPOSITORY_URL,
  SITE_COMMIT,
  SITE_UPDATED,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "@/lib/site";
import { CopyAddress } from "@/ui/copy-address";
import { LocalClock } from "@/ui/local-clock";
import { Logo, Wordmark } from "@/ui/logo";

import { LanguageTabs } from "./language-tabs";
import { ThemeSwitcher } from "./theme-switcher";

import "./footer.css";

const WORLDS = ["home", "pora", "flow", "projects"] as const;

/** The day of the build: the short form reads one way in Russian, but `11/3/26` does not in English. */
const UPDATED_STYLE: Record<Locale, "short" | "medium"> = { ru: "short", en: "medium" };

/**
 * The end of every page. The ways to reach the author come first, whole and large, then the site's
 * settings, the name, and a last line in the dress of the page's product. One markup for every page:
 * the page's theme dresses it, and a wide, tall enough screen uncovers it from under the page with
 * `sticky` alone.
 */
export function Footer() {
  const t = useTranslations();
  const format = useFormatter();
  const current = useLocale();
  const locale: Locale = isLocale(current) ? current : "ru";
  return (
    <footer className="footer">
      <div className="footer-in">
        <div className="footer-top">
          <div className="footer-reach">
            <p className="footer-live">
              <span aria-hidden className="footer-dot" />
              <span>{t("shell.footer.status")}</span>
              <span className="footer-where">
                {t("shell.footer.city")}
                <LocalClock locale={locale} />
              </span>
            </p>
            <ul aria-label={t("shell.footer.contact")} className="footer-ways">
              <li className="footer-way">
                <a className="footer-way-link" data-external href={TELEGRAM_URL}>
                  <span className="footer-key">{t("shell.footer.telegram")}</span>
                  <span className="footer-value">{TELEGRAM_HANDLE}</span>
                </a>
                <p className="footer-aside footer-reply">{t("shell.footer.reply")}</p>
              </li>
              <li className="footer-way">
                <a className="footer-way-link" href={`mailto:${EMAIL}`}>
                  <span className="footer-key">{t("shell.footer.mail")}</span>
                  <span className="footer-value">{EMAIL}</span>
                </a>
                <p className="footer-aside">
                  <CopyAddress
                    address={EMAIL}
                    className="footer-copy control-button control-quiet control-small"
                    labels={{ copy: t("shell.contact.copy"), copied: t("shell.contact.copied") }}
                  />
                </p>
              </li>
              <li className="footer-way">
                <a className="footer-way-link" data-external href={GITHUB_URL}>
                  <span className="footer-key">{t("shell.footer.github")}</span>
                  <span className="footer-value">{GITHUB_HANDLE}</span>
                </a>
                <p className="footer-aside">
                  <a className="footer-link" data-external href={REPOSITORY_URL}>
                    {t("shell.footer.source")}
                  </a>
                </p>
              </li>
            </ul>
          </div>

          <div className="footer-side">
            <div aria-label={t("shell.footer.settings")} className="footer-settings" role="group">
              <div className="footer-setting">
                <span aria-hidden className="footer-key">
                  {t("shell.footer.theme")}
                </span>
                <ThemeSwitcher
                  labels={{
                    label: t("shell.theme.label"),
                    system: t("shell.theme.system"),
                    light: t("shell.theme.light"),
                    dark: t("shell.theme.dark"),
                  }}
                />
              </div>
              <div className="footer-setting">
                <span aria-hidden className="footer-key">
                  {t("shell.footer.language")}
                </span>
                <LanguageTabs
                  labels={{
                    label: t("shell.footer.language"),
                    ru: t("shell.language.ru"),
                    en: t("shell.language.en"),
                  }}
                  locale={locale}
                />
              </div>
            </div>
            <nav aria-label={t("shell.footer.sections")} className="footer-sections">
              <span aria-hidden className="footer-key">
                {t("shell.footer.sections")}
              </span>
              <ul>
                {PAGE_PATHS.map((path) => (
                  <li key={path}>
                    <Link
                      className="footer-link"
                      data-section={PAGES[path]}
                      href={localizedPath(locale, path)}
                    >
                      {t(`${PAGES[path]}.title`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <Wordmark className="footer-mark" />

        <div className="footer-bar">
          <p className="footer-module footer-own">
            <b aria-hidden>
              <Logo className="footer-own-mark" />
            </b>
            <span>{t("shell.footer.copyright")}</span>
          </p>
          <p className="footer-colophon">
            {WORLDS.map((world) => (
              <span data-colophon={world} key={world}>
                {t(`shell.footer.colophon.${world}`)}
              </span>
            ))}
          </p>
          {SITE_COMMIT && (
            <a
              className="footer-module footer-build"
              href={`${REPOSITORY_URL}/commit/${SITE_COMMIT}`}
            >
              <span>
                {t("shell.footer.updated", {
                  // The commit's day, read in UTC: the zone of the machine that builds has no say.
                  date: format.dateTime(new Date(SITE_UPDATED), {
                    dateStyle: UPDATED_STYLE[locale],
                    timeZone: "UTC",
                  }),
                })}
              </span>
              <b>{SITE_COMMIT}</b>
            </a>
          )}
          <a className="footer-module footer-up" href="#content">
            <b aria-hidden />
            <span>{t("shell.footer.top")}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

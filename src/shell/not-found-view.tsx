import "@/ui/code-face.css";
import "@/ui/control.css";
import "./not-found.css";

import { CATALOG } from "@/i18n/catalog";
import { LOCALES } from "@/i18n/locales";
import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
import { Wordmark } from "@/ui/logo";
import { PageTitle } from "@/ui/page-title";

/** What the 404 shows large: its number, drawn as the first screen's code layer draws the name. */
const CODE = "404";

/**
 * The 404 of every address, in the home's theme. Built once, it cannot know the reader's language,
 * so the HTML holds both, and a script before the first paint keeps the reader's (`LOST_SCRIPT`).
 * The ways out are the site's pages, as the capsule names them, in the home's buttons.
 */
export function NotFoundView() {
  return (
    <div className="lost">
      <a className="lost-mark" href="/">
        <Wordmark className="lost-wordmark" />
        <span className="sr-only">{CATALOG.ru.shell.siteName}</span>
      </a>
      <p aria-hidden className="lost-code font-display font-extrabold">
        {CODE}
        <span className="lost-hatch code-hatch">{CODE}</span>
      </p>
      {LOCALES.map((locale) => {
        const strings = CATALOG[locale];
        const { notFound } = strings.shell;
        return (
          <section className="lost-words" data-lost-lang={locale} key={locale} lang={locale}>
            <PageTitle>{notFound.title}</PageTitle>
            <p className="lost-text">{notFound.text}</p>
            <nav aria-label={notFound.sections}>
              <ul className="lost-ways">
                {PAGE_PATHS.map((path) => (
                  <li key={path}>
                    <a
                      className={[
                        "control-button",
                        path === "" ? "control-primary" : "control-quiet",
                        "control-regular",
                      ].join(" ")}
                      href={localizedPath(locale, path)}
                    >
                      {path === "" ? notFound.home : strings[PAGES[path]].title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Keeps one language of the 404 before it paints: the one the address asks for, or else the
 * reader's. Without a script both stay, one under the other.
 */
export const LOST_SCRIPT = `(()=>{const p=location.pathname,r=document.documentElement;const l=p.startsWith("/en")?"en":p.startsWith("/ru")?"ru":/^ru\\b/i.test(navigator.language)?"ru":"en";r.lang=l;r.dataset.lost=l})()`;

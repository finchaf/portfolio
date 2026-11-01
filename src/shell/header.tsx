import "./capsule.css";

import { useLocale, useTranslations } from "next-intl";

import { localizedPath } from "@/i18n/localized-path";
import { PAGE_PATHS, PAGES } from "@/lib/pages";
import { TELEGRAM_URL } from "@/lib/site";
import { CodeFace } from "@/ui/code-face";
import { CodeSource } from "@/ui/code-source";
import { Logo, Wordmark } from "@/ui/logo";

import { CAPSULE_SOURCE } from "./capsule-source";
import { NavLink } from "./nav-link";
import { WriteMenu } from "./write-menu";

/**
 * Both forms of the logo: the full word, and the sign where the word does not fit. The widths are
 * spelled out: a drawing has none of its own to hold a link open in a tight row.
 */
function Mark() {
  return (
    <>
      <Wordmark className="h-[15px] w-[71px] max-[26rem]:hidden" />
      <Logo className="h-[15px] w-6 min-[26rem]:hidden" />
    </>
  );
}

const WRITE = "capsule-write grid size-8 place-items-center";
const WRITE_WIDE = "lg:block lg:size-auto lg:px-3.5 lg:py-1.5";

/**
 * One capsule for every page: the sections and the way to write. It floats over the page, at the
 * top of a wide screen and at the bottom of a phone, in reach of a thumb. At the top of a page it
 * has no surface, and `capsule.css` closes one around it when the page moves. `data-capsule` lets a
 * scene of the home page lend it the theme it is showing, and the lens reach it. The name of the
 * home page is the logo.
 */
export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <header
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center p-1 text-ink transition-colors duration-(--duration-slow) lg:top-3.5 lg:bottom-auto"
      data-capsule
    >
      <i aria-hidden className="capsule-surface absolute inset-0" />
      <div className="capsule-items" data-capsule-items>
        <nav
          aria-label={t("shell.navigation")}
          className="min-w-0 [scrollbar-width:none] overflow-x-auto"
        >
          <ul className="capsule-list">
            {PAGE_PATHS.map((path) => (
              <li key={path}>
                <NavLink
                  href={localizedPath(locale, path)}
                  label={path === "" ? t("home.title") : undefined}
                  world={PAGES[path]}
                >
                  {path === "" ? <Mark /> : t(`${PAGES[path]}.title`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <a
          aria-label={t("shell.write")}
          className={`${WRITE} ${WRITE_WIDE} capsule-action shrink-0`}
          data-write
          href={TELEGRAM_URL}
        >
          <span className="max-lg:sr-only">{t("shell.write")}</span>
          <svg
            aria-hidden
            className="size-[18px] lg:hidden"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            viewBox="0 0 20 20"
          >
            <path d="M17 3 2.8 8.6c-.6.2-.6 1.1 0 1.3l4.7 1.6 1.7 4.7c.2.6 1 .6 1.3 0L17 3ZM7.5 11.5 17 3" />
          </svg>
        </a>
      </div>

      <WriteMenu />

      <div aria-hidden className="capsule-code" data-capsule-code data-tint="home">
        <ul>
          {PAGE_PATHS.map((path) => (
            <li data-measure key={path}>
              <CodeFace
                className="control-shape"
                shape={
                  <span className="capsule-link">
                    {path === "" ? <Mark /> : t(`${PAGES[path]}.title`)}
                  </span>
                }
              >
                {path === "" ? <Wordmark className="h-2.5 w-[47px]" /> : t(`${PAGES[path]}.title`)}
              </CodeFace>
            </li>
          ))}
        </ul>
        <CodeFace
          className="control-shape shrink-0"
          shape={
            <span className={`${WRITE} ${WRITE_WIDE}`}>
              <span className="max-lg:hidden">{t("shell.write")}</span>
            </span>
          }
        >
          <span className="max-lg:hidden">{t("shell.write")}</span>
        </CodeFace>
        <CodeSource className="capsule-source" lines={CAPSULE_SOURCE} />
      </div>
    </header>
  );
}

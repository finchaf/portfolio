import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { localizedPath } from "@/i18n/localized-path";
import type { PagePath } from "@/lib/pages";
import { GITHUB_URL, TELEGRAM_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";

import { HeroDock } from "./hero-dock";
import { OmskClock } from "./omsk-clock";

const TILES = [
  { world: "pora", path: "/pora-na-paru" },
  { world: "flow", path: "/flow" },
  { world: "projects", path: "/projects" },
] as const satisfies { world: string; path: PagePath }[];

/** The first screen: who this is, what they do and how to write, all in the HTML. */
export function Hero() {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  return (
    <section className="hero mx-auto flex w-full max-w-(--content) flex-col justify-between gap-5 px-(--gutter) pt-3 pb-4 lg:gap-8 lg:pt-6 lg:pb-8">
      <HeroDock />
      <p className="flex items-center gap-2 text-sm text-muted">
        <span aria-hidden className="hero-dot size-2 rounded-full bg-success" />
        <span>
          {t("status")} · {t("city")}
          <OmskClock locale={locale} />
        </span>
      </p>

      <h1 className="hero-name font-display font-extrabold" data-hero-name>
        {t("name")}
      </h1>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-8">
        <div className="flex max-w-[42rem] flex-col gap-1 lg:gap-2">
          <p className="font-display text-lg font-semibold text-balance lg:text-xl">
            {t("role")} <span className="font-normal text-muted">· {t("roleNote")}</span>
          </p>
          <p className="leading-snug lg:text-xl">{t("statement")}</p>
        </div>
        <div className="flex flex-col gap-2.5 lg:items-end">
          <ul className="flex flex-col gap-1.5 text-sm lg:items-end">
            <li
              className="w-fit rounded-md border border-dashed border-warning px-2 py-0.5 text-ink"
              data-placeholder
            >
              {t("proofPlaceholder")}
            </li>
            <li className="text-muted">{t("proofStores")}</li>
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href={TELEGRAM_URL}>{t("write")}</ButtonLink>
            <ButtonLink href="#cases" tone="quiet">
              {t("work")}
              <span aria-hidden>↓</span>
            </ButtonLink>
            <a className="px-1 py-2 text-sm underline underline-offset-4" href={GITHUB_URL}>
              {t("github")}
            </a>
          </div>
        </div>
      </div>

      <ul className="grid gap-2 lg:grid-cols-3 lg:gap-3">
        {TILES.map(({ world, path }) => (
          <li data-tint={world} key={world}>
            <Link
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-ink ring-1 ring-line transition-transform duration-(--duration-quick) ease-out hover:-translate-y-0.5 lg:py-4"
              href={localizedPath(locale, path)}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-display font-semibold">{t(`tiles.${world}.title`)}</span>
                <span className="truncate text-sm text-muted">{t(`tiles.${world}.note`)}</span>
              </span>
              <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-accent" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

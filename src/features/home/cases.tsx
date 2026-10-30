import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ViewTransition, type ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";
import type { PagePath } from "@/lib/pages";

import { CaseStack } from "./case-stack";
import { MiniCanvas } from "./mini-canvas";
import { MiniTerminal } from "./mini-terminal";
import { MiniWeek } from "./mini-week";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
const TERMINAL_KEYS = [
  "line1",
  "line2",
  "line3",
  "line4",
  "line5",
  "line6",
  "line7",
  "line8",
  "line9",
] as const;
const FRAME_KEYS = ["site", "thesis", "portfolio", "motion"] as const;

interface CaseProps {
  world: "pora" | "flow" | "projects";
  path: PagePath;
  label: string;
  title: string;
  open: string;
  children: ReactNode;
  demo: ReactNode;
}

/**
 * A work on the stack, in the colours of its page. The whole card is a link to that page, and the
 * shared transition name lets it flow into it; a demo and the links inside sit above the link.
 */
function Case({ world, path, label, title, open, children, demo }: CaseProps) {
  const locale = useLocale();
  return (
    <ViewTransition name={`world-${world}`}>
      <article className="case text-ink" data-case data-tint={world}>
        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-muted">{label}</p>
            <h3 className="font-display text-4xl leading-none font-extrabold tracking-tight lg:text-6xl">
              <Link className="after:absolute after:inset-0" href={localizedPath(locale, path)}>
                {title}
              </Link>
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {children}
            <p aria-hidden className="text-sm font-medium">
              {open} →
            </p>
          </div>
        </div>
        {demo}
      </article>
    </ViewTransition>
  );
}

/** The works, one over another as the page scrolls. */
export function Cases() {
  const t = useTranslations("home.cases");
  const lessons = {
    math: t("week.lessons.math"),
    base: t("week.lessons.base"),
    code: t("week.lessons.code"),
  };
  return (
    <section
      aria-labelledby="cases-title"
      className="mx-auto w-full max-w-(--content) px-(--gutter) py-10 lg:py-16"
      id="cases"
    >
      <h2 className="pb-6 font-display text-3xl font-bold lg:pb-8 lg:text-5xl" id="cases-title">
        {t("title")}
      </h2>
      <CaseStack>
        <div className="flex flex-col gap-4">
          <Case
            demo={
              <MiniWeek
                clear={t("week.clear")}
                conflict={t("week.conflict")}
                days={DAY_KEYS.map((day) => t(`week.days.${day}`))}
                lessons={lessons}
                moveLabel={{
                  math: t("week.move", { lesson: lessons.math }),
                  base: t("week.move", { lesson: lessons.base }),
                  code: t("week.move", { lesson: lessons.code }),
                }}
              />
            }
            label={t("pora.label")}
            open={t("open")}
            path="/pora-na-paru"
            title={t("pora.title")}
            world="pora"
          >
            <p className="w-fit rounded-full bg-raised px-2.5 py-0.5 text-xs text-ink">
              {t("pora.stage")}
            </p>
            <p className="text-lg leading-snug">{t("pora.text")}</p>
            <p className="text-sm text-muted">{t("pora.role")}</p>
            <p className="relative z-10 flex flex-wrap gap-x-3 text-sm">
              <span className="text-muted">{t("pora.stores")}</span>
              <a className="underline underline-offset-4" href={t("pora.appStoreUrl")}>
                {t("pora.appStore")}
              </a>
              <a className="underline underline-offset-4" href={t("pora.googlePlayUrl")}>
                {t("pora.googlePlay")}
              </a>
              <a className="underline underline-offset-4" href={t("pora.ruStoreUrl")}>
                {t("pora.ruStore")}
              </a>
            </p>
          </Case>
          <Case
            demo={<MiniTerminal lines={TERMINAL_KEYS.map((line) => t(`terminal.${line}`))} />}
            label={t("flow.label")}
            open={t("open")}
            path="/flow"
            title={t("flow.title")}
            world="flow"
          >
            <p className="text-lg leading-snug">{t("flow.text")}</p>
            <p className="text-sm text-muted">{t("flow.note")}</p>
          </Case>
          <Case
            demo={<MiniCanvas frames={FRAME_KEYS.map((frame) => t(`canvas.${frame}`))} />}
            label={t("projects.label")}
            open={t("open")}
            path="/projects"
            title={t("projects.title")}
            world="projects"
          >
            <p className="text-lg leading-snug">{t("projects.text")}</p>
          </Case>
        </div>
      </CaseStack>
    </section>
  );
}

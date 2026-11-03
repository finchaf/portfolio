import "./projects.css";
import "./portfolio.css";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";
import { REPOSITORY_URL, SITE_ORIGIN } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";

import { DemoGates } from "./demo-gates";
import { DemoLens } from "./demo-lens";
import { DemoRelease } from "./demo-release";
import { DemoSlash } from "./demo-slash";
import { DemoThemes } from "./demo-themes";
import { BUDGET, COMMITS_BY_DAY, FACTS, GATES, JOURNAL, RELEASES } from "./facts";
import { SECTIONS, type SectionId } from "./portfolio-sections";
import { ProjectFacts } from "./project-parts";
import { ProjectShell } from "./project-shell";
import { Shot } from "./shot";

const FINDINGS = [
  ["found1", "664494f"],
  ["found2", "da37183"],
  ["found3", "3e2a2bf"],
  ["found4", "bbdeab3"],
] as const;

const STAGE = ["item1", "item2", "item3"] as const;

const BRIEF = [
  ["what", "whatText"],
  ["role", "roleText"],
  ["open", "openText"],
] as const;

const RICH = {
  c: (chunks: ReactNode) => <code>{chunks}</code>,
  date: FACTS.date,
  unit: FACTS.unit,
  browser: FACTS.browser,
};

/** What stands under a section's words. */
function SectionDemo({ id }: { id: SectionId }) {
  const t = useTranslations("portfolio");
  const all = useTranslations();
  const format = useFormatter();
  const locale = useLocale();
  const demo = (key: Parameters<typeof t>[0]) => t(key);
  switch (id) {
    case "form":
      return (
        <div className="pj-form-shots">
          <span className="pj-form-wide">
            <Shot alt={t("sections.form.name")} name="flow" sizes="(min-width: 64rem) 40vw, 90vw" />
          </span>
          <span className="pj-form-phone">
            <Shot name="phoneFlow" sizes="(min-width: 64rem) 12vw, 28vw" />
          </span>
        </div>
      );
    case "themes":
      return (
        <DemoThemes
          locale={locale}
          strings={{
            theme: demo("demo.theme"),
            mode: demo("demo.mode"),
            light: demo("demo.light"),
            dark: demo("demo.dark"),
            sample: demo("demo.sample"),
            sampleText: demo("demo.sampleText"),
            sampleAction: demo("demo.sampleAction"),
            sampleQuiet: demo("demo.sampleQuiet"),
            text: demo("demo.text"),
            soft: demo("demo.soft"),
            control: demo("demo.control"),
          }}
          themeNames={{
            home: all("home.title"),
            pora: all("pora.title"),
            flow: all("flow.title"),
            projects: all("projects.title"),
          }}
        />
      );
    case "lens":
      return (
        <DemoLens
          design={<Shot name="home" sizes="(min-width: 64rem) 50vw, 100vw" />}
          code={<Shot name="homeCode" sizes="(min-width: 64rem) 50vw, 100vw" />}
          strings={{
            hint: demo("demo.lensHint"),
            design: demo("demo.lensDesign"),
            code: demo("demo.lensCode"),
            lens: demo("demo.lensBoth"),
          }}
        />
      );
    case "motion":
      return (
        <DemoSlash
          a={<Shot name="home" sizes="(min-width: 64rem) 50vw, 100vw" />}
          b={<Shot name="flow" sizes="(min-width: 64rem) 50vw, 100vw" />}
          strings={{
            before: demo("demo.before"),
            after: demo("demo.after"),
            play: demo("demo.play"),
            beforeNote: demo("demo.beforeNote"),
            afterNote: demo("demo.afterNote"),
          }}
        />
      );
    case "gates": {
      const total = GATES.reduce((sum, [, seconds]) => sum + seconds, 0);
      const bars = [
        ["budgetHome", BUDGET.home],
        ["budgetFlow", BUDGET.flow],
        ["budgetOther", BUDGET.other],
      ] as const;
      return (
        <>
          <DemoGates
            again={demo("demo.replay")}
            summary={t("demo.ofAll", {
              passed: GATES.length,
              all: GATES.length,
              minutes: Math.floor(total / 60),
              seconds: Math.round(total % 60),
            })}
          />
          <figure className="pj-budget">
            <figcaption>
              {t("demo.budgetTitle", { title: t("demo.budget"), date: FACTS.date })}
            </figcaption>
            {bars.map(([key, value]) => (
              <div key={key} style={{ "--share": `${(value / BUDGET.limit) * 100}%` }}>
                <span>{t(`demo.${key}`)}</span>
                <i />
                <b>{t("demo.kilobytes", { value: format.number(value) })}</b>
              </div>
            ))}
            <p>{t("demo.budgetLimitLine", { value: BUDGET.limit })}</p>
          </figure>
          <h3 className="pj-found-title">{t("sections.gates.foundTitle")}</h3>
          <ul className="pj-found">
            {FINDINGS.map(([key, commit]) => (
              <li key={key}>
                <a href={`${REPOSITORY_URL}/commit/${commit}`} rel="noreferrer" target="_blank">
                  {commit}
                </a>
                <p>{t(`sections.gates.${key}`)}</p>
              </li>
            ))}
          </ul>
        </>
      );
    }
    case "decisions":
      return (
        <ol className="pj-journal">
          {JOURNAL.map((file) => {
            const number = file.slice(0, 4);
            return (
              <li key={file}>
                <a
                  href={`${REPOSITORY_URL}/blob/main/docs/01-architecture/decisions/${file}.md`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <b>{number}</b>
                  <span>{t(`journal.a${number}` as never)}</span>
                </a>
              </li>
            );
          })}
        </ol>
      );
    case "release":
      return (
        <div className="pj-release">
          <DemoRelease
            releases={RELEASES.map(([hash]) => hash.slice(0, 12))}
            steps={[
              demo("steps.refuse"),
              demo("steps.gates"),
              demo("steps.copy"),
              demo("steps.switch"),
              demo("steps.verify"),
              demo("steps.back"),
            ]}
            strings={{
              deploy: demo("demo.deploy"),
              rollback: demo("demo.rollback"),
              current: demo("demo.current"),
              fresh: demo("demo.newRelease"),
            }}
          />
          <figure className="pj-days">
            <figcaption>{t("demo.commitsByDay")}</figcaption>
            <div>
              {COMMITS_BY_DAY.map(([day, count]) => (
                <span key={day} style={{ "--share": `${(count / 61) * 100}%` }}>
                  <b>{count}</b>
                  <i />
                  <em>{day}</em>
                </span>
              ))}
            </div>
          </figure>
        </div>
      );
    case "stage":
      return (
        <ul className="pj-stage-list">
          {STAGE.map((key) => (
            <li key={key}>{t(`sections.stage.${key}`)}</li>
          ))}
        </ul>
      );
  }
}

/** The page of this site. Its words are in `messages/<locale>/portfolio.json`. */
export function PortfolioPage() {
  const t = useTranslations("portfolio");
  const projects = useTranslations("projects");
  const locale = useLocale();
  return (
    <ProjectShell
      back={{ href: localizedPath(locale, "/projects"), label: t("back") }}
      brief={BRIEF.map(([label, text]) => ({
        label: t(`brief.${label}`),
        text: t(`brief.${text}`),
      }))}
      chip={projects("portfolio.chip")}
      color="pink"
      project="portfolio"
      facts={<ProjectFacts />}
      labels={{
        layers: t("layers"),
        properties: t("properties"),
        refs: t("open"),
        section: (name) => t("section", { name }),
      }}
      lead={t("lead")}
      links={<SubLinks />}
      sections={SECTIONS.map(({ id, paragraphs, refs }) => ({
        id,
        name: t(`sections.${id}.name`),
        title: t(`sections.${id}.title`),
        paragraphs: paragraphs.map((key) =>
          t.rich(`sections.${id}.${key}` as never, RICH as never),
        ),
        demo: <SectionDemo id={id} />,
        refs,
      }))}
      state={projects("portfolio.state")}
      title={t("title")}
    />
  );
}

function SubLinks() {
  const t = useTranslations("projects");
  return (
    <p className="pj-panel-links">
      <ButtonLink href={SITE_ORIGIN} size="small">
        {t("site")}
      </ButtonLink>
      <ButtonLink href={REPOSITORY_URL} size="small" tone="quiet">
        {t("code")}
      </ButtonLink>
    </p>
  );
}

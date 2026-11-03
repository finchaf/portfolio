import { useTranslations } from "next-intl";

import { FACTS } from "./facts";
import { LATEX } from "./latex-facts";

/** What is true of the project as a whole: on the board's panel and on the project's page. */
export function ProjectFacts() {
  const t = useTranslations("projects");
  const numbers = [
    [FACTS.commits, "commits"],
    [FACTS.decisions, "decisions"],
    [FACTS.checks, "checks"],
    [FACTS.unit + FACTS.browser, "tests"],
    [FACTS.themes, "themes"],
    [FACTS.languages, "languages"],
  ] as const;
  return (
    <>
      <dl className="pj-props">
        <div>
          <dt>{t("portfolio.period")}</dt>
          <dd>{t("portfolio.periodValue")}</dd>
        </div>
        <div>
          <dt>{t("portfolio.address")}</dt>
          <dd>{t("portfolio.addressValue")}</dd>
        </div>
        <div>
          <dt>{t("portfolio.stack")}</dt>
          <dd>{t("portfolio.stackValue")}</dd>
        </div>
      </dl>
      <ul className="pj-facts">
        {numbers.map(([value, key]) => (
          <li key={key}>
            <b>{value}</b>
            <span>{t(`portfolio.${key}`)}</span>
          </li>
        ))}
      </ul>
      <p className="pj-as-of">{t("asOf", { date: FACTS.date })}</p>
    </>
  );
}

/** What is true of the LaTeX project as a whole, as of the date of `LATEX`. */
export function LatexFacts() {
  const t = useTranslations("projects");
  const numbers = [
    [LATEX.notes.pages, "notesPages"],
    [LATEX.snippets.all, "snippets"],
    [LATEX.thesis.pages, "thesisPages"],
    [LATEX.thesis.releases, "releases"],
    [LATEX.documents.types, "types"],
    [LATEX.documents.gates, "gates"],
  ] as const;
  return (
    <>
      <dl className="pj-props">
        <div>
          <dt>{t("latex.period")}</dt>
          <dd>{t("latex.periodValue")}</dd>
        </div>
        <div>
          <dt>{t("latex.stack")}</dt>
          <dd>{t("latex.stackValue")}</dd>
        </div>
      </dl>
      <ul className="pj-facts">
        {numbers.map(([value, key]) => (
          <li key={key}>
            <b>{value}</b>
            <span>{t(`latex.${key}`)}</span>
          </li>
        ))}
      </ul>
      <p className="pj-as-of">{t("latex.asOf", { date: LATEX.date })}</p>
    </>
  );
}

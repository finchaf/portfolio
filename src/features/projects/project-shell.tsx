import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";
import { PROJECTS, type ProjectId } from "@/ui/board/board-layout";
import { World } from "@/ui/world";

import { BackToBoard } from "./back-to-board";
import { PageOutline } from "./page-outline";

/** A file or a page a section rests on: a link and the short name beside it. */
export interface Ref {
  label: string;
  href: string;
}

export interface ShellSection {
  id: string;
  name: string;
  title: string;
  paragraphs: readonly ReactNode[];
  demo: ReactNode;
  refs: readonly Ref[];
}

interface Props {
  /**
   * The project's id on the board, which the way back opens. It gives the colour, the chip and the
   * state, as the board shows them, and names the page's own messages: the way back, the panels.
   */
  project: ProjectId;
  title: string;
  lead: string;
  brief: readonly { label: string; text: ReactNode }[];
  /** The project's numbers and properties: in the right panel, and under the head on a phone. */
  facts: ReactNode;
  links: ReactNode;
  /** The heading over a section's files, which each project words its own way. */
  refsLabel: string;
  sections: readonly ShellSection[];
}

/** The colour of a project on the board, which its page keeps. */
function colorOf(project: ProjectId) {
  const found = PROJECTS.find(({ id }) => id === project);
  if (!found) throw new Error(`No project ${project} on the board`);
  return found.color;
}

function Refs({ refs }: { refs: readonly Ref[] }) {
  return (
    <ul className="pj-refs">
      {refs.map(({ label, href }) => (
        <li key={href}>
          <a href={href} rel="noreferrer" target="_blank">
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * A project's page: the board's panels stay, and the frames are read in a column. The left panel
 * is the outline, the right one holds the project's facts and the files of the section in view. On
 * a phone and without a script the same files stand under each section.
 */
export function ProjectShell({
  project,
  title,
  lead,
  brief,
  facts,
  links,
  refsLabel,
  sections,
}: Props) {
  const t = useTranslations(project);
  const board = useTranslations("projects");
  const locale = useLocale();
  const color = colorOf(project);
  const chip = board(`${project}.chip`);
  const labels = { layers: t("layers"), properties: t("properties") };
  return (
    <World name="projects">
      <div className="pj-sub" data-capsule-held="" data-project={project} data-subpage>
        <aside className="pj-panel pj-sub-left">
          <BackToBoard
            href={localizedPath(locale, "/projects")}
            label={t("back")}
            project={project}
          />
          <p className="pj-panel-label">{labels.layers}</p>
          <nav aria-label={labels.layers} className="pj-tree">
            <a data-color={color} data-goto="top" href="#top">
              <i />
              {chip}
            </a>
            {sections.map(({ id, name }) => (
              <a className="pj-tree-child" data-goto={id} href={`#${id}`} key={id}>
                {name}
              </a>
            ))}
          </nav>
        </aside>

        <div className="pj-sub-column">
          <header className="pj-sub-head" data-step="top" id="top">
            <span className="pj-chip" data-color={color}>
              {chip}
            </span>
            <h1>{title}</h1>
            <p className="pj-sub-lead">{lead}</p>
            <dl className="pj-brief">
              {brief.map(({ label, text }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <div className="pj-sub-narrow">
              {facts}
              {links}
            </div>
          </header>

          {sections.map(({ id, name, title: heading, paragraphs, demo, refs }) => (
            <section className="pj-sub-frame" data-step={id} id={id} key={id}>
              <p className="pj-sub-frame-name">{name}</p>
              <div className="pj-sub-text">
                <h2>{heading}</h2>
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="pj-sub-demo">{demo}</div>
              {refs.length > 0 && (
                <div className="pj-sub-refs">
                  <p>{refsLabel}</p>
                  <Refs refs={refs} />
                </div>
              )}
            </section>
          ))}
        </div>

        <aside aria-label={labels.properties} className="pj-panel pj-sub-right">
          <p className="pj-panel-label">{labels.properties}</p>
          <span className="pj-state" data-color={color}>
            {board(`${project}.state`)}
          </span>
          {facts}
          {links}
          <div data-js-only>
            {sections.map(({ id, name, refs }) =>
              refs.length > 0 ? (
                <div className="pj-ins-frame" data-inspect={id} hidden key={id}>
                  <p className="pj-panel-label">{t("section", { name })}</p>
                  <Refs refs={refs} />
                </div>
              ) : null,
            )}
          </div>
        </aside>

        <PageOutline />
      </div>
    </World>
  );
}

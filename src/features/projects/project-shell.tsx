import type { ReactNode } from "react";

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
  /** The project's id on the board, which the way back opens. */
  project: string;
  color: "pink" | "teal";
  chip: string;
  state: string;
  title: string;
  lead: string;
  brief: readonly { label: string; text: ReactNode }[];
  /** The project's numbers and properties: in the right panel, and under the head on a phone. */
  facts: ReactNode;
  links: ReactNode;
  back: { href: string; label: string };
  labels: {
    layers: string;
    properties: string;
    /** The heading over a section's files. */
    refs: string;
    /** The panel's heading over the files of the section in view. */
    section: (name: string) => string;
  };
  sections: readonly ShellSection[];
}

export function Refs({ refs }: { refs: readonly Ref[] }) {
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
  color,
  chip,
  state,
  title,
  lead,
  brief,
  facts,
  links,
  back,
  labels,
  sections,
}: Props) {
  return (
    <World bleed name="projects">
      <div className="pj-sub" data-capsule-held="" data-project={project} data-subpage>
        <aside className="pj-panel pj-sub-left">
          <BackToBoard href={back.href} label={back.label} project={project} />
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
                  <p>{labels.refs}</p>
                  <Refs refs={refs} />
                </div>
              )}
            </section>
          ))}
        </div>

        <aside aria-label={labels.properties} className="pj-panel pj-sub-right">
          <p className="pj-panel-label">{labels.properties}</p>
          <span className="pj-state" data-color={color}>
            {state}
          </span>
          {facts}
          {links}
          <div data-js-only>
            {sections.map(({ id, name, refs }) =>
              refs.length > 0 ? (
                <div className="pj-ins-frame" data-inspect={id} hidden key={id}>
                  <p className="pj-panel-label">{labels.section(name)}</p>
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

import "./projects.css";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, type ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";
import { REPOSITORY_URL } from "@/lib/site";
import { ButtonLink } from "@/ui/button-link";
import { World } from "@/ui/world";

import { BoardEngine } from "./board-engine";
import { GateLines, JournalLines, ReleaseLines, ThemeTiles } from "./board-frames";
import { frameBox, PROJECTS, type ProjectId } from "./board-layout";
import { SnippetLines, VerdictLines } from "./latex-frames";
import { THESIS_URL } from "./latex-facts";
import { Paper } from "./paper";
import { LatexFacts, ProjectFacts } from "./project-parts";
import { Shot } from "./shot";

const OBJECTS: Record<string, ReactNode> = {
  home: <Shot name="home" sizes="(min-width: 64rem) 30vw, 60vw" />,
  phone: <Shot name="phoneFlow" sizes="(min-width: 64rem) 12vw, 25vw" />,
  themes: <ThemeTiles />,
  release: <ReleaseLines />,
  gates: <GateLines />,
  flow: <Shot name="flow" sizes="(min-width: 64rem) 18vw, 40vw" />,
  journal: <JournalLines />,
  notes: <Paper name="notes-calculus" sizes="(min-width: 64rem) 18vw, 40vw" />,
  snippets: <SnippetLines />,
  thesis: <Paper name="thesis-69" sizes="(min-width: 64rem) 10vw, 22vw" />,
  document: <Paper name="doc-cover" sizes="(min-width: 64rem) 10vw, 22vw" />,
  wall: <Paper name="wall-v2026.06.10" sizes="(min-width: 64rem) 18vw, 40vw" />,
  verify: <VerdictLines />,
};

const FACTS: Record<ProjectId, ReactNode> = {
  portfolio: <ProjectFacts />,
  latex: <LatexFacts />,
};

const CODE: Record<ProjectId, string> = {
  portfolio: REPOSITORY_URL,
  latex: THESIS_URL,
};

/**
 * The page is an editor. Every word and every frame is in the HTML in reading order, so without a
 * script and on a phone it is a list of projects, each with its frames composed at full width and
 * its properties under it. With a script on a wide screen `projects.css` turns the same elements
 * into a canvas with panels, and `BoardEngine` adds the camera on top. Nothing is drawn by the
 * script, so nothing waits for it.
 */
export function ProjectsPage() {
  const t = useTranslations("projects");
  const locale = useLocale();

  return (
    <World bleed name="projects">
      <div className="pj-board" data-board data-capsule-held="">
        <header className="pj-board-head">
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
        </header>

        <nav aria-label={t("layers")} className="pj-panel pj-board-layers" data-js-only>
          <p className="pj-panel-label">{t("layers")}</p>
          <div className="pj-tree">
            {PROJECTS.map((project) => (
              <Fragment key={project.id}>
                <button data-color={project.color} data-layer={project.id} type="button">
                  <i />
                  {t(`${project.id}.chip`)}
                </button>
                {project.frames.map(({ key }) => (
                  <button className="pj-tree-child" data-layer={key} key={key} type="button">
                    {t(`frames.${key}.name` as never)}
                  </button>
                ))}
              </Fragment>
            ))}
          </div>
        </nav>

        <div aria-label={t("canvas")} className="pj-board-canvas" data-canvas role="group">
          <div className="pj-board-world" data-camera>
            {PROJECTS.map((project, index) => {
              const page = localizedPath(locale, project.path);
              return (
                <section
                  aria-labelledby={`sec-${project.id}`}
                  className="pj-sec"
                  data-color={project.color}
                  data-sec={project.id}
                  key={project.id}
                  style={{ order: index * 2 + 1 }}
                >
                  <h2 className="pj-sec-label" id={`sec-${project.id}`}>
                    <Link
                      className="pj-chip"
                      data-color={project.color}
                      data-open={project.id}
                      href={page}
                    >
                      {t(`${project.id}.chip`)}
                    </Link>
                  </h2>
                  {project.frames.map((frame) => (
                    <Link
                      aria-label={t(`frames.${frame.key}.name` as never)}
                      className="pj-frame"
                      data-frame={frame.key}
                      data-kind={frame.kind}
                      draggable={false}
                      href={`${page}#${frame.section}`}
                      key={frame.key}
                      style={frameBox(frame)}
                    >
                      <span aria-hidden className="pj-frame-name">
                        {t(`frames.${frame.key}.name` as never)}
                      </span>
                      <span className="pj-frame-body">{OBJECTS[frame.key]}</span>
                      <i aria-hidden className="pj-frame-handles" data-js-only />
                    </Link>
                  ))}
                </section>
              );
            })}
          </div>
        </div>

        {PROJECTS.map((project, index) => {
          const page = localizedPath(locale, project.path);
          return (
            <aside
              aria-label={t("propertiesOf", { name: t(`${project.id}.chip`) })}
              className="pj-panel pj-board-inspector"
              data-current={index === 0 || undefined}
              data-project={project.id}
              key={project.id}
              style={{ order: index * 2 + 2 }}
            >
              <p className="pj-panel-label" data-js-only>
                {t("properties")}
              </p>
              <div className="pj-ins-head">
                <span className="pj-chip" data-color={project.color} data-js-only>
                  {t(`${project.id}.chip`)}
                </span>
                <span className="pj-state" data-color={project.color}>
                  {t(`${project.id}.state`)}
                </span>
              </div>
              <h2>{t(`${project.id}.title`)}</h2>
              <p className="pj-ins-text">{t(`${project.id}.summary`)}</p>
              {FACTS[project.id]}

              <div data-js-only>
                {project.frames.map((frame) => (
                  <div className="pj-ins-frame" data-inspect={frame.key} hidden key={frame.key}>
                    <p className="pj-panel-label">
                      {t("selectedFrame", { name: t(`frames.${frame.key}.name` as never) })}
                    </p>
                    <p className="pj-ins-text">{t(`frames.${frame.key}.text` as never)}</p>
                    <dl className="pj-xywh">
                      {(
                        [
                          ["X", frame.x, "x"],
                          ["Y", frame.y, "y"],
                          ["W", frame.w, ""],
                          ["H", Math.round(frame.w / frame.ratio), ""],
                        ] as const
                      ).map(([name, value, axis]) => (
                        <div key={name}>
                          <dt>{name}</dt>
                          <dd data-axis={axis || undefined}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>

              <p className="pj-panel-links">
                <ButtonLink data-open={project.id} data-primary-open href={page} size="small">
                  {t("open")}
                </ButtonLink>
                <ButtonLink href={CODE[project.id]} size="small" tone="quiet">
                  {t(`${project.id}.code`)}
                </ButtonLink>
              </p>
              <p className="pj-ins-hint" data-js-only>
                {t("hint")}
              </p>
            </aside>
          );
        })}

        <div className="pj-board-zoom" data-js-only>
          <button aria-label={t("zoomOut")} data-zoom="out" type="button">
            <Minus aria-hidden size={14} />
          </button>
          <span data-zoom-value />
          <button aria-label={t("zoomIn")} data-zoom="in" type="button">
            <Plus aria-hidden size={14} />
          </button>
          <button data-zoom="all" type="button">
            {t("fit")}
          </button>
        </div>

        <BoardEngine />
      </div>
    </World>
  );
}

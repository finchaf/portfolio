import "@/ui/board/board.css";
import "./work-projects.css";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";
import { LATEX } from "@/lib/latex-facts";
import { COMMAND, FACTS } from "@/lib/project-facts";
import { BoardSections } from "@/ui/board/board-sections";

import { Chapter } from "./chapter";
import { DESK_STOPS } from "./desk-stops";

/** The camera's zoom before the scene first sets it: the board at its own size. */
const ZOOM = "100%";

/** A project's tile, as on the board and in its panel. */
function Chip({ project }: { project: "portfolio" | "latex" }) {
  const t = useTranslations("projects");
  return (
    <span className="pj-chip" data-color={project === "portfolio" ? "pink" : "teal"}>
      {t(`${project}.chip`)}
    </span>
  );
}

/** Where the camera stands, as the status line names it: a project, and a frame in it. */
function Path({ project, frame }: { project: "portfolio" | "latex"; frame?: string }) {
  return (
    <span className="desk-path">
      <Chip project={project} />
      {frame ? <span>{frame}</span> : null}
    </span>
  );
}

function Facts({ items, asOf }: { items: [number, string][]; asOf: string }) {
  return (
    <>
      <ul className="desk-facts">
        {items.map(([value, label]) => (
          <li key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <p className="desk-as-of">{asOf}</p>
    </>
  );
}

function Copy({ children, link }: { children: ReactNode; link: { href: string; label: string } }) {
  return (
    <li className="desk-copy" data-desk-copy>
      {children}
      <a className="desk-open" href={link.href}>
        {link.label}
      </a>
    </li>
  );
}

/**
 * Projects as their own board: the sections and frames of the Projects page, under a camera the
 * scroll moves from the whole board to each project and into one frame of it. The status line
 * names where the camera stands and how close. In the HTML the words come first and the board is
 * a picture after them, so without a script it is a plain section.
 */
export function WorkProjects() {
  const t = useTranslations("home.work");
  const p = useTranslations("home.work.projects");
  const board = useTranslations("projects");
  const site = useTranslations("portfolio");
  const latex = useTranslations("latex");
  const locale = useLocale();
  const to = (path: "/projects/portfolio" | "/projects/latex", part = "") =>
    `${localizedPath(locale, path)}${part}`;

  const themes = board("frames.themes.name");
  const wall = board("frames.wall.name");
  const crumbs: Record<(typeof DESK_STOPS)[number], ReactNode> = {
    board: null,
    portfolio: <Path project="portfolio" />,
    themes: <Path frame={themes} project="portfolio" />,
    latex: <Path project="latex" />,
    wall: <Path frame={wall} project="latex" />,
  };

  return (
    <Chapter
      axis="y"
      index={3}
      name={p("name")}
      next={{ href: "#experience", label: t("next.experience") }}
      open={t("open")}
      path="/projects"
      bar={{
        skin: "status",
        left: (
          <ol aria-hidden className="desk-crumbs">
            {DESK_STOPS.map((stop) => (
              <li data-crumb key={stop}>
                {crumbs[stop]}
              </li>
            ))}
          </ol>
        ),
        right: (
          <p aria-hidden className="desk-meter">
            <span>{COMMAND.cat}</span>
            <b data-desk-zoom>{ZOOM}</b>
          </p>
        ),
      }}
      stops={6}
      ticks={[p("ticks.intro"), p("ticks.site"), p("ticks.latex")]}
      world="projects"
    >
      <div className="desk" data-desk>
        <div aria-hidden className="desk-view" data-desk-view>
          <div className="desk-world" data-desk-world>
            <BoardSections ids="desk" pictured />
          </div>
        </div>
        <i aria-hidden className="desk-focus" data-desk-focus />
        <ol className="desk-copies">
          <li className="desk-copy" data-desk-copy>
            <p className="font-mono text-sm text-muted">{p("label")}</p>
            <h3 className="stop-title stop-title-large">{p("name")}</h3>
            <p className="stop-text">{p("text")}</p>
          </li>
          <Copy link={{ href: to("/projects/portfolio"), label: board("open") }}>
            <p className="desk-kicker">
              <Chip project="portfolio" />
              <span className="pj-state" data-color="pink">
                {board("portfolio.state")}
              </span>
            </p>
            <h3 className="stop-title">{board("portfolio.title")}</h3>
            <p className="stop-text">{site("lead")}</p>
            <Facts
              asOf={board("asOf", { date: FACTS.date })}
              items={[
                [FACTS.commits, board("portfolio.commits")],
                [FACTS.decisions, board("portfolio.decisions")],
                [FACTS.unit + FACTS.browser, board("portfolio.tests")],
              ]}
            />
          </Copy>
          <Copy
            link={{
              href: to("/projects/portfolio", "#themes"),
              label: p("section", { name: site("sections.themes.name") }),
            }}
          >
            <p className="desk-kicker">
              <Path frame={themes} project="portfolio" />
            </p>
            <h3 className="stop-title">{site("sections.themes.title")}</h3>
            <p className="stop-text">{p("themes")}</p>
          </Copy>
          <Copy link={{ href: to("/projects/latex"), label: board("open") }}>
            <p className="desk-kicker">
              <Chip project="latex" />
              <span className="pj-state" data-color="teal">
                {board("latex.state")}
              </span>
            </p>
            <h3 className="stop-title">{board("latex.title")}</h3>
            <p className="stop-text">{board("latex.summary")}</p>
            <Facts
              asOf={board("latex.asOf", { date: LATEX.date })}
              items={[
                [LATEX.notes.pages, board("latex.notesPages")],
                [LATEX.snippets.all, board("latex.snippets")],
                [LATEX.thesis.releases, board("latex.releases")],
              ]}
            />
          </Copy>
          <Copy
            link={{
              href: to("/projects/latex", "#releases"),
              label: p("section", { name: latex("sections.releases.name") }),
            }}
          >
            <p className="desk-kicker">
              <Path frame={wall} project="latex" />
            </p>
            <h3 className="stop-title">{latex("sections.releases.title")}</h3>
            <p className="stop-text">{p("releases")}</p>
          </Copy>
        </ol>
      </div>
    </Chapter>
  );
}

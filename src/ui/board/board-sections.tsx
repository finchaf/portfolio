import "./board.css";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";

import { GateLines, JournalLines, ReleaseLines, ThemeTiles } from "./board-frames";
import { frameBox, PROJECTS, SECTION } from "./board-layout";
import { SnippetLines, VerdictLines } from "./latex-frames";
import { Paper } from "./paper";
import { Shot } from "./shot";

const OBJECTS: Record<string, ReactNode> = {
  home: <Shot name="home" sizes="(min-width: 64rem) 30vw, 60vw" />,
  phone: <Shot name="phoneFlow" sizes="(min-width: 64rem) 12vw, 25vw" />,
  themes: <ThemeTiles />,
  release: <ReleaseLines />,
  gates: <GateLines />,
  pora: <Shot name="pora" sizes="(min-width: 64rem) 18vw, 40vw" />,
  journal: <JournalLines />,
  notes: <Paper name="notes-calculus" sizes="(min-width: 64rem) 18vw, 40vw" />,
  snippets: <SnippetLines />,
  thesis: <Paper name="thesis-69" sizes="(min-width: 64rem) 10vw, 22vw" />,
  document: <Paper name="doc-cover" sizes="(min-width: 64rem) 10vw, 22vw" />,
  wall: <Paper name="wall-v2026.06.10" sizes="(min-width: 64rem) 18vw, 40vw" />,
  verify: <VerdictLines />,
};

/** A size as an editor writes it under a selection. */
const size = (width: number, height: number) => `${String(width)} × ${String(height)}`;

export interface BoardSectionsProps {
  /** What the sections' headings are named by, unique on the page. */
  ids: string;
  /**
   * The order of each section among its page's other blocks, for the board's list layout, where a
   * project's panel follows its section.
   */
  ordered?: boolean;
  /**
   * A picture of the board, where the words beside it carry the links: its links are left to the
   * mouse, and the keyboard and a screen reader pass over them.
   */
  pictured?: boolean;
}

/**
 * The sections of the projects with their frames, every frame a link to the part of the project's
 * page it comes from. The Projects page is an editor around them, the home page's chapter a camera.
 */
export function BoardSections({ ids, ordered = false, pictured = false }: BoardSectionsProps) {
  const t = useTranslations("projects");
  const locale = useLocale();
  const skip = pictured ? -1 : undefined;

  return PROJECTS.map((project, index) => {
    const page = localizedPath(locale, project.path);
    return (
      <section
        aria-labelledby={pictured ? undefined : `${ids}-${project.id}`}
        className="pj-sec"
        data-color={project.color}
        data-sec={project.id}
        data-size={size(SECTION.width, SECTION.height)}
        key={project.id}
        style={ordered ? { order: index * 2 + 1 } : undefined}
      >
        <h2 className="pj-sec-label" id={pictured ? undefined : `${ids}-${project.id}`}>
          <Link
            className="pj-chip"
            data-color={project.color}
            data-open={project.id}
            href={page}
            tabIndex={skip}
          >
            {t(`${project.id}.chip`)}
          </Link>
        </h2>
        {project.frames.map((frame) => (
          <Link
            className="pj-frame"
            data-frame={frame.key}
            data-kind={frame.kind}
            data-size={size(frame.w, Math.round(frame.w / frame.ratio))}
            draggable={false}
            href={`${page}#${frame.section}`}
            key={frame.key}
            style={frameBox(frame)}
            tabIndex={skip}
          >
            {/* The frame's name names the link: what it shows is a picture of the section. */}
            <span className="pj-frame-name">{t(`frames.${frame.key}.name` as never)}</span>
            <span aria-hidden className="pj-frame-body">
              {OBJECTS[frame.key]}
            </span>
            <i aria-hidden className="pj-frame-handles" data-js-only />
          </Link>
        ))}
      </section>
    );
  });
}

import type { CSSProperties } from "react";

/** The size of a section on the board: frames are placed in these units. */
export const SECTION = { width: 680, height: 826 };

export interface Frame {
  key: string;
  /** The section of the project's page the frame opens. */
  section: string;
  kind: "shot" | "phone" | "tiles" | "lines" | "paper";
  x: number;
  y: number;
  w: number;
  /** Width over height. */
  ratio: number;
}

const A4 = 1 / Math.SQRT2;

export type ProjectId = "portfolio" | "latex";

interface Project {
  id: ProjectId;
  color: "pink" | "teal";
  path: "/projects/portfolio" | "/projects/latex";
  frames: readonly Frame[];
}

/** The projects on the board, left to right: each its section, colour, page and frames. */
export const PROJECTS: readonly Project[] = [
  {
    id: "portfolio",
    color: "pink",
    path: "/projects/portfolio",
    frames: [
      { key: "home", section: "lens", kind: "shot", x: 24, y: 64, w: 456, ratio: 1.6 },
      { key: "phone", section: "form", kind: "phone", x: 500, y: 64, w: 156, ratio: 390 / 844 },
      { key: "themes", section: "themes", kind: "tiles", x: 24, y: 374, w: 456, ratio: 2.2 },
      { key: "release", section: "release", kind: "lines", x: 500, y: 428, w: 156, ratio: 1.3 },
      { key: "gates", section: "gates", kind: "lines", x: 24, y: 604, w: 174, ratio: 0.83 },
      { key: "flow", section: "form", kind: "shot", x: 214, y: 604, w: 266, ratio: 1.6 },
      { key: "journal", section: "decisions", kind: "lines", x: 500, y: 572, w: 156, ratio: 0.65 },
    ],
  },
  {
    id: "latex",
    color: "teal",
    path: "/projects/latex",
    frames: [
      { key: "notes", section: "pages", kind: "paper", x: 24, y: 64, w: 280, ratio: A4 },
      { key: "snippets", section: "notes", kind: "lines", x: 324, y: 64, w: 332, ratio: 1.66 },
      { key: "thesis", section: "thesis", kind: "paper", x: 324, y: 284, w: 156, ratio: A4 },
      { key: "document", section: "documents", kind: "paper", x: 500, y: 284, w: 156, ratio: A4 },
      { key: "wall", section: "releases", kind: "paper", x: 24, y: 480, w: 280, ratio: 776 / 826 },
      { key: "verify", section: "checks", kind: "lines", x: 324, y: 525, w: 332, ratio: 1.32 },
    ],
  },
];

export const FRAMES: readonly Frame[] = PROJECTS.flatMap((project) => project.frames);

/** A frame's place as shares of its section, so the composition scales with no script at all. */
export function frameBox({ x, y, w, ratio }: Frame): CSSProperties {
  return {
    left: `${(x / SECTION.width) * 100}%`,
    top: `${(y / SECTION.height) * 100}%`,
    width: `${(w / SECTION.width) * 100}%`,
    aspectRatio: ratio,
  };
}

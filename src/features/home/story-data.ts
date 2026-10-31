/**
 * App Store downloads per day, 1 to 14 September 2025. From App Store Connect's export, as is: the
 * chart draws them and the text beside it adds them up, and story-data.test.ts keeps the two equal.
 */
export const LAUNCH_DOWNLOADS = [160, 411, 61, 38, 25, 14, 13, 28, 18, 20, 11, 7, 8, 9] as const;

/** The file behind the first chapter as one wall: how many frames stand in each row of it. */
const WALL = [10, 10, 10, 10, 7];

/** The grid of the wall, in widths and heights of a frame. */
const STEP = { x: 98 / 88, y: 73.2 / 56.8 };

/** A frame's own width over its height. */
const FRAME = 110 / 71;

/** The picture all the frames share, one request for 47 elements: columns and rows of its cells. */
export const SPRITE = { columns: 8, rows: 6 };

/** Where the wall lies as a whole, in frames. */
export const FIELD = {
  columns: (Math.max(...WALL) - 1) * STEP.x + 1,
  rows: (WALL.length - 1) * STEP.y + 1,
};

/** The wall's width over its height. */
export const FIELD_RATIO = (FIELD.columns * FRAME) / FIELD.rows;

export const MENUS = WALL.flatMap((frames, row) => {
  const before = WALL.slice(0, row).reduce((sum, count) => sum + count, 0);
  return Array.from({ length: frames }, (_, column) => ({
    menu: before + column + 1,
    left: (column * STEP.x) / FIELD.columns,
    top: (row * STEP.y) / FIELD.rows,
    /** How far the frame starts from the first one, in its own size, in percent. */
    fromX: (0 - column) * STEP.x * 100,
    fromY: (0 - row) * STEP.y * 100,
  }));
}).sort((a, b) => b.menu - a.menu);

/**
 * The collage that opens the story: nine prints the owner chose, in the order of the years, so it is
 * the story in short. `left`, `top` and `size` are in the ribbon's units, for one density on any screen.
 */
export const SCRAPS = [
  { key: "child", left: 0, top: 4, size: 20, tilt: -2.5, drift: 18 },
  { key: "forest", left: 0, top: 18, size: 22, tilt: 1.5, drift: 28 },
  { key: "prom", left: 18.5, top: 0, size: 15, tilt: 2, drift: 22 },
  { key: "book", left: 32, top: 2, size: 17, tilt: -1.5, drift: 26 },
  { key: "window", left: 31, top: 23, size: 15, tilt: 2.5, drift: 16 },
  { key: "desk", left: 47.5, top: 0.5, size: 24, tilt: 1.5, drift: 20 },
  { key: "hat", left: 44.5, top: 16, size: 15, tilt: -2.5, drift: 30 },
  { key: "moscow", left: 58, top: 15.5, size: 16, tilt: 1.5, drift: 18 },
  { key: "airport", left: 70, top: 10, size: 24, tilt: -2, drift: 24 },
] as const;

/** The launch in the store: the first three days and the whole road, from App Store Connect. */
export const LAUNCH = { impressions: 2800, pageViews: 1287, total: 3428 } as const;

/** How long the ribbon holds at its end while the branches draw, in screens of scroll. */
export const RIBBON_HOLD = 1.6;

/**
 * What goes on from the story, in shares of the chapter: where a line leaves the trunk, the level it
 * settles on, where it stops, and where its words stand. The last one runs off the screen.
 */
export const BRANCHES = [
  { key: "first", fork: 0.3, y: 0.24, end: 0.66, label: 0.676, below: false },
  { key: "masters", fork: 0.355, y: 0.46, end: 0.56, label: 0.576, below: false },
  { key: "next", fork: 0.4, y: 0.68, end: 1.02, label: 0.56, below: true },
] as const;

/** How far above the bottom of the screen the trunk runs, clear of the ruler, in pixels. */
export const BRANCH_BASELINE = 118;

/** How long a line takes to rise from the trunk to its level, in shares of the chapter's width. */
export const BRANCH_RISE = 0.13;

/** How wide each part of the ribbon is, in widths of the screen. */
export const SPANS = {
  open: 1.4,
  omsk: 1.35,
  university: 1.2,
  build: 1.6,
  launch: 1.47,
  fork: 1,
  night: 1.05,
  rent: 0.62,
  moscow: 1.4,
  now: 1,
} as const;

/** What full-height photographs add to a chapter, in heights of the screen. */
export const BLEEDS = { rent: 3 / 4 + 4 / 3 + 3 / 4 } as const;

/** The chapters in the order of the story. */
export const CHAPTERS = [
  "omsk",
  "university",
  "build",
  "launch",
  "fork",
  "night",
  "rent",
  "moscow",
  "now",
] as const;

/** The ribbon's whole size, which the stylesheet turns into the height of the section. */
export const RIBBON_SPANS = Object.values(SPANS).reduce((sum, span) => sum + span, 0);
export const RIBBON_BLEEDS = Object.values(BLEEDS).reduce((sum, bleed) => sum + bleed, 0);

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
 * The collage that opens the story: five prints the owner chose. They rise and fall from left to
 * right and overlap only where nothing is covered, so the order here is the order they lie in, the
 * last on top. `left`, `top` and `size` are in the ribbon's units, for one density on any screen;
 * `narrow` is the same pile for a phone, in percent of the collage's width.
 */
export const SCRAPS = [
  {
    key: "desk",
    left: 34,
    top: 12,
    size: 25,
    tilt: 1.5,
    drift: 20,
    narrow: { left: 0, top: 49, size: 50 },
  },
  {
    key: "book",
    left: 20,
    top: 0,
    size: 18,
    tilt: -1.5,
    drift: 26,
    narrow: { left: 56, top: 0, size: 44 },
  },
  {
    key: "child",
    left: 0,
    top: 6,
    size: 23,
    tilt: -2.5,
    drift: 18,
    narrow: { left: 0, top: 6, size: 60 },
  },
  {
    key: "hat",
    left: 14,
    top: 19,
    size: 14,
    tilt: 2.5,
    drift: 30,
    narrow: { left: 34, top: 42, size: 33 },
  },
  {
    key: "airport",
    left: 50,
    top: 2,
    size: 23,
    tilt: -2,
    drift: 24,
    narrow: { left: 50, top: 72, size: 50 },
  },
] as const;

/** How tall the phone's pile stands, in percent of its width. */
export const SCRAPS_NARROW_HEIGHT = 110;

/** The launch in the store: the first three days and the whole road, from App Store Connect. */
export const LAUNCH = { impressions: 2800, pageViews: 1287, total: 3428 } as const;

/** How long the ribbon holds at its end while the branches draw, in screens of scroll. */
export const RIBBON_HOLD = 1.6;

/** How far the ribbon runs on while the fork stands still for its score, in widths of the screen. */
export const FORK_HOLD = 1.4;

/** The week of the score: its lines, the one line in the accent, and its days. */
export const SCORE_ROWS = 8;
export const SCORE_MARKED = 3;
export const SCORE_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

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
  open: 1.18,
  omsk: 1.02,
  university: 1.2,
  build: 1.2,
  launch: 1.47,
  fork: 1 + FORK_HOLD,
  night: 0.92,
  rent: 0.62,
  moscow: 1.2,
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

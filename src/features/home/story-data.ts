/**
 * App Store downloads per day, 1 to 14 September 2025. From App Store Connect's export, as is: the
 * chart draws them and the text beside it adds them up, and story-data.test.ts keeps the two equal.
 */
export const LAUNCH_DOWNLOADS = [160, 411, 61, 38, 25, 14, 13, 28, 18, 20, 11, 7, 8, 9] as const;

/** The file behind the first chapter: rows of `[menu, column]`, where the frames lie in Figma. */
const FILE: readonly (readonly (readonly [number, number])[])[] = [
  [
    [1, 2.5],
    [2, 4],
    [3, 5],
  ],
  [
    [4, 0],
    [6, 1],
    [7, 2],
    [8, 3],
    [9, 4],
    [10, 5],
  ],
  [
    [5, 0],
    [11, 1],
    [12, 2],
    [13, 3],
    [14, 4],
    [15, 5],
    [16, 6],
  ],
  [
    [38, 0],
    [17, 2],
    [18, 3],
    [19, 4],
  ],
  [
    [39, 0],
    [20, 2],
    [21, 3],
    [22, 4],
    [23, 5],
    [24, 6],
    [25, 7],
    [26, 8],
  ],
  [
    [40, 0],
    [41, 4],
    [27, 6],
    [28, 7],
    [29, 8],
    [30, 9],
    [31, 10],
    [32, 11],
    [33, 12],
  ],
  [
    [42, 4],
    [34, 6],
    [35, 7],
    [36, 8],
    [37, 9],
  ],
  [[43, 4]],
  [[44, 4]],
  [[45, 4]],
  [[46, 4]],
  [[47, 4]],
];

/** The grid of the file, in widths and heights of a frame. */
const STEP = { x: 98 / 88, y: 73.2 / 56.8 };

/** The picture all the frames share, one request for 47 elements: columns and rows of its cells. */
export const SPRITE = { columns: 8, rows: 6 };

/** Where the file lies as a whole, in frames. */
export const FIELD = { columns: 12 * STEP.x + 1, rows: (FILE.length - 1) * STEP.y + 1 };

export const MENUS = FILE.flatMap((frames, row) =>
  frames.map(([menu, column]) => ({
    menu,
    left: (column * STEP.x) / FIELD.columns,
    top: (row * STEP.y) / FIELD.rows,
    /** How far the frame starts from the first one, in its own size, in percent. */
    fromX: (2.5 - column) * STEP.x * 100,
    fromY: -row * STEP.y * 100,
  })),
).sort((a, b) => b.menu - a.menu);

/**
 * The collage that opens the story, a moment from each stretch of it and no single face to carry it.
 * `left`, `top` and `size` are in the ribbon's units, so it keeps its density on any screen.
 */
export const SCRAPS = [
  { key: "snow", left: 0, top: 7, size: 14, tilt: -3, drift: 18 },
  { key: "neon", left: 12.5, top: 2, size: 20, tilt: 2, drift: 30 },
  { key: "cat", left: 12, top: 13, size: 22, tilt: -2, drift: 14 },
  { key: "mirror", left: 31, top: 0.5, size: 17, tilt: 1.5, drift: 24 },
  { key: "pug", left: 33, top: 19.5, size: 11.5, tilt: 3, drift: 32 },
  { key: "bird", left: 46.5, top: 3, size: 13, tilt: -2.5, drift: 26 },
  { key: "sky", left: 43, top: 19, size: 20, tilt: -1.5, drift: 16 },
  { key: "mountains", left: 58, top: 10, size: 20, tilt: 2, drift: 20 },
] as const;

/** The launch in the store: the first three days and the whole road, from App Store Connect. */
export const LAUNCH = { impressions: 2800, pageViews: 1287, total: 3428 } as const;

/** How wide each part of the ribbon is, in widths of the screen. */
export const SPANS = {
  open: 1.25,
  omsk: 1.35,
  university: 1.05,
  build: 1.1,
  launch: 1.45,
  fork: 1,
  night: 1.05,
  rent: 0.62,
  moscow: 1.4,
  now: 0.42,
} as const;

/** What full-height photographs add to a chapter, in heights of the screen. */
export const BLEEDS = { rent: 3 / 4 + 4 / 3 + 3 / 4, now: 0.92 } as const;

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

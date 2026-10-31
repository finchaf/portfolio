/**
 * App Store downloads per day, 1 to 14 September 2025. From App Store Connect's export, as is: the
 * chart draws them and the text beside it adds them up, and story-data.test.ts keeps the two equal.
 */
export const LAUNCH_DOWNLOADS = [160, 411, 61, 38, 25, 14, 13, 28, 18, 20, 11, 7, 8, 9] as const;

/** The Figma file in the first chapter: the picture is the file at the zoom Figma fits it to. */
export const CANVAS = {
  /** The zoom of the picture, in percent. */
  fileZoom: 5,
  /** How much closer than the picture the camera starts. */
  close: 12,
  /** The first frame in the picture, in shares of its width and height. */
  frame: { left: 274 / 1308, top: 45.2 / 924, width: 88 / 1308, height: 56.8 / 924 },
} as const;

/** The point the zoom is about: from there the first frame starts in the middle of the view. */
export const CANVAS_ORIGIN = (["left", "top"] as const).map((side) => {
  const size = side === "left" ? CANVAS.frame.width : CANVAS.frame.height;
  const middle = CANVAS.frame[side] + size / 2;
  return (middle * CANVAS.close - 0.5) / (CANVAS.close - 1);
}) as [number, number];

/** How wide each part of the ribbon is, in widths of the screen. */
export const SPANS = {
  open: 0.55,
  omsk: 1.3,
  university: 1.1,
  build: 1,
  launch: 1.3,
  fork: 0.72,
  night: 1.25,
  moscow: 0.88,
  now: 0.9,
} as const;

/** The chapters in the order of the story. */
export const CHAPTERS = [
  "omsk",
  "university",
  "build",
  "launch",
  "fork",
  "night",
  "moscow",
  "now",
] as const;

/** The ribbon's whole width, which the stylesheet turns into the height of the section. */
export const RIBBON_SPANS = Object.values(SPANS).reduce((sum, span) => sum + span, 0);

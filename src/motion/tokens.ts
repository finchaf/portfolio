/**
 * The motion of the site in one place: effects read these and never hold a number of their own.
 * tokens.css carries the same values for CSS, and tokens.test.ts keeps the two equal.
 */

/** Seconds. */
export const DURATION = {
  /** A hover, a press, a change of colour. */
  quick: 0.18,
  /** A control answering, a block moving to its place. */
  base: 0.32,
  /** Something crossing the screen. */
  slow: 0.7,
  /** One round of the grain's jumps across the page. */
  grain: 1.2,
} as const;

/** Curves for CSS transitions. */
export const EASE = {
  /** Arrives fast and settles: almost everything. */
  out: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** Leaves and arrives softly: something that travels and stays on the screen. */
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** How far a page scrolls, in pixels, before it has left its top. */
export const PAGE_MOVED = 8;

/** How scenes on the scroll follow it. */
export const SCENE = {
  /** The curve of a move between two rests of a scene. */
  move: "power2.inOut",
  /** Seconds a scene takes to catch the scroll with a mouse wheel. */
  catchUp: 0.35,
  /** How long a scene rests on a step, as a share of the move between two steps. */
  rest: 0.7,
} as const;

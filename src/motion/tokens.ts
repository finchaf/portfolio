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
  /** One page giving way to another. */
  page: 0.62,
  /** One round of the grain's jumps across the story. */
  grain: 1.2,
  /** One breath of a live light, as the status's on the first screen. */
  pulse: 2.4,
  /** One blink of a text caret, on and off. */
  blink: 1,
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
  /** Seconds the lens of the first screen takes to cross it before a reader takes it. */
  wander: 7,
  /** The curve of something that goes to and fro on its own, as the lens. */
  sway: "sine.inOut",
  /** The curve of something catching up with the pointer. */
  follow: "power3.out",
  /** The curve of something the scroll brings to its place: a frame dealt, a number counted up. */
  arrive: "power2.out",
  /** How much of the move between two stops the old stop takes to leave. */
  leaving: 0.65,
  /** How long before it settles a stop counts as the current one, as a share of the move. */
  arriving: 0.25,
} as const;

/**
 * The media queries motion and layout answer to, with no GSAP behind them: a component without a
 * scene reads them here and does not pull GSAP's registration into its chunk.
 */

/** The query under which every scene runs: without it the page stays as the HTML has it. */
export const MOTION_ALLOWED = "(prefers-reduced-motion: no-preference)";

/** The query of a reader who asked for less motion. */
export const MOTION_REDUCED = "(prefers-reduced-motion: reduce)";

/** Whether the reader asks for less motion now. It reads the query on every call. */
export function isCalm(): boolean {
  return matchMedia(MOTION_REDUCED).matches;
}

/** A screen wide enough for a page's desk layout; `NARROW` is the rest. */
export const WIDE = "(min-width: 64rem)";

/** A screen below `WIDE`. */
export const NARROW = "(width < 64rem)";

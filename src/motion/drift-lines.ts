import { gsap, SplitText } from "./gsap";

/** The width of the screen the depths are written for. */
const DESIGN_WIDTH = 1440;

/** How little of a depth a narrow screen keeps. */
const NARROW_DEPTH = 0.3;

/** How much further the last line goes than the first, however many lie between them. */
const LINE_SPREAD = 0.6;

export interface DriftOptions {
  /** How far the first line goes either way, in pixels of the wide screen. */
  depth: number;
  /** Lines go in turn to opposite sides, instead of all to one. */
  cross?: boolean;
  /**
   * `through`: the lines stand apart, meet, and part the other way as the text passes the reader.
   * `arrive`: they stop where they meet. `leave`: they start there and part.
   */
  path?: "through" | "arrive" | "leave";
  scrollTrigger: ScrollTrigger.Vars;
}

/**
 * Text set large moves against the scroll line by line, each line at its own speed, and reads straight
 * where the lines meet. Only transforms move, and a change of width splits the lines anew. Returns
 * what puts the text back.
 */
export function driftLines(
  element: Element,
  { depth, cross = false, path = "through", scrollTrigger }: DriftOptions,
) {
  let moving: gsap.core.Tween | undefined;
  const split = SplitText.create(element, {
    type: "lines",
    tag: "span",
    aria: "none",
    autoSplit: true,
    onSplit: ({ lines }) => {
      moving?.revert();
      // A browser draws no transform on an inline box, though it reports one.
      gsap.set(lines, { display: "block" });
      const reach = Math.max(window.innerWidth / DESIGN_WIDTH, NARROW_DEPTH);
      const place = (index: number) => index / Math.max(lines.length - 1, 1);
      const far = (index: number) =>
        depth * reach * (1 + place(index) * LINE_SPREAD) * (cross && index % 2 === 1 ? -1 : 1);
      moving = gsap.fromTo(
        lines,
        { x: path === "leave" ? 0 : far },
        {
          x: (index: number) => (path === "arrive" ? 0 : -far(index)),
          ease: "none",
          scrollTrigger: { ...scrollTrigger, scrub: true },
        },
      );
    },
  });
  return () => {
    moving?.revert();
    split.revert();
  };
}

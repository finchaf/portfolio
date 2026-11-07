// What the story does on a wide screen and on a phone alike: the ribbon and the column call it.
import { driftLines } from "@/motion/drift-lines";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import { DURATION, SCENE } from "@/motion/tokens";

import { createRuler } from "./story-ruler";
import { createScore } from "./story-score";

/** How much a fast scroll lifts the lens, the pixels a frame that counts as fast, and how quickly it settles. */
const RIPPLE = 0.45;
const RIPPLE_SPEED = 14;
const RIPPLE_EASE = 0.12;

/** How far the lines of the story's title go when the ribbon starts, in pixels of the wide screen. */
const TITLE_DEPTH = 100;

/** How long the page takes to turn to paper once the story holds, in screens of scroll. */
const PAPER_SCREENS = 0.4;

/** Where on the screen a chapter becomes the current one: a share of its width or height, in %. */
export const CURRENT_AT = 58;

/** The share of the scene each frame of the file spends on its way. */
const DEAL = 0.4;

/** How far apart the photographs of the opening lie in their pile, in degrees and in the scene's time. */
const PILE_TILT = 2;
const SCRAP_STAGGER = 0.05;

export type Mark = (index: number) => void;

/**
 * Keeps the ruler drawn. It goes on after the scroll has stopped, until the lens settles, and it
 * draws nothing while nothing changes.
 */
export function runRuler(section: HTMLElement, travelled: () => number, bands: Element[] = []) {
  const canvas = section.querySelector<HTMLCanvasElement>("[data-story-canvas]");
  const marks = section.querySelector<HTMLElement>("[data-story-marks]");
  if (!canvas || !marks) return () => undefined;
  const ruler = createRuler(canvas, marks, bands);
  if (!ruler) return () => undefined;

  let last = Number.NaN;
  let lift = 0;
  const redraw = () => {
    ruler.measure();
    last = Number.NaN;
  };
  const frame = () => {
    const offset = travelled();
    const speed = Number.isNaN(last) ? 0 : Math.abs(offset - last);
    const target = Math.min(speed / RIPPLE_SPEED, 1);
    const settled = speed === 0 && lift < 0.001 && !Number.isNaN(last);
    if (settled) return;
    lift += (target - lift) * RIPPLE_EASE;
    ruler.draw(offset, 1 + lift * RIPPLE);
    last = offset;
  };

  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const mode = new MutationObserver(redraw);
  redraw();
  gsap.ticker.add(frame);
  ScrollTrigger.addEventListener("refresh", redraw);
  scheme.addEventListener("change", redraw);
  mode.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    gsap.ticker.remove(frame);
    ScrollTrigger.removeEventListener("refresh", redraw);
    scheme.removeEventListener("change", redraw);
    mode.disconnect();
  };
}

/** The page turns to paper where the story takes hold, so nothing shows where it meets the first screen. */
export function turnToPaper(section: HTMLElement) {
  gsap.fromTo(
    gsap.utils.toArray("[data-story-paper]", section),
    { opacity: 0 },
    {
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${String(PAPER_SCREENS * window.innerHeight)}`,
        scrub: true,
      },
    },
  );
}

/**
 * The frames of the file start as one stack and the scroll deals them to their places, in the order
 * of their numbers: one screen multiplying into the whole file. Each move lasts `DEAL` of the scene.
 */
export function dealMenus(
  section: HTMLElement,
  scrollTrigger: (view: Element) => ScrollTrigger.Vars,
) {
  const view = section.querySelector("[data-menus]");
  const frames = gsap.utils.toArray<HTMLElement>("[data-menu]", view);
  if (!view || frames.length === 0) return;
  const last = frames.length - 1;
  const scene = gsap.timeline({
    defaults: { ease: SCENE.arrive },
    scrollTrigger: { ...scrollTrigger(view), scrub: true },
  });
  frames.forEach((frame) => {
    const { menu, fromX, fromY } = frame.dataset;
    scene.fromTo(
      frame,
      { xPercent: Number(fromX), yPercent: Number(fromY) },
      { xPercent: 0, yPercent: 0, duration: DEAL },
      ((Number(menu) - 1) / last) * (1 - DEAL),
    );
  });
}

/** The photographs of the opening leave one pile as the story arrives, each to its own place. */
export function dealScraps(section: HTMLElement, scrollTrigger: ScrollTrigger.Vars) {
  const view = section.querySelector<HTMLElement>("[data-collage]");
  const scraps = gsap.utils.toArray<HTMLElement>("[data-scrap]", view);
  if (!view || scraps.length === 0) return;
  const toPile = (axis: "Left" | "Top", scrap: HTMLElement) => {
    const size = axis === "Left" ? "Width" : "Height";
    const place = scrap.parentElement;
    if (!place) return 0;
    return view[`offset${size}`] / 2 - place[`offset${axis}`] - place[`offset${size}`] / 2;
  };
  // A timeline, as for the menus: a staggered tween would put only the first one in the pile.
  const scene = gsap.timeline({
    defaults: { ease: SCENE.arrive },
    scrollTrigger: { ...scrollTrigger, scrub: true, invalidateOnRefresh: true },
  });
  scraps.forEach((scrap, index) => {
    scene.fromTo(
      scrap,
      {
        x: () => toPile("Left", scrap),
        y: () => toPile("Top", scrap),
        rotation: (index % 2 ? -1 : 1) * PILE_TILT * (index + 1),
      },
      { x: 0, y: 0, rotation: 0, duration: 1 },
      index * SCRAP_STAGGER,
    );
  });
}

/** Puts the score on its canvas, and keeps it right through a resize and a change of mode. */
export function runScore(section: HTMLElement) {
  const figure = section.querySelector<HTMLElement>("[data-score]");
  const canvas = figure?.querySelector<HTMLCanvasElement>("[data-score-canvas]");
  if (!figure || !canvas) return null;
  const score = createScore(canvas, gsap.utils.toArray<HTMLElement>("[data-score-day]", figure));
  if (!score) return null;

  const pluck = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    score.pluck(event.clientX - box.left, event.clientY - box.top);
  };
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const mode = new MutationObserver(score.measure);
  score.measure();
  ScrollTrigger.addEventListener("refresh", score.measure);
  scheme.addEventListener("change", score.measure);
  mode.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  figure.addEventListener("pointermove", pluck);
  return {
    draw: score.draw,
    figure,
    stop: () => {
      ScrollTrigger.removeEventListener("refresh", score.measure);
      scheme.removeEventListener("change", score.measure);
      mode.disconnect();
      figure.removeEventListener("pointermove", pluck);
      score.stop();
    },
  };
}

/** Over the run of full-screen photographs the capsule and the ruler leave them the screen. */
export function clearTheScreen(
  section: HTMLElement,
  scrollTrigger: (run: Element) => ScrollTrigger.Vars,
) {
  const root = document.documentElement;
  const run = section.querySelector("[data-bare-run]");
  if (!run) return () => undefined;
  ScrollTrigger.create({
    ...scrollTrigger(run),
    onToggle: ({ isActive }) => {
      root.toggleAttribute("data-bare", isActive);
    },
  });
  return () => {
    root.removeAttribute("data-bare");
  };
}

/** The numbers of the launch count up once, as they arrive. What the HTML says is the end of it. */
export function countUp(section: HTMLElement, arriving: (element: Element) => ScrollTrigger.Vars) {
  const format = new Intl.NumberFormat(document.documentElement.lang);
  const numbers = gsap.utils.toArray<HTMLElement>("[data-count]", section);
  numbers.forEach((element) => {
    const end = Number(element.dataset.count);
    const shown = { value: 0 };
    element.textContent = format.format(0);
    ScrollTrigger.create({
      ...arriving(element),
      once: true,
      onEnter: () => {
        gsap.to(shown, {
          value: end,
          duration: DURATION.slow,
          ease: SCENE.arrive,
          onUpdate: () => {
            element.textContent = format.format(Math.round(shown.value));
          },
        });
      },
    });
  });
  return () => {
    numbers.forEach((element) => {
      element.textContent = format.format(Number(element.dataset.count));
    });
  };
}

/** The large lines of the story move line by line, on whichever axis the page goes along. */
export function moveLines(
  section: HTMLElement,
  passing: (element: Element) => ScrollTrigger.Vars,
  settling: (element: Element) => ScrollTrigger.Vars,
) {
  const stops = gsap.utils.toArray<HTMLElement>("[data-lines]", section).map((element) => {
    const settles = element.closest("[data-settle]");
    return driftLines(element.querySelector("[data-reveal]") ?? element, {
      depth: Number(element.dataset.lines),
      cross: element.hasAttribute("data-lines-cross"),
      path: settles ? "arrive" : "through",
      scrollTrigger: settles ? settling(settles) : passing(element),
    });
  });
  const title = section.querySelector("[data-title]");
  if (title) {
    stops.push(
      driftLines(title, {
        depth: TITLE_DEPTH,
        path: "leave",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${String(window.innerHeight)}`,
        },
      }),
    );
  }
  return () => {
    stops.forEach((stop) => {
      stop();
    });
  };
}

/** Shows an element once its trigger has been passed: the stylesheet does the move. */
export function revealOnce(element: Element, vars: ScrollTrigger.Vars) {
  ScrollTrigger.create({
    ...vars,
    trigger: element,
    once: true,
    onEnter: () => {
      element.toggleAttribute("data-seen", true);
    },
  });
}

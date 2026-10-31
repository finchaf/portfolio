"use client";

import { useRef, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

import { CANVAS } from "./story-data";
import { createRuler } from "./story-ruler";

const WIDE = `${MOTION_ALLOWED} and (min-width: 64rem)`;
const NARROW = `${MOTION_ALLOWED} and (width < 64rem)`;

/** How fast the ruler slides, as a share of the ribbon. */
const RULER_PACE = 0.35;

/** How far the ruler slides over a whole story on a phone, where no ribbon moves, in pixels. */
const RULER_TRAVEL = 2400;

/** How much a fast scroll lifts the lens, the pixels a frame that counts as fast, and how quickly it settles. */
const RIPPLE = 0.45;
const RIPPLE_SPEED = 14;
const RIPPLE_EASE = 0.12;

/** How long the page takes to turn to paper once the story holds, in screens of scroll. */
const PAPER_SCREENS = 0.4;

/** Where on the screen a chapter becomes the current one: a share of its width or height, in %. */
const CURRENT_AT = 58;

/** The share of the camera's move in which the selection leaves. */
const SELECTION_LEAVES = 0.2;

type Mark = (index: number) => void;

const follow = () => (ScrollTrigger.isTouch === 1 ? true : SCENE.catchUp);

/**
 * Keeps the ruler drawn. It goes on after the scroll has stopped, until the lens settles, and it
 * draws nothing while nothing changes.
 */
function runRuler(section: HTMLElement, travelled: () => number) {
  const canvas = section.querySelector<HTMLCanvasElement>("[data-story-canvas]");
  const marks = section.querySelector<HTMLElement>("[data-story-marks]");
  if (!canvas || !marks) return () => undefined;
  const ruler = createRuler(canvas, marks, gsap.utils.toArray("[data-ruler-band]", section));
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
function turnToPaper(section: HTMLElement) {
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
 * The camera pulls back from one frame of the Figma file to all of it, and the file's zoom counts down
 * with it. The steps of a zoom are equal in ratio, not in size, as they are under a real trackpad.
 */
function pullBack(section: HTMLElement, scrollTrigger: (view: Element) => ScrollTrigger.Vars) {
  const view = section.querySelector("[data-figma-view]");
  const world = view?.querySelector<HTMLElement>("[data-figma-world]");
  const zoom = view?.querySelector("[data-figma-zoom]");
  if (!view || !world || !zoom) return;
  const camera = { pulled: 0 };
  const paint = () => {
    const closer = CANVAS.close ** (1 - camera.pulled);
    gsap.set(world, { scale: closer });
    zoom.textContent = String(Math.round(CANVAS.fileZoom * closer));
  };
  paint();
  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: { ...scrollTrigger(view), scrub: true },
    })
    .to(camera, { pulled: 1, duration: 1, onUpdate: paint }, 0)
    .to(
      view.querySelectorAll("[data-figma-select]"),
      { opacity: 0, duration: SELECTION_LEAVES },
      0,
    );
}

/** Shows an element once its trigger has been passed: the stylesheet does the move. */
function revealOnce(element: Element, vars: ScrollTrigger.Vars) {
  ScrollTrigger.create({
    ...vars,
    trigger: element,
    once: true,
    onEnter: () => {
      element.toggleAttribute("data-seen", true);
    },
  });
}

/** The page scrolls down and the ribbon goes left, one pixel of ribbon to a fixed share of scroll. */
function runRibbon(section: HTMLElement, track: HTMLElement, mark: Mark) {
  const distance = () => track.scrollWidth - window.innerWidth;
  const along = {
    trigger: section,
    start: "top top",
    // The last screen of the section stays behind the works rising over it.
    end: () => `+=${String(section.offsetHeight - 2 * window.innerHeight)}`,
    scrub: follow(),
    invalidateOnRefresh: true,
  };
  const move = gsap.to(track, { x: () => -distance(), ease: "none", scrollTrigger: along });

  gsap.utils.toArray<HTMLElement>("[data-reveal]", section).forEach((element) => {
    revealOnce(element, { containerAnimation: move, start: "left 92%" });
  });

  // A print comes in lying further over than it settles, and things move at their own depth.
  gsap.utils.toArray<HTMLElement>("[data-drift]", section).forEach((element) => {
    const depth = Number(element.dataset.drift);
    const tilt = Number(element.dataset.tilt ?? 0);
    gsap.fromTo(
      element,
      { x: depth, rotation: tilt * 2.5 },
      {
        x: -depth,
        rotation: tilt * 0.5,
        ease: "none",
        scrollTrigger: {
          containerAnimation: move,
          trigger: element.parentElement,
          start: "left right",
          end: "right left",
          scrub: true,
        },
      },
    );
  });

  gsap.utils.toArray<HTMLElement>("[data-chapter-of-story]", section).forEach((chapter, index) => {
    ScrollTrigger.create({
      containerAnimation: move,
      trigger: chapter,
      start: `left ${String(CURRENT_AT)}%`,
      end: `right ${String(CURRENT_AT)}%`,
      onToggle: ({ isActive }) => {
        if (isActive) mark(index);
      },
    });
  });

  pullBack(section, (view) => ({
    containerAnimation: move,
    trigger: view,
    start: "left 78%",
    end: "left 12%",
  }));

  return runRuler(section, () => move.progress() * distance() * RULER_PACE);
}

/** A phone keeps the page: chapters come up as they arrive, and the ruler counts along. */
function runColumn(section: HTMLElement, mark: Mark) {
  gsap.utils.toArray<HTMLElement>("[data-reveal]", section).forEach((element) => {
    revealOnce(element, { start: "top 88%" });
  });
  const along = ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom" });
  gsap.utils.toArray<HTMLElement>("[data-chapter-of-story]", section).forEach((chapter, index) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: `top ${String(CURRENT_AT)}%`,
      end: `bottom ${String(CURRENT_AT)}%`,
      onToggle: ({ isActive }) => {
        if (isActive) mark(index);
      },
    });
  });

  pullBack(section, (view) => ({ trigger: view, start: "top 80%", end: "top 25%" }));

  return runRuler(section, () => along.progress * RULER_TRAVEL);
}

/**
 * Directs the story. The stage holds by CSS `sticky`, the page scrolls natively and only transforms
 * and opacity move. What hides a reveal is `data-live`, set here, so with no script and with reduced
 * motion nothing is ever hidden and the chapters stay plain sections.
 */
export function StoryScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = scope.current?.querySelector<HTMLElement>("[id='story']");
      const track = scope.current?.querySelector<HTMLElement>("[data-story-track]");
      if (!section || !track) return;
      const marks = gsap.utils.toArray<HTMLElement>("[data-story-mark]", section);
      const mark: Mark = (index) => {
        marks.forEach((each, at) => {
          each.toggleAttribute("data-active", at === index);
        });
      };

      const motion = gsap.matchMedia();
      const live = (run: () => () => void) => () => {
        section.toggleAttribute("data-live", true);
        mark(0);
        turnToPaper(section);
        const stop = run();
        return () => {
          stop();
          section.toggleAttribute("data-live", false);
          section.querySelectorAll("[data-seen]").forEach((element) => {
            element.removeAttribute("data-seen");
          });
        };
      };
      motion.add(
        WIDE,
        live(() => runRibbon(section, track, mark)),
      );
      motion.add(
        NARROW,
        live(() => runColumn(section, mark)),
      );
      return () => {
        motion.revert();
      };
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}

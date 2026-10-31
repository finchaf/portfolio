"use client";

import { useRef, type ReactNode } from "react";

import { driftLines } from "@/motion/drift-lines";
import { gsap, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

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

/** How far the lines of the story's title go when the ribbon starts, in pixels of the wide screen. */
const TITLE_DEPTH = 150;

/** How long the page takes to turn to paper once the story holds, in screens of scroll. */
const PAPER_SCREENS = 0.4;

/** Where on the screen a chapter becomes the current one: a share of its width or height, in %. */
const CURRENT_AT = 58;

/** The share of the scene each frame of the file spends on its way. */
const DEAL = 0.4;

/** How far a full-height photograph slides inside its frame, in percent of its width. */
const BLEED_SLIDE = 5.5;

/** How many screens of the ribbon ahead its pictures are asked for. */
const AHEAD = 2.5;

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
 * The frames of the file start as one stack and the scroll deals them to their places, in the order
 * of their numbers: one screen multiplying into the whole file. Each move lasts `DEAL` of the scene.
 */
function dealMenus(section: HTMLElement, scrollTrigger: (view: Element) => ScrollTrigger.Vars) {
  const view = section.querySelector("[data-menus]");
  const frames = gsap.utils.toArray<HTMLElement>("[data-menu]", view);
  if (!view || frames.length === 0) return;
  const last = frames.length - 1;
  const scene = gsap.timeline({
    defaults: { ease: "power2.out" },
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

/** Full-height photographs move a little inside their frames, slower than the ribbon. */
function slideBleeds(section: HTMLElement, move: gsap.core.Tween) {
  gsap.utils.toArray<HTMLElement>("[data-bleed]", section).forEach((bleed) => {
    gsap.fromTo(
      bleed.querySelector("[data-bleed-image]"),
      { xPercent: -BLEED_SLIDE },
      {
        xPercent: 0,
        ease: "none",
        scrollTrigger: {
          containerAnimation: move,
          trigger: bleed,
          start: "left right",
          end: "right left",
          scrub: true,
        },
      },
    );
  });
}

/**
 * A browser holds a lazy picture until it reaches the screen, and a ribbon clipped by its stage gets
 * there too late: the chapters ahead are asked for early, and only once the story is near.
 */
function wakeAhead(section: HTMLElement, track: HTMLElement) {
  const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter-of-story]", section);
  const wake = () => {
    const reach = AHEAD * window.innerWidth - Number(gsap.getProperty(track, "x"));
    chapters.forEach((chapter) => {
      if (chapter.offsetLeft > reach) return;
      chapter.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
      });
    });
  };
  ScrollTrigger.create({
    trigger: section,
    start: "top 200%",
    end: "bottom top",
    onUpdate: wake,
    onToggle: wake,
  });
}

/** The large lines of the story move line by line, on whichever axis the page goes along. */
function moveLines(section: HTMLElement, passing: (element: Element) => ScrollTrigger.Vars) {
  const stops = gsap.utils.toArray<HTMLElement>("[data-lines]", section).map((element) =>
    driftLines(element.querySelector("[data-reveal]") ?? element, {
      depth: Number(element.dataset.lines),
      cross: element.hasAttribute("data-lines-cross"),
      scrollTrigger: passing(element),
    }),
  );
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

  dealMenus(section, (view) => ({
    containerAnimation: move,
    trigger: view,
    start: "left 88%",
    end: "left 8%",
  }));
  slideBleeds(section, move);
  wakeAhead(section, track);
  const stopLines = moveLines(section, (element) => ({
    containerAnimation: move,
    trigger: element,
    start: "left right",
    end: "right left",
  }));
  const stopRuler = runRuler(section, () => move.progress() * distance() * RULER_PACE);

  return () => {
    stopLines();
    stopRuler();
  };
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

  dealMenus(section, (view) => ({ trigger: view, start: "top 85%", end: "top 30%" }));

  const stopLines = moveLines(section, (element) => ({
    trigger: element,
    start: "top bottom",
    end: "bottom top",
  }));
  const stopRuler = runRuler(section, () => along.progress * RULER_TRAVEL);

  return () => {
    stopLines();
    stopRuler();
  };
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

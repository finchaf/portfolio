"use client";

import { useRef, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

const WIDE = `${MOTION_ALLOWED} and (min-width: 64rem)`;
const NARROW = `${MOTION_ALLOWED} and (width < 64rem)`;

/** How fast the ruler slides, as a share of the ribbon. */
const RULER_PACE = 0.22;

/** Where on the screen a chapter becomes the current one: a share of its width or height, in %. */
const CURRENT_AT = 40;

type Mark = (index: number) => void;

const follow = () => (ScrollTrigger.isTouch === 1 ? true : SCENE.catchUp);

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
function runRibbon(section: HTMLElement, track: HTMLElement, ticks: Element | null, mark: Mark) {
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
  gsap.to(ticks, {
    x: () => -distance() * RULER_PACE,
    ease: "none",
    scrollTrigger: { ...along },
  });

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
}

/** A phone keeps the page: chapters come up as they arrive, and the ruler counts along. */
function runColumn(section: HTMLElement, ticks: Element | null, mark: Mark) {
  gsap.utils.toArray<HTMLElement>("[data-reveal]", section).forEach((element) => {
    revealOnce(element, { start: "top 88%" });
  });
  gsap.to(ticks, {
    x: () => -window.innerWidth,
    ease: "none",
    scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true },
  });
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
      const ticks = section.querySelector("[data-story-ticks]");
      const marks = gsap.utils.toArray<HTMLElement>("[data-story-mark]", section);
      const mark: Mark = (index) => {
        marks.forEach((each, at) => {
          each.toggleAttribute("data-active", at === index);
        });
      };

      const motion = gsap.matchMedia();
      const live = (run: () => void) => () => {
        section.toggleAttribute("data-live", true);
        mark(0);
        run();
        return () => {
          section.toggleAttribute("data-live", false);
          section.querySelectorAll("[data-seen]").forEach((element) => {
            element.removeAttribute("data-seen");
          });
        };
      };
      motion.add(
        WIDE,
        live(() => {
          runRibbon(section, track, ticks, mark);
        }),
      );
      motion.add(
        NARROW,
        live(() => {
          runColumn(section, ticks, mark);
        }),
      );
      return () => {
        motion.revert();
      };
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}

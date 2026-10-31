"use client";

import { useRef, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

/** The corners of a sheet rising over the page, and how far what it covers sinks. */
const SHEET = { radius: "2rem", sunk: 0.93, dimmed: 0.55 };

const WIDE_SCREEN = "(min-width: 64rem)";

/** How much of the move between two stops the old stop takes to leave. */
const LEAVING = 0.65;

/** How long before it settles a stop counts as the current one, and takes a press. */
const ARRIVING = 0.25;

const follow = () => (ScrollTrigger.isTouch === 1 ? true : SCENE.catchUp);

const toTop = (element: Element) => element.getBoundingClientRect().top + window.scrollY;

/** Marks one tick of a chapter's bar, and the stop readers can press. */
function marker(chapter: HTMLElement) {
  const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", chapter);
  const stops = gsap.utils.toArray<HTMLElement>("[data-stop]", chapter);
  return (index: number) => {
    ticks.forEach((tick, each) => {
      tick.toggleAttribute("data-active", each === index);
    });
    stops.forEach((stop, each) => {
      stop.toggleAttribute("data-active", each === index);
    });
  };
}

/** A sheet coming up over a stage: its corners straighten, and what it covers sinks. */
function rise(sheet: HTMLElement, rounded: HTMLElement, under: HTMLElement | null) {
  const scene = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: sheet, start: "top bottom", end: "top top", scrub: true },
  });
  scene.fromTo(
    rounded,
    { borderTopLeftRadius: SHEET.radius, borderTopRightRadius: SHEET.radius },
    { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
    0,
  );
  if (under) scene.to(under, { scale: SHEET.sunk, opacity: SHEET.dimmed }, 0);
}

/**
 * Stops one over another, resting long enough to read. The old one leaves upward and the new one
 * comes from below; with `stack` what is shown stays on the canvas, under the next one.
 */
function runStops(chapter: HTMLElement, start: () => string, end: () => string, stack: boolean) {
  const stops = gsap.utils.toArray<HTMLElement>("[data-stop]", chapter);
  const progress = chapter.querySelector("[data-chapter-progress]");
  const mark = marker(chapter);
  const part = (stop: HTMLElement | undefined, name: "copy" | "visual") =>
    stop?.querySelector(`[data-stop-${name}]`) ?? null;
  const arrivals = [0];

  const scene = gsap.timeline({
    defaults: { ease: SCENE.move },
    onUpdate: () => {
      mark(arrivals.findLastIndex((at) => scene.time() >= at - ARRIVING));
    },
    scrollTrigger: {
      trigger: chapter,
      start,
      end,
      scrub: follow(),
      invalidateOnRefresh: true,
    },
  });

  scene.addLabel("stop-0").to({}, { duration: SCENE.rest });
  stops.slice(1).forEach((stop, index) => {
    const leaving = stops[index];
    const at = scene.duration();
    scene.to(part(leaving, "copy"), { yPercent: -35, opacity: 0, duration: LEAVING }, at);
    if (stack) {
      scene.to(
        part(leaving, "visual"),
        { scale: 0.86, rotation: -3, yPercent: -8, opacity: 0.4, duration: 1 },
        at,
      );
    } else {
      scene.to(part(leaving, "visual"), { yPercent: -45, opacity: 0, duration: LEAVING }, at);
    }
    scene.fromTo(
      part(stop, "copy"),
      { yPercent: 35, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: LEAVING },
      at + 1 - LEAVING,
    );
    scene.fromTo(
      part(stop, "visual"),
      { yPercent: 60, scale: 0.94, opacity: 0, rotation: stack ? 4 : 0 },
      { yPercent: 0, scale: 1, opacity: 1, rotation: 0, duration: 1 },
      at,
    );
    arrivals.push(at + 1);
    scene.addLabel(`stop-${index + 1}`, at + 1).to({}, { duration: SCENE.rest }, at + 1);
  });
  scene.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: scene.duration() }, 0);
  mark(0);

  // Opacity alone hides a stop, so the keyboard can reach it: the scene comes to meet the focus.
  const meet = (event: FocusEvent) => {
    const stop = (event.target as Element).closest<HTMLElement>("[data-stop]");
    const index = stop ? stops.indexOf(stop) : -1;
    const trigger = scene.scrollTrigger;
    if (index < 0 || !trigger) return;
    window.scrollTo({ top: trigger.labelToScroll(`stop-${index}`), behavior: "instant" });
  };
  chapter.addEventListener("focusin", meet);
  return () => {
    chapter.removeEventListener("focusin", meet);
  };
}

/** The track slides sideways while the page scrolls down, and a line runs along its stages. */
function runTrack(chapter: HTMLElement) {
  const track = chapter.querySelector<HTMLElement>("[data-track]");
  const line = chapter.querySelector("[data-flow-line]");
  const progress = chapter.querySelector("[data-chapter-progress]");
  if (!track) return;
  const mark = marker(chapter);
  const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", chapter);
  const along = {
    trigger: chapter,
    start: "top top",
    end: () => `+=${chapter.offsetHeight - 2 * window.innerHeight}`,
    scrub: follow(),
    invalidateOnRefresh: true,
  };

  const move = gsap.to(track, {
    x: () => window.innerWidth - track.scrollWidth,
    ease: "none",
    scrollTrigger: {
      ...along,
      onUpdate: ({ progress: done }) => {
        mark(Math.round(done * (panels.length - 1)));
      },
    },
  });
  gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { ...along } });
  gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { ...along } });
  mark(0);

  panels.slice(1).forEach((panel) => {
    gsap.fromTo(
      panel.querySelector("[data-panel-visual]"),
      { xPercent: 22, opacity: 0.2 },
      {
        xPercent: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          containerAnimation: move,
          trigger: panel,
          start: "left 100%",
          end: "left 45%",
          scrub: true,
        },
      },
    );
    const node = panel.querySelector("[data-flow-node]");
    if (!node) return;
    ScrollTrigger.create({
      containerAnimation: move,
      trigger: panel,
      start: "left 55%",
      onToggle: ({ isActive }) => {
        node.toggleAttribute("data-reached", isActive);
      },
      end: "max",
    });
  });

  gsap.to(chapter.querySelectorAll("[data-graph-line]"), {
    strokeDashoffset: 0,
    ease: "none",
    stagger: 0.25,
    scrollTrigger: {
      containerAnimation: move,
      trigger: panels.at(-1),
      start: "left 90%",
      end: "right 106%",
      scrub: true,
    },
  });
}

/** Flow leaves to the left and the next chapter comes in from the right, as its next panel. */
function handOver(from: HTMLElement, to: HTMLElement) {
  const fromStage = from.querySelector("[data-stage]");
  const toStage = to.querySelector("[data-stage]");
  const scene = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: to,
      start: "top top",
      end: () => `+=${window.innerHeight}`,
      scrub: follow(),
    },
  });
  gsap.set(toStage, { xPercent: 100 });
  scene.to(toStage, { xPercent: 0 }, 0).to(fromStage, { xPercent: -100 }, 0);
}

/**
 * While a work fills the screen, the capsule takes its theme and marks its page. It is colour
 * rather than motion, so it stays with reduced motion too.
 */
function lendTheme(chapters: HTMLElement[], after: HTMLElement | null) {
  const root = document.documentElement;
  const capsule = document.querySelector<HTMLElement>("[data-capsule]");
  let marks: { at: number; world?: string }[] = [];
  let shown: string | undefined;

  const measure = () => {
    const half = window.innerHeight / 2;
    marks = chapters.map((chapter) => ({
      at:
        toTop(chapter) +
        ((chapter.previousElementSibling as HTMLElement | null)?.dataset.axis === "x"
          ? half
          : -half),
      world: chapter.dataset.chapter,
    }));
    if (after) marks.push({ at: toTop(after) - half });
  };
  const apply = (scroll: number) => {
    const world = marks.findLast(({ at }) => scroll >= at)?.world;
    if (world === shown) return;
    shown = world;
    if (world) {
      root.dataset.scene = world;
      if (capsule) capsule.dataset.tint = world;
    } else {
      delete root.dataset.scene;
      if (capsule) delete capsule.dataset.tint;
    }
  };

  const watch = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      apply(self.scroll());
    },
    onRefresh: (self) => {
      measure();
      apply(self.scroll());
    },
  });
  return () => {
    watch.kill();
    delete root.dataset.scene;
    if (capsule) delete capsule.dataset.tint;
  };
}

/**
 * Directs the three chapters. Stages hold by CSS `sticky` and the page scrolls natively; with
 * reduced motion or no script the chapters are plain sections, and only the capsule's colour follows.
 */
export function WorkScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]", scope.current);
      const after = document.querySelector<HTMLElement>("[data-after-work]");
      const under = document.querySelector<HTMLElement>("[data-under]");
      const stage = (chapter: HTMLElement | undefined) =>
        chapter?.querySelector<HTMLElement>("[data-stage]") ?? null;
      const undoTheme = lendTheme(chapters, after);

      const motion = gsap.matchMedia();
      motion.add(MOTION_ALLOWED, () => {
        const [pora, flow, projects] = chapters;
        if (!pora || !flow || !projects || !after) return;

        const undoPora = runStops(
          pora,
          () => "top top",
          () => `+=${pora.offsetHeight - 2 * window.innerHeight}`,
          false,
        );
        runTrack(flow);
        handOver(flow, projects);
        const undoProjects = runStops(
          projects,
          () => `top top-=${window.innerHeight}`,
          () => `+=${projects.offsetHeight - 3 * window.innerHeight}`,
          true,
        );

        const poraStage = stage(pora);
        const flowStage = stage(flow);
        // On a phone the story is a long column: sinking it would throw its end far up the page.
        const sinking = window.matchMedia(WIDE_SCREEN).matches ? under : null;
        if (poraStage) rise(pora, poraStage, sinking);
        if (flowStage) rise(flow, flowStage, poraStage);
        rise(after, after, stage(projects));
        return () => {
          undoPora();
          undoProjects();
        };
      });

      return () => {
        undoTheme();
        motion.revert();
      };
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}

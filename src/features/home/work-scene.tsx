"use client";

import { useRef, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger } from "@/motion/gsap";
import { undo, useScene } from "@/motion/scene";
import { SCENE } from "@/motion/tokens";

import { snapToRests } from "./chapter-snap";
import { runDesk } from "./desk-scene";
import { runFlowMap } from "./flow-map-scene";
import { pairFlight } from "./pair-scene";

/** The corners of a sheet rising over the page, and how far what it covers sinks. */
const SHEET = { radius: "2rem", sunk: 0.93, dimmed: 0.55, lastStretch: 0.06 };

/** Both, so that a window or a tablet crossing the line builds the scene again. */
const WIDTHS = {
  wide: `${MOTION_ALLOWED} and (min-width: 64rem)`,
  narrow: `${MOTION_ALLOWED} and (width < 64rem)`,
};

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

/**
 * A sheet coming up over a stage: its corners straighten, and what it covers sinks. A changing
 * corner repaints the whole sheet on every frame, which a phone cannot afford for a screen of
 * scroll: there the corners stay round and straighten only over the last stretch, at the top.
 */
function rise(sheet: HTMLElement, rounded: HTMLElement, under: HTMLElement | null) {
  const scene = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: sheet, start: "top bottom", end: "top top", scrub: true },
  });
  const straighten = ScrollTrigger.isTouch === 1 ? SHEET.lastStretch : 1;
  scene.fromTo(
    rounded,
    { borderTopLeftRadius: SHEET.radius, borderTopRightRadius: SHEET.radius },
    { borderTopLeftRadius: 0, borderTopRightRadius: 0, duration: straighten },
    1 - straighten,
  );
  if (under) scene.to(under, { scale: SHEET.sunk, opacity: SHEET.dimmed, duration: 1 }, 0);
}

/** What a chapter adds to its stops' timeline, given when each stop arrives: and what takes it down. */
type StopsExtra = (scene: gsap.core.Timeline, arrivals: readonly number[]) => () => void;

/**
 * Stops one over another, resting long enough to read: the old one leaves upward and the new one
 * comes from below. `extra` lays a chapter's own motion over the same timeline.
 */
function runStops(
  chapter: HTMLElement,
  start: () => string,
  end: () => string,
  extra?: StopsExtra,
) {
  const stops = gsap.utils.toArray<HTMLElement>("[data-stop]", chapter);
  const progress = chapter.querySelector("[data-chapter-progress]");
  const mark = marker(chapter);
  const part = (stop: HTMLElement | undefined, name: "copy" | "visual") =>
    stop?.querySelector(`[data-stop-${name}]`) ?? null;
  const arrivals = [0];
  let snap: ReturnType<typeof snapToRests> | null = null;

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
      onRefresh: () => {
        snap?.place();
      },
    },
  });

  scene.addLabel("stop-0").to({}, { duration: SCENE.rest });
  stops.slice(1).forEach((stop, index) => {
    const leaving = stops[index];
    const at = scene.duration();
    scene.to(part(leaving, "copy"), { yPercent: -35, opacity: 0, duration: LEAVING }, at);
    scene.to(part(leaving, "visual"), { yPercent: -45, opacity: 0, duration: LEAVING }, at);
    scene.fromTo(
      part(stop, "copy"),
      { yPercent: 35, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: LEAVING },
      at + 1 - LEAVING,
    );
    scene.fromTo(
      part(stop, "visual"),
      { yPercent: 60, scale: 0.94, opacity: 0 },
      { yPercent: 0, scale: 1, opacity: 1, duration: 1 },
      at,
    );
    arrivals.push(at + 1);
    scene.addLabel(`stop-${index + 1}`, at + 1).to({}, { duration: SCENE.rest }, at + 1);
  });
  const undoExtra = extra?.(scene, arrivals);
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
  // Each stop rests from its label for `SCENE.rest`: a flick settles a third of the way in.
  snap = snapToRests(chapter, () => {
    const trigger = scene.scrollTrigger;
    if (!trigger) return [];
    return stops.map((_, index) => {
      const at = (scene.labels[`stop-${String(index)}`] ?? 0) + SCENE.rest * 0.3;
      return trigger.start + (at / scene.duration()) * (trigger.end - trigger.start);
    });
  });
  return () => {
    chapter.removeEventListener("focusin", meet);
    snap.undo();
    undoExtra?.();
  };
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
 * While a work fills the screen, the capsule takes its theme; the page it marks stays the one the
 * reader is on. It is colour rather than motion, so it stays with reduced motion too.
 */
function lendTheme(chapters: HTMLElement[], after: HTMLElement | null) {
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
      if (capsule) capsule.dataset.tint = world;
    } else if (capsule) {
      delete capsule.dataset.tint;
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
    if (capsule) delete capsule.dataset.tint;
  };
}

/**
 * Directs the three chapters. Stages hold by CSS `sticky` and the page scrolls natively; with
 * reduced motion or no script the chapters are plain sections, and only the capsule's colour follows.
 */
export function WorkScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useScene(() => {
    const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]", scope.current);
    const after = document.querySelector<HTMLElement>("[data-after-work]");
    const under = document.querySelector<HTMLElement>("[data-under]");
    const stage = (chapter: HTMLElement | undefined) =>
      chapter?.querySelector<HTMLElement>("[data-stage]") ?? null;
    const undoTheme = lendTheme(chapters, after);

    const motion = gsap.matchMedia();
    motion.add(WIDTHS, ({ conditions }) => {
      const [pora, flow, projects] = chapters;
      if (!pora || !flow || !projects || !after) return;

      const undoPora = runStops(
        pora,
        () => "top top",
        () => `+=${pora.offsetHeight - 2 * window.innerHeight}`,
        pairFlight(pora),
      );
      const undoFlow = runFlowMap(flow, follow());
      handOver(flow, projects);
      const undoProjects = runDesk(
        projects,
        () => `top top-=${String(window.innerHeight)}`,
        () => `+=${String(projects.offsetHeight - 3 * window.innerHeight)}`,
        follow(),
      );

      const poraStage = stage(pora);
      const flowStage = stage(flow);
      // On a phone the story is a long column: sinking it would throw its end far up the page.
      const sinking = conditions?.wide ? under : null;
      if (poraStage) rise(pora, poraStage, sinking);
      if (flowStage) rise(flow, flowStage, poraStage);
      rise(after, after, stage(projects));
      return () => {
        undoPora();
        undoFlow();
        undoProjects();
      };
    });

    return () => {
      undoTheme();
      undo(motion);
    };
  }, scope);

  return <div ref={scope}>{children}</div>;
}

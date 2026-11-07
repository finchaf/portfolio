import { gsap, ScrollTrigger } from "@/motion/gsap";

import { scrubFollow } from "./scrub-follow";
import { branchRoutes, type Line } from "./story-branches";
import { FORK_HOLD, RIBBON_HOLD } from "./story-data";
import {
  clearTheScreen,
  countUp,
  CURRENT_AT,
  dealMenus,
  dealScraps,
  type Mark,
  moveLines,
  revealOnce,
  runRuler,
  runScore,
} from "./story-moves";

/** How fast the ruler slides, as a share of the ribbon. */
const RULER_PACE = 0.35;

/** How far a full-height photograph slides inside its frame, in percent of its width. */
const BLEED_SLIDE = 5.5;

/** The share of a line the pen has drawn when its words start to arrive, and how far they rise, px. */
const LABEL_ARRIVES = 0.86;
const LABEL_RISE = 10;

/** The share of the ribbon's hold the pen spends drawing: the rest is for reading. */
const DRAWING = 0.78;

/** The share of the fork's stay the score spends on its way: the rest is for looking at it. */
const SCORING = 0.92;

/** How many screens of the ribbon ahead its pictures are asked for. */
const AHEAD = 2.5;

/**
 * One pen draws every line of the last chapter at one speed: the trunk comes in from the left, and a
 * line starts when the pen reaches its fork. So nothing fades in, and the lines grow out of each other.
 */
function drawBranches(section: HTMLElement, scrollTrigger: ScrollTrigger.Vars) {
  const graph = section.querySelector<SVGSVGElement>("[data-graph]");
  if (!graph) return { trigger: undefined, stop: () => undefined };
  const circle = (name: string) => graph.querySelector(`[data-node="${name}"]`);
  const label = (name: string) => section.querySelector<HTMLElement>(`[data-branch="${name}"]`);

  // The words and the two lights of each line are found once, on a layout, not on every frame.
  let lines: {
    path: SVGPathElement;
    length: number;
    from: number;
    line: Line;
    words: HTMLElement | null;
    fork: Element | null;
    tip: Element | null;
  }[] = [];
  let reach = 1;
  const pen = { done: 0 };

  // Visibility, not opacity: the light at the end of the first line pulses by its opacity.
  const show = (node: Element | null, shown: boolean) => {
    node?.setAttribute("visibility", shown ? "visible" : "hidden");
  };
  const draw = () => {
    const at = pen.done * reach;
    lines.forEach(({ path, length, from, line, words, fork, tip }) => {
      const drawn = gsap.utils.clamp(0, length, at - from);
      path.style.strokeDashoffset = String(length - drawn);
      if (line === "trunk") return;
      const near = gsap.utils.clamp(0, 1, (drawn / length - LABEL_ARRIVES) / (1 - LABEL_ARRIVES));
      if (words) {
        words.style.opacity = String(near);
        words.style.transform = `translateY(${String((1 - near) * LABEL_RISE)}px)`;
      }
      show(fork, drawn > 0);
      show(tip, drawn >= length);
    });
  };
  const layout = () => {
    const { routes, forks, tips } = branchRoutes(graph.clientWidth, graph.clientHeight);
    lines = routes.flatMap(({ line, d, from }) => {
      const path = graph.querySelector<SVGPathElement>(`[data-line="${line}"]`);
      if (!path) return [];
      path.setAttribute("d", d);
      graph.querySelector(`[data-shape="${line}"]`)?.setAttribute("d", d);
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${String(length)} ${String(length + 2)}`;
      return [
        {
          path,
          length,
          from,
          line,
          words: label(line),
          fork: circle(`fork-${line}`),
          tip: circle(`tip-${line}`),
        },
      ];
    });
    reach = Math.max(...lines.map(({ from, length }) => from + length));
    (["open", "masters"] as const).forEach((line) => {
      circle(`fork-${line}`)?.setAttribute("cx", String(forks[line].x));
      circle(`fork-${line}`)?.setAttribute("cy", String(forks[line].y));
      circle(`tip-${line}`)?.setAttribute("cx", String(tips[line].x));
      circle(`tip-${line}`)?.setAttribute("cy", String(tips[line].y));
    });
    draw();
  };

  layout();
  ScrollTrigger.addEventListener("refresh", layout);
  const drawing = gsap.to(pen, {
    done: 1,
    ease: "none",
    onUpdate: draw,
    scrollTrigger: { ...scrollTrigger, scrub: scrubFollow(), invalidateOnRefresh: true },
  });
  return {
    trigger: drawing.scrollTrigger,
    stop: () => {
      ScrollTrigger.removeEventListener("refresh", layout);
      gsap.utils.toArray<HTMLElement>("[data-branch]", section).forEach((words) => {
        words.style.removeProperty("opacity");
        words.style.removeProperty("transform");
      });
    },
  };
}

/**
 * The ribbon only ever runs straight on, and everything along it hangs on that. So the fork stands
 * still another way: its chapter is wider by the length of the stay, and what is in it goes along
 * with the ribbon by exactly as much, written in the ribbon's own frame so nothing can shake.
 */
function holdTheFork(section: HTMLElement, track: HTMLElement) {
  const stay = section.querySelector<HTMLElement>("[data-stay]");
  const chapter = stay?.parentElement;
  const score = runScore(section);
  if (!stay || !chapter) {
    return {
      pass: () => undefined,
      held: () => 0,
      stop: () => {
        score?.stop();
      },
    };
  }
  const place = gsap.quickSetter(stay, "x", "px") as (value: number) => void;
  let begins = 0;
  let held = 0;
  const measure = () => {
    begins = chapter.getBoundingClientRect().left - track.getBoundingClientRect().left;
  };
  measure();
  ScrollTrigger.addEventListener("refresh", measure);
  return {
    /** Where the ribbon has come to, in pixels. */
    pass: (travelled: number) => {
      const room = FORK_HOLD * window.innerWidth;
      held = gsap.utils.clamp(0, room, travelled - begins);
      place(held);
      score?.draw(Math.min(held / (room * SCORING), 1));
    },
    held: () => held,
    stop: () => {
      ScrollTrigger.removeEventListener("refresh", measure);
      score?.stop();
      gsap.set(stay, { clearProps: "transform" });
    },
  };
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
 * there too late: the chapters ahead are asked for early, and only once the story is near. The
 * reach is counted from where the scroll sends the ribbon, not only from where it stands: after a
 * jump the scrub is still on its way, and no scroll comes when it gets there.
 */
function wakeAhead(
  section: HTMLElement,
  track: HTMLElement,
  move: gsap.core.Tween,
  distance: () => number,
) {
  // A chapter is woken once and leaves the list: what is left is still asleep.
  let asleep = gsap.utils.toArray<HTMLElement>("[data-collage], [data-chapter-of-story]", section);
  const heading = () => {
    const along = move.scrollTrigger;
    if (!along) return 0;
    const share = (along.scroll() - along.start) / Math.max(1, along.end - along.start);
    return gsap.utils.clamp(0, 1, share) * distance();
  };
  const wake = () => {
    if (asleep.length === 0) return;
    const passed = Math.max(-Number(gsap.getProperty(track, "x")), heading());
    const reach = AHEAD * window.innerWidth + passed;
    asleep = asleep.filter((chapter) => {
      if (chapter.offsetLeft > reach) return true;
      chapter.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
      });
      return false;
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

/** The page scrolls down and the ribbon goes left, one pixel of ribbon to a fixed share of scroll. */
export function runRibbon(section: HTMLElement, track: HTMLElement, mark: Mark) {
  const distance = () => track.scrollWidth - window.innerWidth;
  const hold = () => RIBBON_HOLD * window.innerHeight;
  // The last screen of the section stays behind the works rising over it, and the ribbon stops
  // a hold before that, for the branches.
  const ride = () => section.offsetHeight - 2 * window.innerHeight - hold();
  const along = {
    trigger: section,
    start: "top top",
    end: () => `+=${String(ride())}`,
    scrub: scrubFollow(),
    invalidateOnRefresh: true,
  };
  const fork = holdTheFork(section, track);
  const travelled = () => move.progress() * distance();
  const move = gsap.to(track, { x: () => -distance(), ease: "none", scrollTrigger: along });
  move.eventCallback("onUpdate", () => {
    fork.pass(travelled());
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

  dealMenus(section, (view) => ({
    containerAnimation: move,
    trigger: view,
    start: "left 88%",
    end: "left 32%",
  }));
  dealScraps(section, { trigger: section, start: "top 58%", end: "top -14%" });
  const branches = drawBranches(section, {
    trigger: section,
    start: () => `top top-=${String(ride())}`,
    end: () => `top top-=${String(ride() + hold() * DRAWING)}`,
  });
  // Opacity alone hides the branches, so the keyboard can reach them: the pen comes to meet the
  // focus, and the words arrive with it. A press of the mouse lands on words already drawn, and a
  // jump under it would take the link from under the pointer.
  const meet = (event: FocusEvent) => {
    const target = event.target as Element;
    const trigger = branches.trigger;
    if (!trigger || !target.closest("[data-branch]") || !target.matches(":focus-visible")) return;
    window.scrollTo({ top: trigger.end, behavior: "instant" });
  };
  section.addEventListener("focusin", meet);
  const showShell = clearTheScreen(section, (run) => ({
    containerAnimation: move,
    trigger: run,
    start: "left 35%",
    end: "right 65%",
  }));
  const resetNumbers = countUp(section, (element) => ({
    containerAnimation: move,
    trigger: element,
    start: "left 85%",
  }));
  slideBleeds(section, move);
  wakeAhead(section, track, move, distance);
  const stopLines = moveLines(
    section,
    (element) => ({
      containerAnimation: move,
      trigger: element,
      start: "left right",
      end: "right left",
    }),
    (chapter) => ({
      containerAnimation: move,
      trigger: chapter,
      start: "left right",
      end: "left left",
    }),
  );
  const stopRuler = runRuler(
    section,
    () => (travelled() - fork.held()) * RULER_PACE,
    gsap.utils.toArray("[data-ruler-band]", section),
  );

  return () => {
    section.removeEventListener("focusin", meet);
    fork.stop();
    branches.stop();
    stopLines();
    stopRuler();
    showShell();
    resetNumbers();
  };
}

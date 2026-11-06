import { gsap, ScrollTrigger } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

/** Where the lesson is on each stop, and the form it takes there: none on the last, it stays put. */
const PATH = [
  { hold: "hero", form: "web" },
  { hold: "web", form: "web" },
  { hold: "la", form: "la" },
  { hold: "android", form: "android" },
  { hold: "clash", form: "web" },
  { hold: null, form: null },
] as const;

/** On the editor's stop the lesson first clashes, then moves to the free slot: shares of the rest. */
const CLASH = { from: 0.18, to: 0.7 };

/**
 * Each form's corner, as a share of its width, measured on the frames: the web card draws its own
 * round, the Live Activity's is 66 px of 1123, Android's card's 84 px of 1184.
 */
const CORNER = { web: 0, la: 0.059, android: 0.071 } as const;

/** The editor's stop: from its arrival the verdict is on the frame, the clash first. */
const EDITOR = 4;

/** A form is half one and half the other only in the middle of a flight. */
const CROSS = { from: 0.3, to: 0.72 };

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const between = (a: number, b: number, at: number) => a + (b - a) * at;
const share = (at: number, from: number, to: number) =>
  Math.min(Math.max((at - from) / (to - from), 0), 1);

/**
 * The flight of the lesson through «Пора на пару». A stop's place is read from the layout, not from
 * the screen, so a frame on its way in does not move it: when a stop rests, the lesson sits exactly
 * on its place. Between two stops the card's frame changes size and corner, and one form gives way
 * to the next. Returns what joins the chapter's timeline and what takes it down.
 */
export function pairFlight(chapter: HTMLElement) {
  const stage = chapter.querySelector<HTMLElement>("[data-stage]");
  const fly = chapter.querySelector<HTMLElement>("[data-pair-fly]");
  const cut = fly?.querySelector<HTMLElement>("[data-pair-forms]");
  if (!stage || !fly || !cut) return undefined;
  const forms = new Map(
    gsap.utils
      .toArray<HTMLElement>("[data-pair-form]", fly)
      .map((form) => [form.dataset.pairForm ?? "", form]),
  );
  const holds = new Map(
    gsap.utils
      .toArray<HTMLElement>("[data-pair-hold]", chapter)
      .map((hold) => [hold.dataset.pairHold ?? "", hold]),
  );
  const boxes = new Map<string, Box>();
  const state = { at: 0, clash: 0 };
  /** What the chapter last said of the lesson: written again only when it changes. */
  let said = { landed: false, verdict: "" };

  /** A place where the layout puts it, transforms aside: the scene moves frames, not places. */
  const measure = () => {
    for (const [name, hold] of holds) {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = hold;
      while (node && node !== stage) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      boxes.set(name, { x, y, w: hold.offsetWidth, h: hold.offsetHeight });
    }
  };

  const boxOf = (stop: number): Box | undefined => {
    const hold = PATH[stop]?.hold;
    if (!hold) return undefined;
    const box = boxes.get(hold);
    // The editor's lesson goes from the clash to the free slot within the stop's rest.
    const free = boxes.get("free");
    if (hold === "clash" && box && free && state.clash > 0) {
      return {
        x: between(box.x, free.x, state.clash),
        y: between(box.y, free.y, state.clash),
        w: between(box.w, free.w, state.clash),
        h: between(box.h, free.h, state.clash),
      };
    }
    return box;
  };

  const paint = () => {
    // Published, the lesson stays in the editor's week: the card the frame holds takes its place
    // and leaves with the frame, as any other lesson of that week.
    const landed = state.at > EDITOR;
    const verdict = state.at < EDITOR - 0.05 ? "" : state.clash < 0.5 ? "clash" : "published";
    if (landed !== said.landed || verdict !== said.verdict) {
      said = { landed, verdict };
      chapter.toggleAttribute("data-pair-landed", landed);
      if (verdict) chapter.dataset.pairState = verdict;
      else delete chapter.dataset.pairState;
    }
    const stop = Math.min(Math.floor(state.at), PATH.length - 1);
    const flight = state.at - stop;
    const from = boxOf(stop);
    const to = boxOf(Math.min(stop + 1, PATH.length - 1)) ?? from;
    if (!from || !to || landed) {
      fly.style.opacity = "0";
      return;
    }
    const eased = SCENE_EASE(flight);
    const box = {
      x: between(from.x, to.x, eased),
      y: between(from.y, to.y, eased),
      w: between(from.w, to.w, eased),
      h: between(from.h, to.h, eased),
    };
    const leaving = PATH[stop]?.form ?? null;
    const coming = PATH[Math.min(stop + 1, PATH.length - 1)]?.form ?? null;
    const cross = share(flight, CROSS.from, CROSS.to);
    for (const [name, form] of forms) {
      const weight = (name === leaving ? 1 - cross : 0) + (name === coming ? cross : 0);
      form.style.opacity = String(leaving === coming && name === leaving ? 1 : weight);
    }
    const corner =
      between(leaving ? CORNER[leaving] : 0, coming ? CORNER[coming] : 0, cross) * box.w;
    fly.style.opacity = "1";
    fly.style.transform = `translate3d(${box.x.toFixed(1)}px, ${box.y.toFixed(1)}px, 0)`;
    fly.style.width = `${box.w.toFixed(1)}px`;
    fly.style.height = `${box.h.toFixed(1)}px`;
    cut.style.borderRadius = `${corner.toFixed(1)}px`;
    // Lifted off the page on the first stop, laid into each frame after it.
    fly.style.setProperty("--pair-lift", (stop === 0 ? 1 - eased : 0).toFixed(3));
  };

  const refresh = () => {
    measure();
    paint();
  };

  /** Joins the chapter's timeline: a flight between every two stops, the clash on the editor's. */
  return (scene: gsap.core.Timeline, arrivals: readonly number[]) => {
    chapter.toggleAttribute("data-pair-live", true);
    measure();
    arrivals.slice(1).forEach((arrival, index) => {
      scene.fromTo(
        state,
        { at: index },
        { at: index + 1, duration: 1, ease: "none", immediateRender: false, onUpdate: paint },
        arrival - 1,
      );
    });
    const editor = arrivals[EDITOR];
    if (editor !== undefined) {
      scene.fromTo(
        state,
        { clash: 0 },
        {
          clash: 1,
          duration: SCENE.rest * (CLASH.to - CLASH.from),
          ease: SCENE.move,
          immediateRender: false,
          onUpdate: paint,
        },
        editor + SCENE.rest * CLASH.from,
      );
    }
    ScrollTrigger.addEventListener("refresh", refresh);
    paint();
    return () => {
      ScrollTrigger.removeEventListener("refresh", refresh);
      chapter.toggleAttribute("data-pair-live", false);
      chapter.toggleAttribute("data-pair-landed", false);
      delete chapter.dataset.pairState;
      said = { landed: false, verdict: "" };
      fly.removeAttribute("style");
      cut.removeAttribute("style");
      for (const form of forms.values()) form.removeAttribute("style");
    };
  };
}

/** The curve of a flight: the scene's own, as a function of how far the flight has gone. */
const SCENE_EASE = gsap.parseEase(SCENE.move);

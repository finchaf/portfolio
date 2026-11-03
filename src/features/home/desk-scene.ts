import { gsap } from "@/motion/gsap";

import { snapToRests } from "./chapter-snap";
import {
  DESK_STOPS,
  deskMomentAt,
  deskProgressOf,
  LAST_DESK_STOP,
  STOP_OF_TICK,
  TICK_OF,
  type DeskMoment,
} from "./desk-stops";

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const mix = (from: number, to: number, share: number) => from + (to - from) * share;
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * What the camera frames at each stop, in the board's own units, and how much room it leaves
 * around it. A section keeps its label in the shot.
 */
const SHOTS = [
  { kind: "all", pad: 0.04 },
  { kind: "sec", key: "portfolio", pad: 0.05 },
  { kind: "frame", key: "themes", pad: 0.1 },
  { kind: "sec", key: "latex", pad: 0.05 },
  { kind: "frame", key: "wall", pad: 0.08 },
] as const;

/** The height of a section's label over the section, in board units. */
const LABEL = 44;

/** How far the camera pulls back on a long flight, in steps of its zoom's logarithm. */
const PULL_BACK = 0.55;

/** How much closer it creeps during a rest, so a stop is never quite still. */
const CREEP = 0.03;

/** How much of a flight the old words take to leave, and when the new ones count as arrived. */
const LEAVING = 0.65;
const ARRIVING = 0.25;

interface Shot {
  x: number;
  y: number;
  z: number;
  /** Where on the screen the shot is centred: below its own words on a phone. */
  cx: number;
  cy: number;
  /** How much of the top the words of its stop take, which the board fades under. */
  words: number;
}

/**
 * The Projects chapter as a camera over the board. The scroll moves one number; from it the
 * camera frames a stop or flies between two, pulling back when they lie far apart, the words of
 * the stop come and go as in the other chapters, and the status line says where the camera is
 * and how close. Selection, labels and handles are the board's own, set to the camera's scale.
 */
export function runDesk(
  chapter: HTMLElement,
  start: () => string,
  end: () => string,
  scrub: number | boolean,
) {
  const desk = chapter.querySelector<HTMLElement>("[data-desk]");
  const view = chapter.querySelector<HTMLElement>("[data-desk-view]");
  const world = chapter.querySelector<HTMLElement>("[data-desk-world]");
  const focus = chapter.querySelector<HTMLElement>("[data-desk-focus]");
  if (!desk || !view || !world || !focus) return () => undefined;
  const board = world;
  const copies = gsap.utils.toArray<HTMLElement>("[data-desk-copy]", chapter);
  const crumbs = gsap.utils.toArray<HTMLElement>("[data-crumb]", chapter);
  const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", chapter);
  const zoom = chapter.querySelector<HTMLElement>("[data-desk-zoom]");
  const progressBar = chapter.querySelector<HTMLElement>("[data-chapter-progress]");
  const list = copies[0]?.parentElement ?? null;

  let shots: Shot[] = [];
  let snap: ReturnType<typeof snapToRests> | null = null;
  let shown = -1;
  let shownZoom = "";
  let focusWidth = 1;
  let heights: number[] = [];
  /** Where the board starts to show under the words on a phone, this frame. */
  let fade = 0;

  const target = (index: number) => {
    const shot = SHOTS[index];
    if (!shot || shot.kind === "all") return null;
    return board.querySelector<HTMLElement>(
      shot.kind === "sec" ? `[data-sec="${shot.key}"]` : `[data-frame="${shot.key}"]`,
    );
  };

  /** A stop's box in board units: layout offsets, which the camera's transform leaves alone. */
  function boxOf(index: number) {
    const shot = SHOTS[index] ?? SHOTS[0];
    const node = target(index);
    let rect = { x: 0, y: -LABEL, width: board.offsetWidth, height: board.offsetHeight + LABEL };
    if (node) {
      const section = node.offsetParent === board ? null : (node.offsetParent as HTMLElement);
      const top = shot.kind === "sec" ? LABEL : 0;
      rect = {
        x: node.offsetLeft + (section?.offsetLeft ?? 0),
        y: node.offsetTop + (section?.offsetTop ?? 0) - top,
        width: node.offsetWidth,
        height: node.offsetHeight + top,
      };
    }
    return {
      x: rect.x - rect.width * shot.pad,
      y: rect.y - rect.height * shot.pad,
      width: rect.width * (1 + 2 * shot.pad),
      height: rect.height * (1 + 2 * shot.pad),
    };
  }

  /** On a phone the words take the room their longest stop needs, and the board takes the rest. */
  function fitWords() {
    heights = [];
    desk?.style.removeProperty("--desk-words");
    desk?.style.removeProperty("--desk-fade");
    if (!list || window.innerWidth >= 1024) return;
    list.style.height = "1px";
    // The bottom of the last thing said: a scroll height stops at the box, which is 1px here.
    heights = copies.map((copy) =>
      Math.ceil(
        Math.max(
          0,
          ...Array.from(copy.children, (child) => {
            const node = child as HTMLElement;
            return node.offsetTop + node.offsetHeight;
          }),
        ),
      ),
    );
    list.style.removeProperty("height");
    desk?.style.setProperty("--desk-words", `${String(Math.max(...heights))}px`);
  }

  function measure() {
    fitWords();
    // Offsets, not boxes: the stage may be sliding in or sinking under the next sheet.
    if (!view || !focus) return;
    const tallest = Math.max(0, ...heights);
    focusWidth = Math.max(1, focus.offsetWidth);
    shots = SHOTS.map((_, index) => {
      // The focus is drawn below the longest words; a stop with shorter ones lends the board the rest.
      const spare = heights.length > 0 ? tallest - (heights[index] ?? tallest) : 0;
      const box = {
        x: focus.offsetLeft - view.offsetLeft,
        y: focus.offsetTop - view.offsetTop - spare,
        width: focusWidth,
        height: Math.max(1, focus.offsetHeight + spare),
      };
      const rect = boxOf(index);
      const z = Math.min(box.width / rect.width, box.height / rect.height);
      return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        z,
        cx: box.x + box.width / 2,
        cy: box.y + box.height / 2,
        words: heights[index] ?? 0,
      };
    });
    shown = -1;
  }

  /** The camera between two shots, a share of the way along. */
  function place(from: Shot, to: Shot, along: number, creep: number) {
    const share = inOut(along);
    const far = (Math.hypot(to.x - from.x, to.y - from.y) * Math.min(from.z, to.z)) / focusWidth;
    const back = clamp(far - 0.25, 0, 1.1) * PULL_BACK * Math.sin(Math.PI * share);
    const z = Math.exp(mix(Math.log(from.z), Math.log(to.z), share) - back) * creep;
    // On a phone the board makes room before longer words arrive, and takes it back only after
    // longer words have gone: the two never meet.
    const room =
      to.words > from.words
        ? inOut(clamp(along / (1 - LEAVING)))
        : inOut(clamp((along - LEAVING) / (1 - LEAVING)));
    const x = mix(from.cx, to.cx, share) - z * mix(from.x, to.x, share);
    const y = mix(from.cy, to.cy, room) - z * mix(from.y, to.y, share);
    fade = mix(from.words, to.words, room);
    world?.style.setProperty(
      "transform",
      `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${z.toFixed(4)})`,
    );
    world?.style.setProperty("--z", z.toFixed(4));
    const percent = `${String(Math.round(z * 100))}%`;
    if (zoom && percent !== shownZoom) {
      shownZoom = percent;
      zoom.textContent = percent;
    }
  }

  /** Words slide by a share of their room: on a phone a short way, past the board below them. */
  function words({ stop, move }: DeskMoment) {
    const phone = heights.length > 0;
    const travel = phone ? 12 : 35;
    const room = list?.offsetHeight ?? 0;
    copies.forEach((copy, index) => {
      let opacity = index === stop && move === 0 ? 1 : 0;
      let shift = 0;
      if (move > 0 && index === stop) {
        const gone = inOut(clamp(move / LEAVING));
        opacity = 1 - gone;
        shift = -travel * gone;
      } else if (move > 0 && index === stop + 1) {
        const come = inOut(clamp((move - (1 - LEAVING)) / LEAVING));
        opacity = come;
        shift = travel * (1 - come);
      }
      copy.style.opacity = opacity.toFixed(3);
      copy.style.transform = shift ? `translate3d(0,${shift.toFixed(2)}%,0)` : "";
      // The board fades in below whatever words are still on the screen.
      if (phone && opacity > 0.02) {
        fade = Math.max(fade, (heights[index] ?? 0) + (shift / 100) * room);
      }
    });
    if (phone) desk?.style.setProperty("--desk-fade", `${fade.toFixed(1)}px`);
  }

  function mark(stop: number) {
    if (stop === shown) return;
    shown = stop;
    for (const node of world?.querySelectorAll("[data-selected]") ?? []) {
      node.removeAttribute("data-selected");
    }
    target(stop)?.setAttribute("data-selected", "");
    crumbs.forEach((crumb, index) => {
      crumb.toggleAttribute("data-active", index === stop);
    });
    ticks.forEach((tick, index) => {
      tick.toggleAttribute("data-active", index === TICK_OF[stop]);
    });
    copies.forEach((copy, index) => {
      copy.toggleAttribute("data-active", index === stop);
    });
  }

  function render(progress: number) {
    if (shots.length === 0) return;
    const moment = deskMomentAt(progress);
    const { stop, move, rest } = moment;
    const next = Math.min(stop + 1, LAST_DESK_STOP);
    const from = shots[stop] as Shot;
    if (move > 0) place(from, shots[next] as Shot, move, 1 + CREEP * (1 - move));
    else place(from, from, 0, 1 + CREEP * rest);
    words(moment);
    mark(move >= 1 - ARRIVING ? next : stop);
    progressBar?.style.setProperty("transform", `scaleX(${progress.toFixed(4)})`);
  }

  const scroll = { progress: 0 };
  const scene = gsap.to(scroll, {
    progress: 1,
    ease: "none",
    onUpdate: () => {
      render(scroll.progress);
    },
    scrollTrigger: {
      trigger: chapter,
      start,
      end,
      scrub,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
        render(scroll.progress);
        snap?.place();
      },
    },
  });

  const to = (stop: number, behavior: ScrollBehavior) => {
    const trigger = scene.scrollTrigger;
    if (!trigger) return;
    window.scrollTo({ top: mix(trigger.start, trigger.end, deskProgressOf(stop)), behavior });
  };
  const onClick = (event: MouseEvent) => {
    const go = (event.target as Element).closest<HTMLElement>("[data-go]");
    if (go) to(STOP_OF_TICK[Number(go.dataset.go)] ?? 0, "smooth");
  };
  // Opacity alone hides a stop, so the keyboard can reach it: the scene comes to meet the focus.
  const onFocus = (event: FocusEvent) => {
    const copy = (event.target as Element).closest<HTMLElement>("[data-desk-copy]");
    const index = copy ? copies.indexOf(copy) : -1;
    if (index >= 0) to(index, "instant");
  };

  chapter.addEventListener("click", onClick);
  chapter.addEventListener("focusin", onFocus);
  snap = snapToRests(chapter, () => {
    const trigger = scene.scrollTrigger;
    if (!trigger) return [];
    return DESK_STOPS.map((_, stop) => mix(trigger.start, trigger.end, deskProgressOf(stop)));
  });
  void document.fonts.ready.then(() => {
    measure();
    render(scroll.progress);
  });
  measure();
  render(scroll.progress);

  return () => {
    snap.undo();
    chapter.removeEventListener("click", onClick);
    chapter.removeEventListener("focusin", onFocus);
    desk.style.removeProperty("--desk-words");
    world.removeAttribute("style");
    for (const node of [...copies, ...(progressBar ? [progressBar] : [])]) {
      node.removeAttribute("style");
    }
    for (const node of chapter.querySelectorAll("[data-selected]")) {
      node.removeAttribute("data-selected");
    }
  };
}

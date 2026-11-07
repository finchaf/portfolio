import { gsap, ScrollTrigger } from "@/motion/gsap";

import { snapToRests } from "./chapter-snap";
import {
  buildMap,
  LAST_STOP,
  momentAt,
  progressOf,
  settleMap,
  type MapNode,
} from "./flow-map-graph";

const TAU = Math.PI * 2;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const mix = (from: number, to: number, share: number) => from + (to - from) * share;
const between = (from: number, to: number, value: number) => clamp((value - from) / (to - from));
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const out = (t: number) => 1 - (1 - t) ** 3;

/** Overshoots a little and settles, so a fan of rules opens like a spring. */
const spring = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

const css = (value: number) => value.toFixed(2);
const shift = (x: number, y: number, scale = 1) =>
  `translate3d(${css(x)}px,${css(y)}px,0) scale(${scale.toFixed(4)})`;

/** How close the camera stands at each stop, and how far it pulls back between two of them. */
const ZOOM = [1, 1, 1, 1, 1, 1.75, 1] as const;
const PULL_BACK = 0.34;

/** How wide the line of the stops is, in widths of the screen. */
const SPAN = { wide: 0.6, narrow: 0.92 };

/** The size of a node's name, in pixels: its title grows out of it. */
const LABEL = 13;

/** How much of the graph goes from under the words. */
const WORDS = 0.88;

/** Stops with something that moves through their rest, and the share of the rest it takes. */
const STOP = { screens: 3, rule: 5, base: LAST_STOP };

interface Palette {
  accent: string;
  page: string;
  ink: string;
  dot: string;
  closed: string;
  hub: string;
  line: string;
  spine: string;
  text: string;
}

interface Piece {
  element: HTMLElement;
  x: number;
  y: number;
  /** Left edge: a hair stops there and the object carries on. */
  left: number;
  /** Words hang on no hair: a line must not cross them. */
  bare: boolean;
}

interface Line {
  element: HTMLElement;
}

interface Stop {
  node: MapNode;
  pieces: Piece[];
  lines: Line[];
  title: HTMLElement | null;
  titleAt: { x: number; y: number; width: number; scale: number };
  /** How much of the title is out of the node's name, this frame. */
  titled: number;
  /** The right and bottom edges of the words. */
  right: number;
  bottom: number;
}

interface Camera {
  focusX: number;
  focusY: number;
  left: number;
  length: number;
  height: number;
  middle: number;
  roundX: number;
  roundY: number;
  round: number;
  pen: number;
}

/** Everything the chapter's scene needs from the page, or null if the page changed under it. */
function parts(chapter: HTMLElement) {
  const stage = chapter.querySelector<HTMLElement>("[data-stage]");
  const canvas = chapter.querySelector<HTMLCanvasElement>("[data-map-canvas]");
  const context = canvas?.getContext("2d");
  const tip = chapter.querySelector<HTMLElement>("[data-map-tip]");
  if (!stage || !canvas || !context || !tip) return null;
  return { stage, canvas, context, tip };
}

/**
 * Flow as a flight along its graph. The scroll moves one number, and each frame draws from it: the
 * camera, the fans that open as the pen reaches them, the objects that leave their node along a
 * line, and at the end the strip of checklists gathering into the round base of the Flow page.
 */
export function runFlowMap(chapter: HTMLElement, scrub: number | boolean) {
  const found = parts(chapter);
  if (!found) return () => undefined;
  const { stage, canvas, context, tip } = found;
  const hubNames = JSON.parse(canvas.dataset.hubs ?? "{}") as Record<string, string>;
  const ticks = JSON.parse(canvas.dataset.ticks ?? "[]") as string[];
  const unit = canvas.dataset.unit ?? "";
  const map = buildMap(hubNames);
  const items = gsap.utils.toArray<HTMLElement>("[data-map-stop]", chapter);
  const stops: Stop[] = items.map((item, index) => ({
    node: map.stops[index] as MapNode,
    pieces: [],
    lines: gsap.utils.toArray<HTMLElement>("[data-map-line]", item).map((element) => ({ element })),
    title: item.querySelector("[data-map-title]"),
    titleAt: { x: 0, y: 0, width: 0, scale: 0.2 },
    titled: 0,
    right: 0,
    bottom: 0,
  }));
  const rail = gsap.utils.toArray<HTMLElement>("[data-tick]", chapter);
  const rungs = gsap.utils.toArray<HTMLElement>("[data-rung-row]", chapter);
  const ladder = chapter.querySelector<HTMLElement>("[data-rung]");
  const terminal = gsap.utils.toArray<HTMLElement>("[data-terminal] p", chapter);
  const counts = gsap.utils.toArray<HTMLElement>("[data-count]", chapter);
  const row = chapter.querySelector<HTMLElement>("[data-cut-row]");
  const cut = chapter.querySelector<HTMLElement>("[data-cut]");
  const phones = row ? gsap.utils.toArray<HTMLElement>(".map-phone", row) : [];
  const rungList = chapter.querySelector<HTMLElement>(".map-rungs");
  let rungsAt = { left: 0, top: 0, right: 0, bottom: 0 };

  const view = { width: 1, height: 1, ratio: 1, narrow: false };
  const scroll = { progress: 0 };
  const pointer = { x: -1, y: -1, on: false, nearX: -1, nearY: -1 };
  const pulses: { node: MapNode; start: number }[] = [];
  let colours: Palette | null = null;
  let hovered: MapNode | null = null;
  let around: Set<MapNode> | null = null;
  let beat = 0;
  let beatAt = 0;
  let lastStop = 0;
  let lastRung = -1;
  let drawn = -1;
  let camera: Camera | null = null;
  let snap: ReturnType<typeof snapToRests> | null = null;

  /** Reads the theme's colours as computed: `light-dark()` stays unresolved in a custom property. */
  function readColours() {
    const probe = document.createElement("i");
    probe.hidden = true;
    stage.append(probe);
    const read = (name: string) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color;
    };
    const page = read("--page");
    const dark = (page.match(/\d+/g)?.slice(0, 3) ?? []).every((part) => Number(part) < 128);
    const mark = dark ? "255,255,255" : "0,0,0";
    colours = {
      accent: read("--accent"),
      page,
      ink: read("--ink"),
      dot: `rgba(${mark},${dark ? "0.5" : "0.55"})`,
      closed: `rgba(${mark},${dark ? "0.3" : "0.3"})`,
      hub: `rgba(${mark},${dark ? "0.7" : "0.72"})`,
      line: `rgba(${mark},${dark ? "0.13" : "0.14"})`,
      spine: `rgba(${mark},${dark ? "0.26" : "0.22"})`,
      text: `rgba(${mark},0.72)`,
    };
    probe.remove();
    drawn = -1;
  }

  /** Where everything rests, read with the scene's transforms off. */
  function measure() {
    const box = stage.getBoundingClientRect();
    view.width = box.width;
    view.height = box.height;
    view.narrow = box.width < 1024;
    view.ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = box.width * view.ratio;
    canvas.height = box.height * view.ratio;
    const place = (element: HTMLElement) => {
      const { transform } = element.style;
      element.style.transform = "none";
      const rect = element.getBoundingClientRect();
      element.style.transform = transform;
      return rect;
    };
    stops.forEach((stop, index) => {
      const item = items[index] as HTMLElement;
      stop.pieces = gsap.utils
        .toArray<HTMLElement>("[data-piece]", item)
        .filter((element) => element.offsetWidth > 0)
        .map((element) => {
          const rect = place(element);
          return {
            element,
            x: rect.left + rect.width / 2 - box.left,
            y: rect.top + rect.height / 2 - box.top,
            left: rect.left - box.left,
            bare: element.dataset.piece === "bare",
          };
        });
      const words = item.querySelector(".map-copy")?.getBoundingClientRect();
      stop.right = (words?.right ?? 0) - box.left;
      stop.bottom = (words?.bottom ?? 0) - box.top;
      if (stop.title) {
        const rect = place(stop.title);
        const size = parseFloat(getComputedStyle(stop.title).fontSize);
        stop.titleAt = {
          x: rect.left - box.left,
          y: rect.top - box.top,
          width: rect.width,
          scale: LABEL / size,
        };
      }
    });
    const told = rungList?.getBoundingClientRect();
    if (told) {
      rungsAt = {
        left: told.left - box.left,
        top: told.top - box.top,
        right: told.right - box.left,
        bottom: told.bottom - box.top,
      };
    }
    drawn = -1;
  }

  /* ---------- the camera ---------- */

  function aim(stop: number, move: number, rest: number): Camera {
    const { width, height, narrow } = view;
    const focusX = narrow ? width * 0.5 : width * 0.385;
    const focusY = narrow ? height * 0.6 : height * 0.47;
    const next = Math.min(stop + 1, LAST_STOP);
    const flight = inOut(move);
    const dip = 1 - PULL_BACK * Math.sin(Math.PI * move);
    const zoom = mix(ZOOM[stop] as number, ZOOM[next] as number, flight) * dip;
    const length = (narrow ? SPAN.narrow : SPAN.wide) * width * LAST_STOP * zoom;
    const drift = (rest - 0.5) * 0.008;
    const along = (stop + flight) / LAST_STOP + (move > 0 ? 0 : drift);
    const span = height * 0.96 * zoom;
    const high = mix((map.stops[stop] as MapNode).high, (map.stops[next] as MapNode).high, flight);
    const top = narrow ? 3.25 * 16 + 216 : 64;
    const bottom = narrow ? height - 88 : height - 56;
    return {
      focusX,
      focusY,
      left: focusX - along * length,
      length,
      height: span,
      middle: focusY - (high * span) / 2,
      roundX: narrow ? width / 2 : width * 0.68,
      roundY: (top + bottom) / 2,
      round: narrow
        ? Math.min(width * 0.46, (bottom - top) / 2)
        : Math.min((bottom - top) / 2 - 12, width * 0.27),
      pen: along + 0.012,
    };
  }

  /* ---------- the graph ---------- */

  function layout(view_: Camera, gathering: number) {
    const fan = 0.66;
    const hubAt = new Map<MapNode, { x: number; y: number }>();
    for (const node of map.nodes) {
      let x = view_.left + node.along * view_.length + node.dx * fan * view_.height * 0.5;
      let y = view_.middle + (node.high + node.dy * fan) * view_.height * 0.5;
      x = view_.focusX + (x - view_.focusX) * node.depth;
      y = view_.focusY + (y - view_.focusY) * node.depth;
      const reach = view_.pen - node.along;
      const stagger = node.hub ? node.order * 0.018 : 0;
      node.open = gathering > 0.2 ? 1 : clamp((reach - stagger + 0.006) / 0.03);
      if (node.hub) {
        const hub = hubAt.get(node.hub);
        if (hub) {
          const opened = 0.5 + 0.5 * spring(node.open);
          x = mix(hub.x, x, opened);
          y = mix(hub.y, y, opened);
        }
      } else if (node.kind === "hub") {
        hubAt.set(node, { x, y });
      }
      const delay = clamp(node.along * 0.9 + 0.05);
      node.gathered = gathering >= 1 ? 1 : inOut(clamp(gathering * 1.55 - delay * 0.55));
      if (node.gathered > 0) {
        x = mix(x, view_.roundX + node.x * view_.round, node.gathered);
        y = mix(y, view_.roundY + node.y * view_.round, node.gathered);
      }
      if (pointer.on) {
        const dx = x - pointer.nearX;
        const dy = y - pointer.nearY;
        const distance = dx * dx + dy * dy;
        if (distance < 8100 && distance > 1) {
          const root = Math.sqrt(distance);
          const push = (1 - root / 90) ** 2 * 15;
          x += (dx / root) * push;
          y += (dy / root) * push;
        }
      }
      node.sx = x;
      node.sy = y;
    }
  }

  /** A path through the nodes; each stretch has the same number of points, so `at` is stops gone. */
  function pathThrough(points: { sx: number; sy: number }[], curve: number) {
    const line: number[] = [];
    for (let index = 0; index < points.length - 1; index += 1) {
      const a = points[index] as MapNode;
      const b = points[index + 1] as MapNode;
      const middle = (a.sx + b.sx) / 2;
      const c1x = mix(a.sx + (b.sx - a.sx) / 3, middle, curve);
      const c1y = mix(a.sy + (b.sy - a.sy) / 3, a.sy, curve);
      const c2x = mix(a.sx + ((b.sx - a.sx) * 2) / 3, middle, curve);
      const c2y = mix(a.sy + ((b.sy - a.sy) * 2) / 3, b.sy, curve);
      for (let step = 0; step < 18; step += 1) {
        const t = step / 18;
        const o = 1 - t;
        line.push(
          o * o * o * a.sx + 3 * o * o * t * c1x + 3 * o * t * t * c2x + t * t * t * b.sx,
          o * o * o * a.sy + 3 * o * o * t * c1y + 3 * o * t * t * c2y + t * t * t * b.sy,
        );
      }
    }
    const end = points.at(-1) as MapNode;
    line.push(end.sx, end.sy);
    return line;
  }

  function strokeTo(line: number[], points: number) {
    context.beginPath();
    context.moveTo(line[0] as number, line[1] as number);
    const whole = Math.floor(points);
    for (let index = 1; index <= whole && index * 2 < line.length; index += 1) {
      context.lineTo(line[index * 2] as number, line[index * 2 + 1] as number);
    }
    const part = points - whole;
    if (part > 0 && (whole + 1) * 2 < line.length) {
      context.lineTo(
        mix(line[whole * 2] as number, line[whole * 2 + 2] as number, part),
        mix(line[whole * 2 + 1] as number, line[whole * 2 + 3] as number, part),
      );
    }
    context.stroke();
  }

  function draw(x: number, gathering: number, loop: number, now: number) {
    const palette = colours as Palette;
    const { width, height } = view;
    context.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const away = (node: MapNode) =>
      node.sx < -60 || node.sx > width + 60 || node.sy < -60 || node.sy > height + 60;

    context.lineWidth = 1;
    context.strokeStyle = palette.line;
    context.globalAlpha = around ? 0.4 : 1;
    context.beginPath();
    for (const { a, b, near } of map.links) {
      if (a.kind === "rule" && a.open <= 0 && a.gathered === 0) continue;
      let endX = b.sx;
      let endY = b.sy;
      if (near && a.gathered < 1) {
        endX = mix(near.sx, b.sx, a.gathered);
        endY = mix(near.sy, b.sy, a.gathered);
      }
      if (away(a) && (endX < -60 || endX > width + 60)) continue;
      context.moveTo(a.sx, a.sy);
      context.lineTo(endX, endY);
    }
    context.stroke();
    if (hovered) {
      context.strokeStyle = palette.accent;
      context.globalAlpha = 1;
      context.beginPath();
      for (const { a, b } of map.links) {
        if (a !== hovered && b !== hovered) continue;
        context.moveTo(a.sx, a.sy);
        context.lineTo(b.sx, b.sy);
      }
      context.stroke();
    }

    for (const node of map.nodes) {
      if (node.stop >= 0 && node.kind !== "hub") continue;
      if (away(node)) continue;
      const closed = node.open <= 0;
      const radius = node.kind === "rule" ? 1.4 : 2.3;
      context.globalAlpha = around && !around.has(node) ? 0.3 : 1;
      context.fillStyle =
        node === hovered
          ? palette.accent
          : closed
            ? palette.closed
            : node.kind === "rule"
              ? palette.dot
              : palette.hub;
      context.beginPath();
      context.arc(node.sx, node.sy, radius, 0, TAU);
      context.fill();
    }
    context.globalAlpha = 1;

    /* The line of the stops: grey ahead, the accent as far as the pen has come. */
    const line = pathThrough(
      map.stops.map(({ sx, sy }) => ({ sx, sy })),
      1 - gathering * 0.3,
    );
    context.lineWidth = 1.5;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = palette.spine;
    strokeTo(line, line.length / 2 - 1);
    context.strokeStyle = palette.accent;
    strokeTo(line, Math.min(x + 0.12, LAST_STOP) * 18);

    /* Pieces leave the node along a fan of hairs; at rest one hair runs on from piece to piece. */
    if (gathering < 0.3) {
      context.lineWidth = 1;
      context.strokeStyle = palette.spine;
      stops.forEach((stop, index) => {
        const share = bloom(x, index);
        if (share <= 0 || index === LAST_STOP) return;
        const hung = stop.pieces.filter(({ bare }) => !bare);
        const { sx, sy } = stop.node;
        context.globalAlpha = clamp(share * 1.4) * clamp((1 - share) * 6);
        context.beginPath();
        for (const piece of hung) {
          context.moveTo(sx, sy);
          context.lineTo(mix(sx, piece.x, share), mix(sy, piece.y, share));
        }
        context.stroke();
        context.globalAlpha = between(0.85, 1, share);
        context.beginPath();
        context.moveTo(sx, sy);
        hung.slice(0, 1).forEach((piece) => {
          context.lineTo(piece.left, piece.y);
        });
        hung.forEach((piece, order) => {
          if (order === 0) context.moveTo(piece.x, piece.y);
          else context.lineTo(piece.x, piece.y);
        });
        context.stroke();
      });
      context.globalAlpha = 1;
    }

    map.stops.forEach((node, index) => {
      const reached = x >= index - 0.02;
      const current = Math.round(x) === index;
      const size = 6;
      context.fillStyle = reached ? palette.accent : palette.page;
      context.strokeStyle = reached ? palette.accent : palette.spine;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(node.sx, node.sy, size, 0, TAU);
      context.fill();
      context.stroke();
      if (current) {
        context.strokeStyle = palette.accent;
        context.globalAlpha = 0.4;
        context.beginPath();
        context.arc(node.sx, node.sy, size + 5, 0, TAU);
        context.stroke();
        context.globalAlpha = 1;
      }
    });

    /* The rule the chapter tells stays lit from then on. */
    if (x > STOP.rule - 0.6) {
      context.fillStyle = palette.accent;
      context.globalAlpha = clamp((x - (STOP.rule - 0.6)) * 2);
      context.beginPath();
      context.arc(map.rule.sx, map.rule.sy, 3.6, 0, TAU);
      context.fill();
      context.globalAlpha = 1;
    }

    /* The way back: what the base holds feeds the next task. */
    if (loop > 0) {
      const from = map.stops[LAST_STOP] as MapNode;
      const to = map.stops[1] as MapNode;
      const bendX = (from.sx + to.sx) / 2 - (to.sy - from.sy) * 0.5;
      const bendY = (from.sy + to.sy) / 2 + (to.sx - from.sx) * 0.5;
      context.strokeStyle = palette.accent;
      context.lineWidth = 1.5;
      context.beginPath();
      const steps = Math.max(2, Math.round(40 * loop));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / 40;
        const o = 1 - t;
        const pointX = o * o * from.sx + 2 * o * t * bendX + t * t * to.sx;
        const pointY = o * o * from.sy + 2 * o * t * bendY + t * t * to.sy;
        if (step === 0) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.stroke();
    }

    for (let index = pulses.length - 1; index >= 0; index -= 1) {
      const pulse = pulses[index] as { node: MapNode; start: number };
      const age = (now - pulse.start) / 900;
      if (age > 1) {
        pulses.splice(index, 1);
        continue;
      }
      context.globalAlpha = 1 - age;
      context.strokeStyle = palette.accent;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(pulse.node.sx, pulse.node.sy, 6 + age * 22, 0, TAU);
      context.stroke();
    }
    context.globalAlpha = 1;

    /* A stop's name rides under its node, until its title takes over. */
    context.font = `${String(LABEL)}px ${getComputedStyle(stage).fontFamily}`;
    context.textAlign = "center";
    context.fillStyle = palette.text;
    map.stops.forEach((node, index) => {
      const name = ticks[index];
      if (!name || away(node)) return;
      const inTheBase = between(0.7, 1, gathering);
      const shown =
        gathering > 0.7
          ? view.narrow && index !== LAST_STOP
            ? 0
            : inTheBase
          : 1 - ((stops[index] as Stop).titled > 0 ? 1 : 0);
      if (shown <= 0) return;
      context.globalAlpha = clamp(shown);
      context.fillText(name, node.sx, node.sy + 24);
    });
    context.globalAlpha = 1;
    clearWords(x);
  }

  /** The graph fades out from under the words on its own: nothing is laid behind them. */
  function clearWords(x: number) {
    const { width, height, narrow } = view;
    const low = Math.floor(x);
    const here = stops[low] as Stop;
    const next = stops[Math.min(low + 1, LAST_STOP)] as Stop;
    const fade = (from: [number, number], to: [number, number], end: number, strength: number) => {
      const shade = context.createLinearGradient(...from, ...to);
      shade.addColorStop(0, `rgba(0,0,0,${strength.toFixed(3)})`);
      shade.addColorStop(end, `rgba(0,0,0,${strength.toFixed(3)})`);
      shade.addColorStop(1, "rgba(0,0,0,0)");
      return shade;
    };
    context.globalCompositeOperation = "destination-out";
    if (narrow) {
      const bottom = mix(here.bottom, next.bottom, x - low) + 12;
      context.fillStyle = fade(
        [0, 0],
        [0, bottom + height * 0.05],
        bottom / (bottom + height * 0.05),
        WORDS,
      );
      context.fillRect(0, 0, width, bottom + height * 0.05);
    } else {
      const right = here.right;
      context.fillStyle = fade(
        [0, 0],
        [right + width * 0.025, 0],
        right / (right + width * 0.025),
        WORDS,
      );
      context.fillRect(0, 0, right + width * 0.025, height);
    }
    const told = bloom(x, STOP.rule) * WORDS;
    if (told > 0) {
      const { left, top, right, bottom } = rungsAt;
      const soft = 32;
      if (narrow) {
        context.fillStyle = `rgba(0,0,0,${told.toFixed(3)})`;
        context.fillRect(0, top - 8, width, bottom - top + 16);
      } else {
        const shade = context.createLinearGradient(left - soft, 0, left, 0);
        shade.addColorStop(0, "rgba(0,0,0,0)");
        shade.addColorStop(1, `rgba(0,0,0,${told.toFixed(3)})`);
        context.fillStyle = shade;
        context.fillRect(left - soft, top - 16, right - left + soft + 40, bottom - top + 32);
      }
    }
    context.globalCompositeOperation = "source-over";
  }

  /* ---------- what opens out of a node ---------- */

  /** How far a stop's object is out of its node at this point of the flight. */
  function bloom(x: number, stop: number) {
    const gone = x - stop;
    return gone < 0 ? inOut(clamp(1 + gone * 1.9)) : inOut(clamp(1 - gone * 2.1));
  }

  function runPieces(x: number) {
    stops.forEach((stop, index) => {
      const share = bloom(x, index);
      const count = stop.pieces.length;
      stop.pieces.forEach((piece, order) => {
        const spread = count > 1 ? (order / (count - 1)) * 0.45 : 0;
        const each = inOut(clamp((share - spread * (1 - share)) / (1 - spread * 0.2)));
        const style = piece.element.style;
        if (share <= 0) {
          style.opacity = "0";
          style.pointerEvents = "none";
          return;
        }
        style.transform = shift(
          (stop.node.sx - piece.x) * (1 - each),
          (stop.node.sy - piece.y) * (1 - each),
          Math.max(0.04, each),
        );
        style.opacity = clamp(each * 2.2).toFixed(3);
        style.pointerEvents = each > 0.92 ? "auto" : "none";
      });
    });
  }

  function runWords(stop: number, move: number) {
    stops.forEach((item, index) => {
      const leaving = index === stop && move > 0;
      const entering = index === stop + 1 && move > 0;
      const resting = index === stop && move === 0;
      item.lines.forEach(({ element }, order) => {
        const style = element.style;
        if (resting) {
          style.transform = "none";
          style.opacity = "1";
        } else if (leaving) {
          const gone = inOut(clamp(move * 1.8 - order * 0.07));
          style.transform = shift(-56 * gone, 0);
          style.opacity = (1 - gone).toFixed(3);
        } else if (entering) {
          const come = out(clamp((move - 0.68) * 3.2 - order * 0.12));
          style.transform = shift(56 * (1 - come), 0);
          style.opacity = come.toFixed(3);
        } else {
          style.opacity = "0";
        }
      });
      /* The title grows out of the name under the node, and goes back into it. */
      const title = item.title;
      if (!title) return;
      const style = title.style;
      if (resting) {
        item.titled = 1;
        style.transform = "none";
        style.opacity = "1";
        return;
      }
      if (!leaving && !entering) {
        item.titled = 0;
        style.opacity = "0";
        return;
      }
      const share = leaving ? 1 - inOut(clamp(move / 0.55)) : inOut(between(0.42, 1, move));
      const { x, y, width, scale } = item.titleAt;
      const size = mix(scale, 1, share);
      item.titled = share;
      style.transform = shift(
        (item.node.sx - (width * scale) / 2 - x) * (1 - share),
        (item.node.sy + 12 - y) * (1 - share),
        size,
      );
      style.opacity = share > 0 ? "1" : "0";
    });
  }

  /** A wireframe becoming a screen where it stands, through the whole rest of the stop. */
  function runWipe(stop: number, move: number, rest: number) {
    if (!row) return;
    let share = 0;
    if (stop === STOP.screens && move === 0) share = inOut(between(0, 0.86, rest));
    else if (stop === STOP.screens - 1) share = 0;
    else if (stop >= STOP.screens) share = 1;
    const room = row.offsetWidth;
    const at = room * share;
    for (const phone of phones) {
      if (phone.offsetWidth === 0) continue;
      const frame = phone.querySelector<HTMLElement>(".frame");
      frame?.style.setProperty(
        "--cx",
        `${css(clamp(at - phone.offsetLeft, 0, phone.offsetWidth))}px`,
      );
    }
    if (cut) {
      cut.style.transform = `translate3d(${css(at)}px,0,0)`;
      cut.style.opacity = share > 0.002 && share < 0.998 ? "1" : "0";
    }
  }

  function runLadder(stop: number, move: number, rest: number) {
    if (!ladder) return;
    const rung = stop < STOP.rule ? 0 : stop > STOP.rule || move > 0 ? 4 : Math.floor(rest * 4.999);
    if (rung === lastRung) return;
    lastRung = rung;
    ladder.dataset.rung = String(rung);
    rungs.forEach((item, index) => {
      item.toggleAttribute("data-on", index === rung);
      item.toggleAttribute("data-past", index < rung);
    });
  }

  function runCounts(share: number) {
    for (const count of counts) {
      const target = Number(count.dataset.count);
      count.textContent = String(Math.round(target * share));
    }
  }

  function runTerminal(x: number, now: number) {
    if (x > 0.7 || now - beatAt < 340 || beat > terminal.length) return;
    beat += 1;
    beatAt = now;
    terminal.forEach((line, index) => {
      line.style.opacity = index < beat ? "1" : "0";
    });
  }

  /* ---------- hover, as in the app ---------- */

  function pick(gathering: number) {
    pointer.nearX = mix(pointer.nearX < 0 ? pointer.x : pointer.nearX, pointer.x, 0.22);
    pointer.nearY = mix(pointer.nearY < 0 ? pointer.y : pointer.nearY, pointer.y, 0.22);
    let best: MapNode | null = null;
    let distance = 13;
    if (pointer.on) {
      for (const node of map.nodes) {
        if (node.kind === "rule" && node.open <= 0 && gathering === 0) continue;
        const near = Math.hypot(node.sx - pointer.x, node.sy - pointer.y);
        if (near < distance) {
          best = node;
          distance = near;
        }
      }
    }
    if (best !== hovered) {
      hovered = best;
      around = best
        ? new Set(
            map.links
              .flatMap(({ a, b }) => (a === best ? [b] : b === best ? [a] : []))
              .concat(best),
          )
        : null;
      const named = best?.kind === "rule" ? best.hub : best;
      tip.hidden = !named?.label;
      if (named?.label) tip.textContent = `${named.label} · ${String(named.rules)} ${unit}`;
      drawn = -1;
    }
    if (hovered && !tip.hidden) {
      const x = clamp(hovered.sx - tip.offsetWidth / 2, 8, view.width - tip.offsetWidth - 8);
      tip.style.transform = shift(x, hovered.sy - 34);
    }
  }

  /* ---------- the status line ---------- */

  const status = chapter.querySelector<HTMLElement>("[data-map-status]");
  const counted = status
    ? {
        words: status.querySelector("[data-map-words]"),
        chars: status.querySelector("[data-map-chars]"),
      }
    : null;
  const forms = JSON.parse(status?.dataset.forms ?? "{}") as Partial<
    Record<"words" | "chars", Record<string, string>>
  >;
  const language = document.documentElement.lang || "ru";
  const plurals = new Intl.PluralRules(language);
  const numbers = new Intl.NumberFormat(language);
  const said = (count: number, unit: "words" | "chars") => {
    const form = forms[unit] ?? {};
    return `${numbers.format(count)} ${form[plurals.select(count)] ?? form.other ?? ""}`;
  };

  /** What Obsidian counts at the bottom right, of the note the scene stands on: its words, its characters. */
  function tell(stop: number) {
    if (!counted) return;
    const text = (items[stop]?.querySelector(".map-copy")?.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const words = text.split(" ").filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
    if (counted.words) counted.words.textContent = said(words, "words");
    if (counted.chars) counted.chars.textContent = said(text.length, "chars");
  }

  /* ---------- every frame ---------- */

  function frame(time: number) {
    const now = time * 1000;
    const { stop, move, rest } = momentAt(scroll.progress);
    const x = stop + inOut(move);
    const gathering =
      stop === LAST_STOP ? 1 : stop === LAST_STOP - 1 ? inOut(between(0.04, 1, move)) : 0;
    const loop = stop === LAST_STOP ? inOut(between(0.05, 0.75, rest)) : 0;
    if (!map.settled) settleMap(map, gathering > 0 ? 200 : 6);
    runTerminal(x, now);
    if (pointer.on || hovered) {
      if (camera) pick(gathering);
    }
    const nearest = Math.round(x);
    if (nearest !== lastStop) {
      lastStop = nearest;
      pulses.push({ node: map.stops[nearest] as MapNode, start: now });
      rail.forEach((tick, index) => {
        tick.toggleAttribute("data-active", index === nearest);
      });
      tell(nearest);
    }
    const settling =
      pointer.on && Math.abs(pointer.x - pointer.nearX) + Math.abs(pointer.y - pointer.nearY) > 0.5;
    if (drawn === scroll.progress && !settling && pulses.length === 0) return;
    drawn = scroll.progress;
    camera = aim(stop, move, rest);
    layout(camera, gathering);
    runPieces(x);
    runWords(stop, move);
    runWipe(stop, move, rest);
    runLadder(stop, move, rest);
    runCounts(stop === LAST_STOP ? 1 : stop === LAST_STOP - 1 ? gathering : 0);
    draw(x, gathering, loop, now);
  }

  /* ---------- the sideways way through ---------- */

  const start = () => scene.scrollTrigger?.start ?? 0;
  const length = () => (scene.scrollTrigger?.end ?? 1) - start();
  const inside = () => window.scrollY >= start() - 40 && window.scrollY <= start() + length() + 40;
  const to = (stop: number, behavior: ScrollBehavior) => {
    window.scrollTo({ top: start() + progressOf(stop) * length(), behavior });
  };

  const onWheel = (event: WheelEvent) => {
    if (inside() && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      window.scrollBy(0, event.deltaX * 1.6);
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if ((event.key !== "ArrowRight" && event.key !== "ArrowLeft") || !inside()) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const here = Math.round(momentAt(scroll.progress).stop + momentAt(scroll.progress).move);
    to(clamp(here + (event.key === "ArrowRight" ? 1 : -1), 0, LAST_STOP), "smooth");
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target as Element;
    const go = target.closest<HTMLElement>("[data-go]");
    if (go) to(Number(go.dataset.go), "smooth");
    const tile = target.closest<HTMLElement>("[data-look]");
    if (tile?.dataset.look) choose(tile.dataset.look);
  };
  const onFocus = (event: FocusEvent) => {
    const item = (event.target as Element).closest<HTMLElement>("[data-map-stop]");
    const index = item ? items.indexOf(item) : -1;
    if (index >= 0) to(index, "instant");
  };

  /** Dragging sideways, on any free part of the stage: one screen's width is one stop. */
  let dragged: { x: number; scroll: number } | null = null;
  const onDown = (event: PointerEvent) => {
    if ((event.target as Element).closest("a, button") || event.button !== 0) return;
    dragged = { x: event.clientX, scroll: window.scrollY };
  };
  const onMove = (event: PointerEvent) => {
    if (dragged) {
      const moved = dragged.x - event.clientX;
      if (Math.abs(moved) > 6 && !stage.hasPointerCapture(event.pointerId)) {
        stage.setPointerCapture(event.pointerId);
      }
      if (stage.hasPointerCapture(event.pointerId)) {
        window.scrollTo(0, dragged.scroll + (moved / view.width) * (length() / LAST_STOP));
      }
    }
    if (event.pointerType !== "mouse") return;
    const box = stage.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.on = true;
  };
  const onUp = () => {
    dragged = null;
  };
  const onLeave = () => {
    pointer.on = false;
    pointer.nearX = -1;
    pointer.nearY = -1;
  };

  function choose(look: string) {
    for (const tile of gsap.utils.toArray<HTMLElement>("[data-look]", chapter)) {
      tile.setAttribute("aria-checked", String(tile.dataset.look === look));
    }
    for (const target of gsap.utils.toArray<HTMLElement>("[data-look-target]", chapter)) {
      target.dataset.style = look;
    }
    for (const letter of gsap.utils.toArray<HTMLElement>("[data-look-letter]", chapter)) {
      letter.textContent = look.toUpperCase();
    }
  }

  /* ---------- on and off ---------- */

  const scene = gsap.to(scroll, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: chapter,
      start: "top top",
      end: () => `+=${String(chapter.offsetHeight - 2 * window.innerHeight)}`,
      scrub,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
        snap?.place();
      },
    },
  });
  const onScreen = ScrollTrigger.create({
    trigger: chapter,
    start: "top bottom",
    end: "bottom top",
    onToggle: ({ isActive }) => {
      if (isActive) gsap.ticker.add(frame);
      else gsap.ticker.remove(frame);
    },
  });

  const theme = new MutationObserver(readColours);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", readColours);
  chapter.addEventListener("click", onClick);
  chapter.addEventListener("focusin", onFocus);
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("pointerleave", onLeave);
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("keydown", onKey);
  snap = snapToRests(chapter, () =>
    map.stops.map((_, stop) => start() + progressOf(stop) * length()),
  );
  /*
   * The graph's shape is worked out while the page is idle, long before the reader gets here: a
   * piece of it in every frame of the scroll costs a phone its frames just as Flow rises. A timer
   * and an idle callback number their handles apart, so the wait is kept as the call that cancels
   * it: a leave never cancels another one that happens to share the number.
   */
  let cancel = () => {};
  const settleIdle = (deadline?: IdleDeadline) => {
    const budget = Math.max(2, Math.min(8, deadline?.timeRemaining() ?? 6));
    if (!settleMap(map, budget)) cancel = later(settleIdle);
  };
  // Safari has no idle callback: there a short pause between pieces does the same.
  const later = (run: (deadline?: IdleDeadline) => void): (() => void) => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 400 });
      return () => {
        window.cancelIdleCallback(id);
      };
    }
    // Past the check the type says there is no window left: the global timer is the same one.
    const id = setTimeout(run, 40);
    return () => {
      clearTimeout(id);
    };
  };
  const wait = window.setTimeout(() => {
    cancel = later(settleIdle);
  }, 1500);
  cancel = () => {
    window.clearTimeout(wait);
  };
  void document.fonts.ready.then(measure);
  tell(0);
  readColours();
  measure();
  if (onScreen.isActive) gsap.ticker.add(frame);

  return () => {
    snap.undo();
    cancel();
    gsap.ticker.remove(frame);
    theme.disconnect();
    scheme.removeEventListener("change", readColours);
    chapter.removeEventListener("click", onClick);
    chapter.removeEventListener("focusin", onFocus);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerup", onUp);
    stage.removeEventListener("pointercancel", onUp);
    stage.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    for (const element of chapter.querySelectorAll<HTMLElement>("[style]")) {
      if (element !== stage && !element.closest(".frame")) element.removeAttribute("style");
    }
    tip.hidden = true;
  };
}

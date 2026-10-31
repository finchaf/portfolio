import { SCORE_DAYS, SCORE_MARKED, SCORE_ROWS } from "./story-data";

/** Lessons a day can hold on a row. */
const SLOTS = 4;

/** The share of a day's width a lesson takes, and where the first one starts. */
const LESSON = 0.16;
const LESSON_STEP = 0.21;
const LESSON_START = 0.1;

/** Where the rows run, in shares of the height. */
const FIRST_ROW = 0.14;
const ROWS_SPAN = 0.72;

/** How long the comb's teeth are and how far past the edges it starts and ends, in shares of the width. */
const COMB = 0.34;
const COMB_TRAVEL = 1.7;

/** How often a line is sampled, how far a pluck reaches and how far it pushes, in pixels. */
const STEP = 4;
const PLUCK_WIDTH = 90;
const PLUCK_HEIGHT = 70;
const PLUCK_PUSH = 26;

/** How quickly a pluck dies away, and what counts as still. */
const PLUCK_FADE = 0.93;
const PLUCK_STILL = 0.004;
const PLUCK_GAIN = 0.18;

/** How far the knot reaches from the middle of the picture, clear of a pluck at the edges, and how finely it is measured. */
const KNOT_REACH = 0.46;
const SAMPLES = 400;

/** When the score reads as one: the rows thin out and the days arrive. */
const SETTLES_AT = 0.5;

export interface Beat {
  row: number;
  day: number;
  slot: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const part = (value: number, from: number, to: number) => clamp((value - from) / (to - from));
const mix = (from: number, to: number, share: number) => from + (to - from) * share;
const inOut = (share: number) => (share < 0.5 ? 4 * share ** 3 : 1 - (-2 * share + 2) ** 3 / 2);

/** A number of its own for every seed: the score is drawn, not random, and is the same each time. */
function grain(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

const WAVES = Array.from({ length: SCORE_ROWS }, (_, row) =>
  [0, 1, 2, 3].map((wave) => ({
    size: 0.12 + grain(row * 7 + wave) * 0.3,
    pace: 1.2 + wave * 1.15 + grain(row + wave * 3) * 1.4,
    phase: grain(row * 13 + wave * 5) * Math.PI * 2,
  })),
);

/** Where the lessons of the week stand. Nothing here is a real timetable: it is a picture of one. */
export const BEATS: readonly Beat[] = Array.from({ length: SCORE_ROWS }, (_, row) =>
  Array.from({ length: SCORE_DAYS.length }, (_day, day) =>
    Array.from({ length: SLOTS }, (_slot, slot) => ({ row, day, slot })).filter(
      (beat) => grain(beat.row * 31 + beat.day * 17 + beat.slot * 5) > 0.62,
    ),
  ).flat(),
).flat();

/** How far along a row a lesson starts, in shares of the width. */
export function beatStart({ day, slot }: Beat) {
  return (day + LESSON_START + slot * LESSON_STEP) / SCORE_DAYS.length;
}

/** How wide a lesson is, in shares of the width. */
export const BEAT_WIDTH = LESSON / SCORE_DAYS.length;

/** Where a row runs once it is combed, in shares of the height. */
export function rowAt(row: number) {
  return FIRST_ROW + (ROWS_SPAN * row) / (SCORE_ROWS - 1);
}

/** How straight a line is at a point along it, from 0 to 1. The comb goes from left to right. */
export function combed(progress: number, along: number) {
  return inOut(clamp((progress * COMB_TRAVEL - COMB - along) / COMB));
}

/** How a line strays from the middle of the knot, before it is fitted to the picture. */
function strayAt(row: number, along: number) {
  const body = Math.sin(Math.PI * clamp(along * 0.92 + 0.06)) ** 0.7;
  const waves = (WAVES[row] ?? []).reduce(
    (sum, { size, pace, phase }) => sum + size * Math.sin(pace * along * Math.PI * 2 + phase),
    0,
  );
  return waves * body;
}

/** The furthest any line strays: the knot is scaled by it, so no peak leaves the canvas. */
const WIDEST = Math.max(
  ...Array.from({ length: SCORE_ROWS }, (_, row) =>
    Array.from({ length: SAMPLES + 1 }, (_sample, at) => Math.abs(strayAt(row, at / SAMPLES))),
  ).flat(),
);

/** Where a line runs in the knot, in shares of the height. */
function knotAt(row: number, along: number) {
  return 0.5 + (strayAt(row, along) / WIDEST) * KNOT_REACH;
}

/** Where a line runs at a point along it, in shares of the height. */
export function lineAt(row: number, along: number, progress: number) {
  return mix(knotAt(row, along), rowAt(row), combed(progress, along));
}

export interface Score {
  /** Reads the size and the colours again: after a resize or a change of mode. */
  measure: () => void;
  /** Draws the score at a share of its way from the knot to the week. */
  draw: (progress: number) => void;
  /** Pushes the lines apart around a point, in pixels of the canvas. */
  pluck: (x: number, y: number) => void;
  stop: () => void;
}

/**
 * A knot of lines, one to a group, that a comb lays straight from left to right, and the lessons
 * arriving on them: the week as a score. It is a canvas because every line changes all along its
 * length on every frame, and it draws only when it is asked to.
 */
export function createScore(canvas: HTMLCanvasElement, days: HTMLElement[]): Score | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pen = context;
  let width = 0;
  let height = 0;
  let ink = "";
  let accent = "";
  let progress = 0;
  let pluckX = 0;
  let pluckY = 0;
  let force = 0;
  let frame = 0;

  const draw = (share: number) => {
    progress = share;
    pen.clearRect(0, 0, width, height);
    const settled = part(share, SETTLES_AT, 1);
    days.forEach((day, index) => {
      day.style.opacity = String(part(settled, index * 0.1, index * 0.1 + 0.5));
    });
    for (let row = 0; row < SCORE_ROWS; row += 1) {
      const marked = row === SCORE_MARKED;
      pen.beginPath();
      for (let x = -STEP; x <= width + STEP; x += STEP) {
        let y = lineAt(row, clamp(x / width), share) * height;
        if (force > 0) {
          const reach =
            Math.exp(-(((x - pluckX) / PLUCK_WIDTH) ** 2)) *
            Math.exp(-(((y - pluckY) / PLUCK_HEIGHT) ** 2));
          y += Math.sign(y - pluckY || 1) * PLUCK_PUSH * force * reach;
        }
        pen.lineTo(x, Math.min(height - 1, Math.max(1, y)));
      }
      pen.strokeStyle = marked ? accent : ink;
      pen.globalAlpha = marked ? 1 : mix(0.75, 0.45, settled);
      pen.lineWidth = marked ? 1.75 : 1;
      pen.stroke();
    }
    const lessonHeight = Math.max(7, height * 0.013);
    pen.lineWidth = 1;
    BEATS.forEach((beat) => {
      const along = beatStart(beat);
      const shown = part(combed(share, along), 0.82, 1);
      if (shown === 0) return;
      const size = lessonHeight * shown;
      pen.globalAlpha = shown;
      pen.fillStyle = beat.row === SCORE_MARKED ? accent : ink;
      pen.beginPath();
      pen.roundRect(
        along * width,
        rowAt(beat.row) * height - size / 2,
        BEAT_WIDTH * width,
        size,
        2,
      );
      pen.fill();
    });
    pen.globalAlpha = 1;
  };

  const measure = () => {
    const ratio = Math.min(window.devicePixelRatio, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    pen.setTransform(ratio, 0, 0, ratio, 0, 0);
    const style = getComputedStyle(canvas);
    ink = style.color;
    accent = style.outlineColor;
    draw(progress);
  };

  const settle = () => {
    force *= PLUCK_FADE;
    if (force < PLUCK_STILL) {
      force = 0;
      frame = 0;
    } else {
      frame = requestAnimationFrame(settle);
    }
    draw(progress);
  };

  const pluck = (x: number, y: number) => {
    pluckX = x;
    pluckY = y;
    force = Math.min(1, force + PLUCK_GAIN);
    if (frame === 0) frame = requestAnimationFrame(settle);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    force = 0;
    days.forEach((day) => {
      day.style.removeProperty("opacity");
    });
  };

  return { measure, draw, pluck, stop };
}

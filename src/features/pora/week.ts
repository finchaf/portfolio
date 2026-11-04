import { PRODUCT_CHANNEL_URL, PRODUCT_SITE_URL } from "@/lib/product";

import { type Picture, PICTURES } from "./pictures";

/**
 * The page's week. Every lesson is a chapter about the product; its type says what kind: a lecture
 * tells, a practice is an app, a lab is the engineering, an exam is the numbers. The times are a
 * real university's, Omsk State University's, from the product's own fixtures. Today and the
 * lesson going on are the reader's own: the week runs by the reader's clock, wherever they are.
 */

export const DAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

export const SLOTS = [
  ["08:45", "10:20"],
  ["10:30", "12:05"],
  ["12:45", "14:20"],
  ["14:30", "16:05"],
  ["16:15", "17:50"],
] as const;

export type LessonType =
  "lecture" | "practice" | "lab" | "seminar" | "interactive" | "consultation" | "test" | "exam";

/**
 * The product's colours of the lesson types, both modes: Tailwind 4's 500 in the light, 300 in the
 * dark (`web/packages/ui/tokens/brand.tokens.json`, `lesson`), the same in `src/themes/pora.css`.
 * The chapter «Дизайн-система» shows them with their values.
 */
export const LESSON_HUES = [
  { type: "lecture", hue: "sky", light: "#00a6f4", dark: "#74d4ff" },
  { type: "practice", hue: "rose", light: "#ff2056", dark: "#ffa1ad" },
  { type: "lab", hue: "emerald", light: "#00bc7d", dark: "#5ee9b5" },
  { type: "seminar", hue: "amber", light: "#fe9a00", dark: "#ffd230" },
  { type: "interactive", hue: "pink", light: "#f6339a", dark: "#fda5d5" },
  { type: "consultation", hue: "purple", light: "#ad46ff", dark: "#dab2ff" },
  { type: "test", hue: "lime", light: "#7ccf00", dark: "#bbf451" },
  { type: "exam", hue: "orange", light: "#ff6900", dark: "#ffb86a" },
  { type: "retake", hue: "teal", light: "#00bba7", dark: "#46ecd5" },
  { type: "other", hue: "zinc", light: "#71717b", dark: "#9f9fa9" },
] as const;

export interface Lesson {
  id:
    | "about"
    | "origin"
    | "fork"
    | "ios"
    | "android"
    | "web"
    | "system"
    | "editor"
    | "numbers"
    | "next";
  type: LessonType;
  day: number;
  slot: number;
}

/** In reading order: the week from Monday's first lesson reads the case from its start. */
export const LESSONS: readonly Lesson[] = [
  { id: "about", type: "lecture", day: 0, slot: 0 },
  { id: "origin", type: "seminar", day: 0, slot: 2 },
  { id: "fork", type: "consultation", day: 1, slot: 1 },
  { id: "ios", type: "practice", day: 1, slot: 3 },
  { id: "android", type: "practice", day: 2, slot: 0 },
  { id: "web", type: "lecture", day: 2, slot: 2 },
  { id: "system", type: "lab", day: 3, slot: 1 },
  { id: "editor", type: "interactive", day: 3, slot: 3 },
  { id: "numbers", type: "exam", day: 4, slot: 1 },
  { id: "next", type: "test", day: 4, slot: 3 },
];

export const minutes = (time: string): number => {
  const [hours = 0, rest = 0] = time.split(":").map(Number);
  return hours * 60 + rest;
};

/** Where the clock stands in the timetable: inside a lesson, in the break after one, or outside. */
export function placeInDay(now: number): { slot: number; share: number } | null {
  for (const [index, [start, end]] of SLOTS.entries()) {
    const from = minutes(start);
    const to = minutes(end);
    if (now >= from && now < to) return { slot: index, share: (now - from) / (to - from) };
    const next = SLOTS[index + 1];
    if (next && now >= to && now < minutes(next[0])) return { slot: index, share: 1 };
  }
  return null;
}

/**
 * What a chapter shows beside its words: pictures to open at the size of the screen, the lesson
 * types' colours, the clients' commits by month, the launch's downloads by day or numbered steps.
 */
export type Figure =
  | { kind: "pictures"; key: string; pictures: readonly Picture[] }
  | { kind: "hues"; key: string }
  | { kind: "commits"; key: string }
  | { kind: "downloads"; key: string }
  | { kind: "steps"; key: string; steps: readonly string[] };

/**
 * What a lesson's window holds: its sections, their paragraphs and figures, the facts, the
 * timeline, the chart, the people and the places. The words are in `messages/{ru,en}/pora.json`
 * under the same keys.
 */
export interface LessonWindowSpec {
  sections: readonly { key: string; paragraphs: readonly string[]; figure?: Figure }[];
  facts: readonly string[];
  timeline: readonly string[];
  chart: boolean;
  people: readonly string[];
  /**
   * A place with `href` is the product's own; without one it keeps its address in the strings, as a
   * store's address names the app; `page` is a page of this site.
   */
  places: readonly { key: string; href?: string; page?: "/projects/latex" }[];
}

const PRODUCT_PLACES = [
  { key: "site", href: PRODUCT_SITE_URL },
  { key: "channel", href: PRODUCT_CHANNEL_URL },
] as const;

export const WINDOWS: Partial<Record<Lesson["id"], LessonWindowSpec>> = {
  about: {
    sections: [
      { key: "what", paragraphs: ["p1"] },
      { key: "now", paragraphs: ["p1", "p2"] },
      { key: "role", paragraphs: ["p1"] },
      { key: "how", paragraphs: ["p1", "p2"] },
    ],
    facts: ["commits", "decisions", "specs"],
    timeline: ["start", "android", "alpha", "site", "web"],
    chart: false,
    people: ["me", "partner"],
    places: PRODUCT_PLACES,
  },
  origin: {
    sections: [
      { key: "why", paragraphs: ["p1"] },
      { key: "build", paragraphs: ["p1", "p2"] },
      { key: "launch", paragraphs: ["p1", "p2"] },
    ],
    facts: ["impressions", "pageViews", "firstDays", "rank", "total"],
    timeline: ["idea", "start", "launch", "after"],
    chart: true,
    people: ["me", "partner"],
    places: [
      { key: "appStore" },
      { key: "googlePlay" },
      { key: "ruStore" },
      { key: "thesis", page: "/projects/latex" },
    ],
  },
  fork: {
    sections: [
      { key: "question", paragraphs: ["p1"] },
      { key: "ceiling", paragraphs: ["p1", "p2"] },
      { key: "heard", paragraphs: ["p1", "p2"] },
      { key: "choice", paragraphs: ["p1", "p2"] },
    ],
    facts: ["schools", "ads"],
    timeline: ["launch", "after", "frozen", "pitch", "start"],
    chart: false,
    people: ["me", "partner", "team"],
    places: [],
  },
  ios: {
    sections: [
      {
        key: "what",
        paragraphs: ["p1", "p2"],
        figure: { kind: "pictures", key: "screens", pictures: [PICTURES.iosPoster] },
      },
      { key: "outside", paragraphs: ["p1", "p2"] },
      { key: "reminders", paragraphs: ["p1"] },
      { key: "how", paragraphs: ["p1", "p2"] },
    ],
    facts: ["commits", "tests", "snapshots", "decisions"],
    timeline: ["start", "tuist", "internal", "snapshots", "alpha"],
    chart: false,
    people: ["me"],
    places: [],
  },
  android: {
    sections: [
      {
        key: "what",
        paragraphs: ["p1", "p2"],
        figure: { kind: "pictures", key: "screens", pictures: [PICTURES.androidPoster] },
      },
      { key: "widgets", paragraphs: ["p1"] },
      { key: "colour", paragraphs: ["p1"] },
      { key: "how", paragraphs: ["p1", "p2"] },
    ],
    facts: ["commits", "tests", "decisions", "modules"],
    timeline: ["scaffold", "play", "schedule", "widgets", "build"],
    chart: false,
    people: ["me"],
    places: [],
  },
  web: {
    sections: [
      {
        key: "what",
        paragraphs: ["p1", "p2"],
        figure: {
          kind: "pictures",
          key: "screens",
          pictures: [PICTURES.webWeek, PICTURES.webLesson, PICTURES.webSearch],
        },
      },
      { key: "time", paragraphs: ["p1"] },
      { key: "how", paragraphs: ["p1", "p2"] },
      { key: "phone", paragraphs: ["p1"] },
    ],
    facts: ["commits", "schedule", "budget", "gates"],
    timeline: ["start", "site", "launch", "grid", "search", "window", "now"],
    chart: false,
    people: ["me"],
    places: [],
  },
  system: {
    sections: [
      { key: "one", paragraphs: ["p1"], figure: { kind: "hues", key: "hues" } },
      { key: "figma", paragraphs: ["p1", "p2"] },
      { key: "platforms", paragraphs: ["p1", "p2"] },
      { key: "here", paragraphs: ["p1"] },
    ],
    facts: ["tokens", "types", "schemes", "components"],
    timeline: ["neutral", "zinc", "tokens", "nova"],
    chart: false,
    people: ["me"],
    places: [],
  },
  editor: {
    sections: [
      {
        key: "what",
        paragraphs: ["p1", "p2"],
        figure: { kind: "steps", key: "flow", steps: ["edit", "check", "publish"] },
      },
      { key: "pain", paragraphs: ["p1"] },
      { key: "before", paragraphs: ["p1", "p2"] },
      { key: "now", paragraphs: ["p1"] },
    ],
    facts: ["abilities"],
    timeline: ["first", "abilities", "now"],
    chart: false,
    people: ["me", "partner"],
    places: [],
  },
  numbers: {
    sections: [
      {
        key: "launch",
        paragraphs: ["p1"],
        figure: { kind: "downloads", key: "downloads" },
      },
      {
        key: "code",
        paragraphs: ["p1"],
        figure: { kind: "commits", key: "commits" },
      },
      { key: "sources", paragraphs: ["p1", "p2"] },
    ],
    facts: ["firstDays", "total", "rank", "commits", "tests", "decisions"],
    timeline: [],
    chart: false,
    people: [],
    places: [],
  },
  next: {
    sections: [
      { key: "stores", paragraphs: ["p1", "p2"] },
      { key: "web", paragraphs: ["p1"] },
      { key: "cabinet", paragraphs: ["p1"] },
    ],
    facts: [],
    timeline: [],
    chart: false,
    people: ["me", "partner"],
    places: PRODUCT_PLACES,
  },
};

/** The lessons that open, in the week's reading order: the window's footer walks them. */
export const OPENING = LESSONS.filter((lesson) => WINDOWS[lesson.id]);

/** The one window the lessons open in, a page each (lesson-window.tsx). */
export const WINDOW_ID = "pora-window";

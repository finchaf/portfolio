import { PRODUCT_SITE_URL } from "@/lib/product";
import { DAYS, type Lesson, LESSONS, SLOTS } from "@/lib/product-week";

import { type Picture, PICTURES } from "./pictures";

// The week itself lives in lib: the page's link picture draws it too (scripts/og).
export { DAYS, LESSONS, SLOTS, type Lesson };

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
  | { kind: "steps"; key: string; steps: readonly string[] }
  | { kind: "install"; key: string; steps: readonly InstallStep[]; code?: string };

/**
 * A step of getting the alpha: its words under the figure's key, where its button goes, and whether
 * that button is the one the step is about. `code` draws the address for a phone's camera beside the
 * steps, for a reader at a computer whose way in is a link to open on the phone.
 */
export interface InstallStep {
  key: string;
  href: string;
  main?: boolean;
}

/**
 * The alpha's open doors, as the testers' group in Telegram gives them (owner, 05.11.2026): TestFlight
 * by a public link, Google Play by a closed test whose testers are an open Google group.
 */
const TESTFLIGHT_APP = "https://apps.apple.com/app/testflight/id899247664";
const TESTFLIGHT_INVITE = "https://testflight.apple.com/join/e5SW2PhR";
const PLAY_TESTERS = "https://groups.google.com/g/pora-na-paru-alpha-test";
const PLAY_TEST = "https://play.google.com/apps/testing/net.theoremos.poranaparu";
const PLAY_APP = "https://play.google.com/store/apps/details?id=net.theoremos.poranaparu";

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

const PRODUCT_PLACES = [{ key: "site", href: PRODUCT_SITE_URL }] as const;

export const WINDOWS: Partial<Record<Lesson["id"], LessonWindowSpec>> = {
  about: {
    sections: [
      { key: "what", paragraphs: ["p1"] },
      { key: "now", paragraphs: ["p1", "p2"] },
      { key: "role", paragraphs: ["p1"] },
      { key: "how", paragraphs: ["p1"] },
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
      { key: "site" },
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
        key: "try",
        paragraphs: ["p1"],
        figure: {
          kind: "install",
          key: "install",
          steps: [
            { key: "testflight", href: TESTFLIGHT_APP },
            { key: "invite", href: TESTFLIGHT_INVITE, main: true },
          ],
          code: TESTFLIGHT_INVITE,
        },
      },
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
    timeline: ["start", "tuist", "internal", "snapshots", "alpha", "link"],
    chart: false,
    people: ["me"],
    places: [],
  },
  android: {
    sections: [
      {
        key: "try",
        paragraphs: ["p1"],
        figure: {
          kind: "install",
          key: "install",
          steps: [
            { key: "group", href: PLAY_TESTERS },
            { key: "test", href: PLAY_TEST },
            { key: "install", href: PLAY_APP, main: true },
          ],
        },
      },
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
    timeline: ["scaffold", "play", "schedule", "closed", "widgets", "build"],
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

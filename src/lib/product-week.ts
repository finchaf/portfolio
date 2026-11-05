/**
 * The page's week. Every lesson is a chapter about the product; its type says what kind: a lecture
 * tells, a practice is an app, a lab is the engineering, an exam is the numbers. The times are a
 * real university's, Omsk State University's, from the product's own fixtures. Today and the
 * lesson going on are the reader's own: the week runs by the reader's clock, wherever they are.
 * Here, not in the page's feature, because the page's link picture draws the same week.
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

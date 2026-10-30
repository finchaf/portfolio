/** The smallest honest version of the timetable's rule: a slot holds one lesson. */

export const DAYS = 5;
export const SLOTS = 4;

export interface Lesson {
  id: "math" | "base" | "code";
  day: number;
  slot: number;
}

export const OPENING: readonly Lesson[] = [
  { id: "math", day: 0, slot: 1 },
  { id: "base", day: 2, slot: 0 },
  { id: "code", day: 3, slot: 2 },
];

/** What the demo plays by itself: a lesson lands on another, then moves to a free slot. */
export const SCRIPT: readonly Lesson[] = [
  { id: "code", day: 2, slot: 0 },
  { id: "code", day: 2, slot: 2 },
  { id: "math", day: 2, slot: 2 },
  { id: "math", day: 1, slot: 3 },
  { id: "base", day: 1, slot: 3 },
  { id: "base", day: 4, slot: 1 },
];

/** The ids of the lessons that share a slot with another. */
export function conflicts(lessons: readonly Lesson[]): Set<Lesson["id"]> {
  const clashing = lessons.filter((lesson) =>
    lessons.some(
      (other) => other.id !== lesson.id && other.day === lesson.day && other.slot === lesson.slot,
    ),
  );
  return new Set(clashing.map((lesson) => lesson.id));
}

/** The slot after this one, across the week and around. */
export function nextSlot(lesson: Lesson): Lesson {
  const position = (lesson.day * SLOTS + lesson.slot + 1) % (DAYS * SLOTS);
  return { ...lesson, day: Math.floor(position / SLOTS), slot: position % SLOTS };
}

/** The timetable with one lesson moved. */
export function moved(lessons: readonly Lesson[], lesson: Lesson): Lesson[] {
  return lessons.map((each) => (each.id === lesson.id ? lesson : each));
}

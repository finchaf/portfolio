import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LESSON_HUES, minutes, placeInDay } from "./week";

describe("the clock of the week", () => {
  it("reads a time of day in minutes", () => {
    expect(minutes("00:00")).toBe(0);
    expect(minutes("08:45")).toBe(525);
    expect(minutes("17:50")).toBe(1070);
  });

  it.each([
    ["08:44", null],
    ["08:45", { slot: 0, share: 0 }],
    ["09:32", { slot: 0, share: 47 / 95 }],
    ["10:20", { slot: 0, share: 1 }],
    ["10:29", { slot: 0, share: 1 }],
    ["10:30", { slot: 1, share: 0 }],
    ["12:05", { slot: 1, share: 1 }],
    ["12:44", { slot: 1, share: 1 }],
    ["12:45", { slot: 2, share: 0 }],
    ["17:49", { slot: 4, share: 94 / 95 }],
    ["17:50", null],
    ["23:59", null],
  ])("places %s in the timetable", (time, place) => {
    expect(placeInDay(minutes(time))).toEqual(place);
  });
});

describe("the colours of the lesson types", () => {
  const css = readFileSync(join(import.meta.dirname, "../../themes/pora.css"), "utf8");
  const tokens: Record<string, { light: string; dark: string }> = {};
  for (const [, type = "", light = "", dark = ""] of css.matchAll(
    /--lesson-(\w+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi,
  )) {
    tokens[type] = { light, dark };
  }
  const hues = Object.fromEntries(
    LESSON_HUES.map(({ type, light, dark }) => [type, { light, dark }] as const),
  );

  it("are the theme's, in both modes", () => {
    expect(hues).toEqual(tokens);
  });
});

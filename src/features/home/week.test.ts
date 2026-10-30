import { describe, expect, it } from "vitest";

import { conflicts, DAYS, moved, nextSlot, OPENING, SCRIPT, SLOTS, type Lesson } from "./week";

describe("conflicts", () => {
  it("finds none in the opening week", () => {
    expect(conflicts(OPENING).size).toBe(0);
  });

  it("names both lessons in a shared slot", () => {
    const week = moved(OPENING, { id: "code", day: 2, slot: 0 });
    expect(conflicts(week)).toEqual(new Set(["base", "code"]));
  });
});

describe("nextSlot", () => {
  it("goes down the day, then to the next day", () => {
    expect(nextSlot({ id: "math", day: 0, slot: 0 })).toMatchObject({ day: 0, slot: 1 });
    expect(nextSlot({ id: "math", day: 0, slot: SLOTS - 1 })).toMatchObject({ day: 1, slot: 0 });
  });

  it("comes back to the start of the week", () => {
    const last: Lesson = { id: "math", day: DAYS - 1, slot: SLOTS - 1 };
    expect(nextSlot(last)).toMatchObject({ day: 0, slot: 0 });
  });
});

describe("the script", () => {
  it("alternates a conflict and its resolution", () => {
    let week = [...OPENING];
    const states = SCRIPT.map((move) => {
      week = moved(week, move);
      return conflicts(week).size > 0;
    });
    expect(states).toEqual([true, false, true, false, true, false]);
  });
});

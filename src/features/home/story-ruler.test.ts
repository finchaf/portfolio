import { describe, expect, it } from "vitest";

import { lensAt, tickKind } from "./story-ruler";

describe("the ruler's ticks", () => {
  it("go minor, middle, major, as on a real ruler", () => {
    const heights = [1, 5, 10].map((index) => tickKind(index).height);
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(3);
  });
});

describe("the lens around the needle", () => {
  it("is strongest under the needle and fades on both sides alike", () => {
    expect(lensAt(0)).toBe(1);
    expect(lensAt(20)).toBeLessThan(lensAt(5));
    expect(lensAt(-20)).toBe(lensAt(20));
  });

  it("leaves a far tick alone", () => {
    expect(lensAt(120)).toBe(0);
  });
});

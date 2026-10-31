import { describe, expect, it } from "vitest";

import { SCORE_DAYS, SCORE_MARKED, SCORE_ROWS } from "./story-data";
import { BEAT_WIDTH, BEATS, beatStart, combed, lineAt, rowAt } from "./story-score";

describe("the score", () => {
  it("starts as a knot, with no line lying on its row", () => {
    const off = Array.from({ length: SCORE_ROWS }, (_, row) =>
      Math.abs(lineAt(row, 0.5, 0) - rowAt(row)),
    );
    expect(Math.max(...off)).toBeGreaterThan(0.2);
  });

  it("ends with every line straight on its row, all the way along", () => {
    for (let row = 0; row < SCORE_ROWS; row += 1) {
      for (const along of [0, 0.25, 0.5, 0.75, 1]) {
        expect(lineAt(row, along, 1)).toBeCloseTo(rowAt(row), 5);
      }
    }
  });

  it("combs from the left: the start of a line is straight before its end", () => {
    expect(combed(0.5, 0.1)).toBeGreaterThan(combed(0.5, 0.9));
    expect(combed(0, 0)).toBe(0);
  });

  it("keeps its rows inside the picture", () => {
    expect(rowAt(0)).toBeGreaterThan(0);
    expect(rowAt(SCORE_ROWS - 1)).toBeLessThan(1);
  });

  it("gives every day lessons, the marked row too, and keeps them inside the week", () => {
    SCORE_DAYS.forEach((_, day) => {
      expect(BEATS.some((beat) => beat.day === day)).toBe(true);
    });
    expect(BEATS.some((beat) => beat.row === SCORE_MARKED)).toBe(true);
    BEATS.forEach((beat) => {
      expect(beatStart(beat) + BEAT_WIDTH).toBeLessThanOrEqual(1);
    });
  });

  it("fills the week enough to read as one", () => {
    expect(BEATS.length).toBeGreaterThan(40);
    expect(BEATS.filter((beat) => beat.row === SCORE_MARKED).length).toBeGreaterThan(5);
  });
});

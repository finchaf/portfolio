import { describe, expect, it } from "vitest";

import {
  DESK_STOPS,
  deskMomentAt,
  deskProgressOf,
  LAST_DESK_STOP,
  STOP_OF_TICK,
  TICK_OF,
} from "./desk-stops";

describe("the desk of the Projects chapter", () => {
  it("walks the stops in order, resting on each", () => {
    expect(deskMomentAt(0)).toEqual({ stop: 0, move: 0, rest: 0 });
    expect(deskMomentAt(1).stop).toBe(LAST_DESK_STOP);
    expect(deskMomentAt(1).rest).toBeCloseTo(1);
    for (let stop = 0; stop <= LAST_DESK_STOP; stop += 1) {
      const moment = deskMomentAt(deskProgressOf(stop));
      expect(moment.stop).toBe(stop);
      expect(moment.move).toBe(0);
    }
  });

  it("flies between two rests and never goes back", () => {
    let last = { stop: 0, move: 0 };
    for (let step = 0; step <= 200; step += 1) {
      const moment = deskMomentAt(step / 200);
      expect(moment.move === 0 || moment.rest === 0).toBe(true);
      expect(moment.move).toBeGreaterThanOrEqual(0);
      expect(moment.move).toBeLessThan(1);
      expect(moment.rest).toBeGreaterThanOrEqual(0);
      expect(moment.rest).toBeLessThanOrEqual(1);
      expect(moment.stop + moment.move).toBeGreaterThanOrEqual(last.stop + last.move);
      last = moment;
    }
  });

  it("gives every stop a tick, and every tick its first stop", () => {
    expect(TICK_OF).toHaveLength(DESK_STOPS.length);
    for (const [tick, stop] of STOP_OF_TICK.entries()) {
      expect(stop).toBe(TICK_OF.findIndex((each) => each === tick));
      expect(TICK_OF[stop]).toBe(tick);
    }
    expect(Math.max(...TICK_OF)).toBe(STOP_OF_TICK.length - 1);
  });
});

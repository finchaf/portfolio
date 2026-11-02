import { describe, expect, it } from "vitest";

import { BASE_FIGURES } from "@/lib/base-graph";

import { buildMap, LAST_STOP, momentAt, progressOf, settleMap, STOPS } from "./flow-map-graph";

describe("the map of Flow", () => {
  const map = buildMap({});

  it("draws every rule of the base and a node for every stop", () => {
    expect(map.nodes.filter(({ kind }) => kind === "rule")).toHaveLength(BASE_FIGURES.rules);
    expect(map.nodes.filter(({ kind }) => kind === "hub")).toHaveLength(16);
    expect(map.stops.map(({ stop }) => stop)).toEqual(STOPS.map((_, index) => index));
  });

  it("tells the first rule of the checklist it stops at", () => {
    expect(map.rule.hub).toBe(map.stops[5]);
  });

  it("settles into a shape within its bounds", () => {
    while (!settleMap(map, 50));
    expect(Math.max(...map.nodes.map(({ x, y }) => Math.max(Math.abs(x), Math.abs(y))))).toBe(1);
  });

  it("walks the stops in order, resting on each", () => {
    expect(momentAt(0)).toEqual({ stop: 0, move: 0, rest: 0 });
    expect(momentAt(1).stop).toBe(LAST_STOP);
    expect(momentAt(1).rest).toBeCloseTo(1);
    for (let stop = 0; stop <= LAST_STOP; stop += 1) {
      const moment = momentAt(progressOf(stop));
      expect(moment.stop).toBe(stop);
      expect(moment.move).toBe(0);
    }
  });
});

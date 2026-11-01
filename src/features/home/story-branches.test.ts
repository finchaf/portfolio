import { describe, expect, it } from "vitest";

import { branchRoutes } from "./story-branches";

const { routes, forks, tips } = branchRoutes(1440, 900);
const route = (line: string) => routes.find((each) => each.line === line);

describe("the branches", () => {
  it("come in from the left edge on one trunk", () => {
    expect(route("trunk")?.d.startsWith("M 0 ")).toBe(true);
    expect(route("trunk")?.from).toBe(0);
  });

  it("leave the trunk one at a time, each at a fork of its own", () => {
    expect(forks.open.x).toBeLessThan(forks.masters.x);
    expect(route("open")?.from).toBe(forks.open.x);
    expect(route("masters")?.from).toBe(forks.masters.x);
  });

  it("leave at an angle, never lying along the trunk", () => {
    const handle = /C ([\d.]+) ([\d.]+),/.exec(route("open")?.d ?? "");
    const [, x = "0", y = "0"] = handle ?? [];
    const rise = forks.open.y - Number(y);
    const run = Number(x) - forks.open.x;
    expect(rise).toBeGreaterThan(run);
  });

  it("run the last one off the right edge, into the next chapter", () => {
    const end = /L ([\d.]+) [\d.]+$/.exec(route("next")?.d ?? "");
    expect(Number(end?.[1])).toBeGreaterThan(1440);
  });

  it("keep their tips on the screen", () => {
    expect(tips.open.x).toBeLessThan(1440);
    expect(tips.masters.x).toBeLessThan(tips.open.x);
  });
});

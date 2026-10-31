import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HERO_SOURCE, SWITCH_SOURCE } from "./hero-source";

const read = (path: string) => readFileSync(join(import.meta.dirname, path), "utf8");

describe("the source under the lens", () => {
  const hero = read("hero.tsx");

  it.each(Object.values(HERO_SOURCE).flat())("%s is in the first screen", (line) => {
    expect(hero).toContain(line.trim());
  });

  it.each(SWITCH_SOURCE)("%s is in the lens", (line) => {
    expect(read("hero-lens.tsx")).toContain(line.trim());
  });
});

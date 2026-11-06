import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HERO_FACE, HERO_SOURCE, SWITCH_SOURCE } from "./hero-source";

const read = (path: string) => readFileSync(join(import.meta.dirname, path), "utf8");

/** Tailwind's weights by the name of their class. */
const WEIGHTS: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

describe("the source under the lens", () => {
  const hero = read("hero.tsx");

  it.each(Object.values(HERO_SOURCE).flat())("%s is in the first screen", (line) => {
    expect(hero).toContain(line.trim());
  });

  it.each(SWITCH_SOURCE)("%s is in the lens", (line) => {
    expect(read("hero-lens.tsx")).toContain(line.trim());
  });
});

describe("the face the lens names", () => {
  const [, family, weight] = /^(.+) (\d{3})$/.exec(HERO_FACE) ?? [];
  const name = /<h1 className="(hero-name [^"]*)"/.exec(read("hero.tsx"))?.[1]?.split(" ") ?? [];

  it("is the home theme's display family", () => {
    const display = /--display:\s*"([^"]+)"/.exec(read("../../themes/home.css"))?.[1];
    expect(name).toContain("font-display");
    expect(display).toBe(`${String(family)} Variable`);
  });

  it("is the weight of the name", () => {
    const weights = name.flatMap((part) => WEIGHTS[part.replace(/^font-/, "")] ?? []);
    expect(weights).toEqual([Number(weight)]);
  });
});

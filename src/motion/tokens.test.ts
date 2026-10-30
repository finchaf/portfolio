import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DURATION, EASE } from "./tokens";

const css = readFileSync(join(import.meta.dirname, "tokens.css"), "utf8");

function variable(name: string): string | undefined {
  return new RegExp(`--${name}: ([^;]+);`).exec(css)?.[1];
}

describe("the CSS variables", () => {
  it.each(Object.entries(DURATION))("hold the duration %s", (name, seconds) => {
    expect(variable(`duration-${name}`)).toBe(`${seconds}s`);
  });

  it.each([
    ["ease-out", EASE.out],
    ["ease-in-out", EASE.inOut],
  ])("hold the curve %s", (name, curve) => {
    expect(variable(name)).toBe(curve);
  });
});

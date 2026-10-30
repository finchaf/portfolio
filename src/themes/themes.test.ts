import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const THEMES = ["home", "pora", "flow", "projects"];

const COLORS = [
  "page",
  "surface",
  "raised",
  "ink",
  "muted",
  "line",
  "accent",
  "accent-strong",
  "on-accent",
  "success",
  "warning",
  "danger",
];
const FONTS = ["sans", "display", "mono"];

/** The WCAG ratios a pair must reach: 4.5 is AA for text, 3 for large text and indicators. */
const CONTRASTS = [
  ["ink", "page", 7],
  ["muted", "page", 4.5],
  ["muted", "surface", 4.5],
  ["ink", "raised", 4.5],
  ["accent-strong", "page", 4.5],
  ["on-accent", "accent-strong", 4.5],
  ["accent", "page", 3],
] as const;

function read(theme: string): string {
  return readFileSync(join(import.meta.dirname, `${theme}.css`), "utf8");
}

/** The `light` or `dark` half of a variable's light-dark() pair. */
function value(css: string, name: string, mode: 0 | 1): string {
  const pair = new RegExp(`--${name}: light-dark\\((.+?), (#[0-9a-f]{6}|rgb\\([^)]*\\))\\);`).exec(
    css,
  );
  if (!pair) throw new Error(`--${name} is not a light-dark() pair`);
  return pair[mode + 1] ?? "";
}

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high = 0, low = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

describe.each(THEMES)("the %s theme", (theme) => {
  const css = read(theme);

  it.each(COLORS)("gives --%s a value in both modes", (name) => {
    expect(value(css, name, 0)).not.toBe("");
    expect(value(css, name, 1)).not.toBe("");
  });

  it.each(FONTS)("names --%s with a fallback", (name) => {
    expect(new RegExp(`--${name}:[^;]*(sans-serif|monospace);`).test(css)).toBe(true);
  });

  describe.each([
    ["light", 0],
    ["dark", 1],
  ] as const)("in the %s mode", (_, mode) => {
    it.each(CONTRASTS)("%s on %s reaches %d:1", (foreground, background, ratio) => {
      expect(
        contrast(value(css, foreground, mode), value(css, background, mode)),
      ).toBeGreaterThanOrEqual(ratio);
    });
  });
});

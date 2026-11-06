import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE = join(import.meta.dirname, "..");

const stylesheets = readdirSync(SOURCE, { recursive: true, encoding: "utf8" }).filter((path) =>
  path.endsWith(".css"),
);

/**
 * The only filter shadow allowed, and why it costs nothing: the lesson of «Пора на пару» laid flat on
 * the page when the scene does not run, painted once.
 */
const ALLOWED: Record<string, number> = { "features/home/work-pora.css": 1 };

describe("the shadows", () => {
  // WebKit blurs every pixel of a picture under `drop-shadow` anew each time its frame comes back on
  // screen: on the phones of «Пора на пару» that took up to 180 ms a frame. A box casts its shadow
  // with `box-shadow`, drawn from a template.
  it.each(stylesheets)("%s blurs no picture on the way", (path) => {
    const found = readFileSync(join(SOURCE, path), "utf8").split("drop-shadow(").length - 1;
    expect(found).toBe(ALLOWED[path] ?? 0);
  });
});

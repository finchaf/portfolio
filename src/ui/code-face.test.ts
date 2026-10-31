import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE = join(import.meta.dirname, "..");

const stylesheets = readdirSync(SOURCE, { recursive: true, encoding: "utf8" }).filter((path) =>
  path.endsWith(".css"),
);

describe("the hatching", () => {
  // Gecko loses most of a thin repeating gradient, at random: code-face.css draws it with a tile.
  it.each(stylesheets)("%s draws no repeating gradient", (path) => {
    expect(readFileSync(join(SOURCE, path), "utf8")).not.toContain("repeating-");
  });
});

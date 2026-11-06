import { readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { DAYS, FACTS, GATES, JOURNAL } from "./project-facts";

describe("the facts of this site's page", () => {
  it("list every record of the journal, and count them", () => {
    const files = readdirSync("docs/01-architecture/decisions")
      .filter((name) => /^\d{4}-.+\.md$/.test(name))
      .map((name) => name.replace(/\.md$/, ""))
      .sort();
    expect([...JOURNAL]).toEqual(files);
    expect(FACTS.decisions).toBe(files.length);
  });

  // The page shows each pair side by side: one changed by hand without the other shows two numbers.
  it("count the gates of their table", () => {
    expect(FACTS.checks).toBe(GATES.length);
  });

  it("count the commits of their days", () => {
    expect(DAYS.reduce((sum, [, , commits]) => sum + commits, 0)).toBe(FACTS.commits);
  });
});

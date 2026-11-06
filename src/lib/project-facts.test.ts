import { readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { FACTS, JOURNAL } from "./project-facts";

describe("the facts of this site's page", () => {
  it("list every record of the journal, and count them", () => {
    const files = readdirSync("docs/01-architecture/decisions")
      .filter((name) => /^\d{4}-.+\.md$/.test(name))
      .map((name) => name.replace(/\.md$/, ""))
      .sort();
    expect([...JOURNAL]).toEqual(files);
    expect(FACTS.decisions).toBe(files.length);
  });
});

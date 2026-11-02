import { describe, expect, it } from "vitest";

import { BASE_FIGURES, CHECKLISTS } from "./base-graph";

describe("the base", () => {
  it("holds the rules it says it holds", () => {
    expect(CHECKLISTS).toHaveLength(16);
    expect(CHECKLISTS.reduce((sum, [, rules]) => sum + rules, 0)).toBe(BASE_FIGURES.rules);
  });
});

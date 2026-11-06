import { describe, expect, it } from "vitest";

import { fill } from "./strings";

describe("fill", () => {
  it("puts the words in their places", () => {
    expect(fill("{x} of {y}", "3", "5")).toBe("3 of 5");
    expect(fill("opened {x}", "flow")).toBe("opened flow");
  });

  it("leaves an empty second place without a second word", () => {
    expect(fill("{x}{y}!", "ok")).toBe("ok!");
  });

  it("keeps a template without places as it is", () => {
    expect(fill("nothing here", "a", "b")).toBe("nothing here");
  });
});

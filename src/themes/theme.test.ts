import { describe, expect, it } from "vitest";

import { parseTheme } from "./theme";

describe("parseTheme", () => {
  it("keeps a choice", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
  });

  it("falls back to the system on anything else", () => {
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme("sepia")).toBe("system");
  });
});

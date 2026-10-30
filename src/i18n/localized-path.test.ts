import { describe, expect, it } from "vitest";

import { localizedPath, switchLocale } from "./localized-path";

describe("localizedPath", () => {
  it("prefixes a page with its language", () => {
    expect(localizedPath("en", "/flow")).toBe("/en/flow");
  });

  it("gives the home page the bare prefix", () => {
    expect(localizedPath("ru", "")).toBe("/ru");
  });
});

describe("switchLocale", () => {
  it("keeps the page and changes the language", () => {
    expect(switchLocale("/ru/projects", "en")).toBe("/en/projects");
  });

  it("works on the home page", () => {
    expect(switchLocale("/en", "ru")).toBe("/ru");
  });
});

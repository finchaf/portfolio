import { describe, expect, it } from "vitest";

import { localizedPath, switchLocale } from "./localized-path";

describe("localizedPath", () => {
  it("prefixes a page with its language", () => {
    expect(localizedPath("en", "/flow")).toBe("/en/flow");
  });

  it("gives the home page the bare prefix", () => {
    expect(localizedPath("ru", "")).toBe("/ru");
  });

  it("takes only a page of the site", () => {
    // @ts-expect-error -- "/" is no page's path: the home page is "", and "/ru/" is a redirect.
    expect(localizedPath("ru", "/")).toBe("/ru/");
  });
});

describe("switchLocale", () => {
  it("keeps the page and changes the language", () => {
    expect(switchLocale("/ru/projects", "en")).toBe("/en/projects");
  });

  it("works on the home page", () => {
    expect(switchLocale("/en", "ru")).toBe("/ru");
  });

  it("keeps a page inside a page", () => {
    expect(switchLocale("/en/projects/latex", "ru")).toBe("/ru/projects/latex");
  });
});

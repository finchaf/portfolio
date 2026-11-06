import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { parseTheme, THEME_SCRIPT, THEME_STORAGE_KEY } from "./theme";

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

/**
 * Runs the inline script of <head> against a page at `pathname` whose storage answers `getItem`,
 * and gives back what it left on <html>. The browser's own run is in e2e/themes.spec.ts.
 */
function runThemeScript(pathname: string, getItem: (key: string) => string | null) {
  const dataset: Record<string, string> = {};
  runInNewContext(THEME_SCRIPT, {
    document: { documentElement: { dataset } },
    location: { pathname },
    localStorage: { getItem },
  });
  return dataset;
}

describe("the theme script", () => {
  it("puts a stored light or dark on the page", () => {
    for (const theme of ["light", "dark"]) {
      const asked: string[] = [];
      const dataset = runThemeScript("/ru/flow", (key) => {
        asked.push(key);
        return theme;
      });
      expect(asked).toEqual([THEME_STORAGE_KEY]);
      expect(dataset.theme).toBe(theme);
    }
  });

  it.each([
    ["junk", () => "sepia"],
    ["nothing", () => null],
    [
      "a storage that throws",
      () => {
        throw new Error("blocked");
      },
    ],
  ])("leaves the system's mode for %s", (_, getItem) => {
    const dataset = runThemeScript("/en", getItem);
    expect(dataset).not.toHaveProperty("theme");
    expect(dataset).toHaveProperty("js", "");
  });

  it.each(["/ru", "/en"])("starts the intro on %s", (pathname) => {
    const dataset = runThemeScript(pathname, () => null);
    expect(dataset).toHaveProperty("intro", "");
    expect(dataset).toHaveProperty("js", "");
  });

  it.each(["/", "/ru/", "/ru/flow", "/en/projects", "/de", "/rus"])(
    "keeps the intro off on %s",
    (pathname) => {
      const dataset = runThemeScript(pathname, () => "dark");
      expect(dataset).not.toHaveProperty("intro");
      expect(dataset).toHaveProperty("js", "");
    },
  );
});

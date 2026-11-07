import { runInNewContext } from "node:vm";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseTheme,
  readTheme,
  saveTheme,
  THEME_CHANGE_EVENT,
  THEME_SCRIPT,
  THEME_STORAGE_KEY,
} from "./theme";

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

/** A page for saveTheme: its <html>, the events it heard and a storage that may refuse. */
function stubPage(refuse = false) {
  const kept = new Map<string, string>();
  const heard: string[] = [];
  const dataset: Record<string, string> = {};
  const refused = () => {
    throw new Error("blocked");
  };
  vi.stubGlobal("document", { documentElement: { dataset } });
  vi.stubGlobal("window", { dispatchEvent: (event: Event) => heard.push(event.type) });
  vi.stubGlobal("localStorage", {
    getItem: refuse ? refused : (key: string) => kept.get(key) ?? null,
    setItem: refuse ? refused : (key: string, value: string) => kept.set(key, value),
    removeItem: refuse ? refused : (key: string) => kept.delete(key),
  });
  return { kept, heard, dataset };
}

describe("saveTheme", () => {
  afterEach(() => {
    // A kept choice clears the one held for a refusing page, so the next test starts clean.
    stubPage();
    saveTheme("system");
    vi.unstubAllGlobals();
  });

  it("keeps a mode, puts it on the page and tells the switchers", () => {
    const { kept, heard, dataset } = stubPage();
    saveTheme("dark");
    expect(kept.get(THEME_STORAGE_KEY)).toBe("dark");
    expect(dataset.theme).toBe("dark");
    expect(heard).toEqual([THEME_CHANGE_EVENT]);
    expect(readTheme()).toBe("dark");
  });

  it("keeps the system's mode as no key at all", () => {
    const { kept, dataset } = stubPage();
    saveTheme("light");
    saveTheme("system");
    expect(kept.has(THEME_STORAGE_KEY)).toBe(false);
    expect(dataset).not.toHaveProperty("theme");
    expect(readTheme()).toBe("system");
  });

  it("holds a refused choice for the page", () => {
    const { heard, dataset } = stubPage(true);
    saveTheme("light");
    expect(dataset.theme).toBe("light");
    expect(heard).toEqual([THEME_CHANGE_EVENT]);
    expect(readTheme()).toBe("light");
  });
});

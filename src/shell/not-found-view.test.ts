import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { LOST_SCRIPT } from "./not-found-view";

/** Runs the 404's inline script at `pathname` for a reader whose browser speaks `language`. */
function runLostScript(pathname: string, language: string) {
  const root = { lang: "", dataset: {} as Record<string, string> };
  runInNewContext(LOST_SCRIPT, {
    document: { documentElement: root },
    location: { pathname },
    navigator: { language },
  });
  expect(root.dataset.lost).toBe(root.lang);
  return root.lang;
}

describe("the language of the 404", () => {
  it.each([
    ["/en/nowhere", "ru-RU", "en"],
    ["/en", "ru", "en"],
    ["/ru/nowhere", "en-US", "ru"],
    ["/ru", "de", "ru"],
  ])("is the one %s asks for, whatever the browser's %s", (pathname, language, lang) => {
    expect(runLostScript(pathname, language)).toBe(lang);
  });

  it.each([
    ["ru", "ru"],
    ["ru-RU", "ru"],
    ["RU", "ru"],
    ["en-GB", "en"],
    ["de", "en"],
    ["rus", "en"],
  ])("of an address without one follows a browser in %s", (language, lang) => {
    expect(runLostScript("/nowhere", language)).toBe(lang);
  });
});

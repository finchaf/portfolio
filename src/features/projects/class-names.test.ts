import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const HERE = import.meta.dirname;

/** What the design system owns: a page may dress a control, and these are not its to name. */
const SHARED = /^control-/;

/** The classes a stylesheet's selectors name, without its comments and values. */
function classes(css: string) {
  const selectors = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{[^{}]*\}/g, "{}")
    .replace(/\{[^{}]*\}/g, "{}");
  return [...selectors.matchAll(/(?<![\w.-])\.([a-zA-Z][\w-]*)/g)].flatMap(([, name]) =>
    name ? [name] : [],
  );
}

describe("the stylesheets of the Projects pages", () => {
  // The sheets of every page visited stay loaded on a move inside the site, so a short name here
  // meets the same name of another page: the board fell apart that way, and only on a route.
  it("name nothing without the prefix", () => {
    const sheets = readdirSync(HERE).filter((file) => file.endsWith(".css"));
    const names = sheets.flatMap((file) => classes(readFileSync(join(HERE, file), "utf8")));
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => !name.startsWith("pj-") && !SHARED.test(name))).toEqual([]);
  });
});

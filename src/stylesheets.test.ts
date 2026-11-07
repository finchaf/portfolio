import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE = import.meta.dirname;

const stylesheets = readdirSync(SOURCE, { recursive: true, encoding: "utf8" })
  .filter((path) => path.endsWith(".css"))
  .sort();

const sources = new Map(
  stylesheets.map((path) => [path, readFileSync(join(SOURCE, path), "utf8")]),
);

function source(path: string) {
  const css = sources.get(path);
  if (css === undefined) throw new Error(`${path} is not a stylesheet of src`);
  return css;
}

interface Rule {
  /** The blocks the rule sits in, outermost first: `@media (…) > .a`. Empty at the top. */
  context: string;
  /** What stands before its brace: a selector, or an at-rule with its condition. */
  prelude: string;
  declarations: { property: string; value: string }[];
}

/** The rules of a stylesheet in order, without its comments; a string may hold a brace. */
function rules(css: string) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found: Rule[] = [];
  const open: { context: string; rule?: Rule }[] = [{ context: "" }];
  let start = 0;
  for (let at = 0; at < text.length; at++) {
    const char = text[at];
    if (char === '"' || char === "'") {
      do at += text[at] === "\\" ? 2 : 1;
      while (at < text.length && text[at] !== char);
      continue;
    }
    if (char !== "{" && char !== "}" && char !== ";") continue;
    const piece = text.slice(start, at).trim().replace(/\s+/g, " ");
    start = at + 1;
    const block = open.at(-1) ?? { context: "" };
    if (char === "{") {
      const rule: Rule = { context: block.context, prelude: piece, declarations: [] };
      found.push(rule);
      open.push({ context: block.context ? `${block.context} > ${piece}` : piece, rule });
      continue;
    }
    const declaration = /^(-{0,2}[\w-]+)\s*:([\s\S]*)$/.exec(piece);
    if (declaration?.[1] && declaration[2] !== undefined)
      block.rule?.declarations.push({ property: declaration[1], value: declaration[2].trim() });
    if (char === "}") open.pop();
  }
  return found;
}

const parsed = new Map(stylesheets.map((path) => [path, rules(source(path))]));

/** The style rules of a sheet: at-rules and the steps of a keyframe are not selectors. */
function styleRules(path: string) {
  return (parsed.get(path) ?? []).filter(
    ({ context, prelude }) => !prelude.startsWith("@") && !/@keyframes\b/.test(context),
  );
}

/** The class names a sheet's selectors use, each once, in order. */
function classes(path: string) {
  const names = (parsed.get(path) ?? []).flatMap(({ prelude }) =>
    [...prelude.matchAll(/(?<![\w.-])\.([a-zA-Z][\w-]*)/g)].flatMap(([, name]) =>
      name ? [name] : [],
    ),
  );
  return [...new Set(names)].sort();
}

const unique = (items: string[]) => [...new Set(items)].sort();

describe("the hatching", () => {
  // Gecko loses most of a thin repeating gradient, at random: code-face.css draws it with a tile.
  it.each(stylesheets)("%s draws no repeating gradient", (path) => {
    expect(source(path)).not.toContain("repeating-");
  });
});

/**
 * The only filter shadow allowed, and why it costs nothing: the lesson of «Пора на пару» laid flat on
 * the page when the scene does not run, painted once.
 */
const DROP_SHADOWS: Record<string, number> = { "features/home/work-pora.css": 1 };

describe("the shadows", () => {
  // WebKit blurs every pixel of a picture under `drop-shadow` anew each time its frame comes back on
  // screen: on the phones of «Пора на пару» that took up to 180 ms a frame. A box casts its shadow
  // with `box-shadow`, drawn from a template.
  it.each(stylesheets)("%s blurs no picture on the way", (path) => {
    expect(source(path).split("drop-shadow(").length - 1).toBe(DROP_SHADOWS[path] ?? 0);
  });
});

/**
 * Every stylesheet of src and the prefixes its own classes carry, as
 * docs/02-project-structure/repository.md lists them, with the blocks it dresses: a chapter of the
 * home page dresses the board, a page dresses a control. A prefix stands alone or with its dash,
 * `footer` and `footer-bar`. A sheet that owns nothing names no class.
 */
const SHEETS: Record<string, { own: string[]; dresses?: string[] }> = {
  "app/globals.css": { own: [] },
  "features/flow/flow.css": { own: [] },
  "features/home/after-work.css": { own: ["exp", "talk"], dresses: ["link-code"] },
  "features/home/flow-map.css": { own: ["map"], dresses: ["chapter", "stop"] },
  "features/home/scenes.css": {
    own: ["hero", "story", "chapter", "stop"],
    dresses: ["capsule", "code", "segmented"],
  },
  "features/home/work-pora.css": { own: ["pair"], dresses: ["chapter", "stop"] },
  "features/home/work-projects.css": { own: ["desk"], dresses: ["chapter", "stop", "pj"] },
  "features/pora/pora.css": { own: ["pora"] },
  "features/projects/latex.css": { own: ["pj"] },
  "features/projects/portfolio.css": { own: ["pj"] },
  "features/projects/projects.css": { own: ["pj"], dresses: ["control"] },
  "motion/tokens.css": { own: [] },
  "shell/capsule.css": { own: ["capsule"] },
  "shell/dot-cursor.css": { own: ["dot"] },
  "shell/footer.css": { own: ["footer"] },
  "shell/not-found.css": { own: ["lost"] },
  "shell/page-change.css": { own: ["world"], dresses: ["dot"] },
  "shell/write.css": { own: ["write"], dresses: ["link-code"] },
  "themes/flow-looks.css": { own: [] },
  "themes/flow.css": { own: [] },
  "themes/home.css": { own: [] },
  "themes/pora.css": { own: [] },
  "themes/projects.css": { own: [] },
  "themes/tokens.css": { own: [] },
  "ui/app-screens.css": { own: [] },
  "ui/board/board.css": { own: ["pj"] },
  "ui/code-face.css": { own: ["code"] },
  "ui/control.css": { own: ["control"] },
  "ui/scroll-bar.css": { own: ["scroll"] },
  "ui/segmented.css": { own: ["segmented"] },
};

/** Utilities Tailwind makes from the theme, which the markup carries and a sheet may select. */
const UTILITIES = ["fill-accent", "fill-ink", "font-display"];

/**
 * The names that carry no prefix on 07.11.2026, sheet by sheet. Each rename takes its names off this
 * list, and the test fails on a name that is gone: the list only shrinks.
 */
const UNPREFIXED: Record<string, string[]> = {
  "features/flow/flow.css": [
    "backlinks",
    "base",
    "board",
    "board-row",
    "callout",
    "callout-title",
    "checkbox",
    "chip",
    "clickable-icon",
    "code-block",
    "collapse-icon",
    "compare",
    "compare-ctl",
    "compare-row",
    "crumb-current",
    "crumb-sep",
    "cutline",
    "d-phone",
    "device",
    "dock-left",
    "dock-right",
    "dock-tab-group",
    "dock-tabs",
    "external-link",
    "figures",
    "frame",
    "graph-canvas",
    "graph-controls",
    "graph-note",
    "icons",
    "id",
    "inline-title",
    "internal-link",
    "l",
    "ladder",
    "lane",
    "lane-head",
    "lanes",
    "lanes-svg",
    "left-panel",
    "md-h2",
    "md-h3",
    "menu",
    "menu-item",
    "metadata",
    "metadata-add",
    "metadata-heading",
    "metadata-property",
    "mk",
    "mobile-bar",
    "mobile-crumb",
    "mod-cta",
    "nav-children",
    "nav-count",
    "nav-file",
    "nav-files",
    "nav-folder",
    "nav-folder-title",
    "nav-header",
    "node",
    "note",
    "note-cta",
    "note-source",
    "note-view",
    "notes",
    "notice",
    "notices",
    "outline",
    "p",
    "panel-empty",
    "panel-pair",
    "panel-row",
    "pen",
    "popover",
    "prompt",
    "prompt-hint",
    "prompt-shade",
    "prop-date",
    "prop-live",
    "prop-pill",
    "prop-pills",
    "ribbon",
    "right-body",
    "right-panel",
    "root-split",
    "rungs",
    "scrim",
    "scroll-thumb",
    "sdir",
    "sdir-name",
    "search-input",
    "search-results",
    "seg",
    "shelf",
    "shelf-screens",
    "sidebar",
    "status-bar",
    "store",
    "style-tokens",
    "tab",
    "tab-go",
    "tab-list",
    "tab-spacer",
    "tab-strip",
    "tab-x",
    "table-wrap",
    "tag",
    "term",
    "term-chips",
    "term-field",
    "term-fold",
    "term-foot",
    "term-ghost",
    "term-grip",
    "term-head",
    "term-line",
    "term-log",
    "term-note",
    "term-now",
    "term-ps1",
    "term-tab",
    "tooltip",
    "tx",
    "typing",
    "vault",
    "vault-profile",
    "vault-switcher",
    "vault-titlebar",
    "view-actions",
    "view-crumb",
    "view-header",
    "view-nav",
    "wide",
    "workspace",
  ],
  // Names of ui/app-screens.css: the chapter dresses the screens it shows.
  "features/home/flow-map.css": ["appicon", "d-phone", "demo", "frame"],
  // The section of the works, the block after it and the title of the finale.
  "features/home/scenes.css": ["after-work", "finale-title", "work"],
  // The layer that leads a page in.
  "shell/page-change.css": ["page-lead"],
  "ui/app-screens.css": [
    "appicon",
    "arc",
    "axis",
    "bar",
    "ben",
    "d-bar",
    "d-body",
    "d-btn",
    "d-check",
    "d-menu",
    "d-phone",
    "d-title",
    "days",
    "dots",
    "fine",
    "frame",
    "hyp",
    "memo",
    "moon",
    "note-view",
    "plan",
    "plans",
    "ring",
    "round",
    "s-home",
    "s-night",
    "s-paywall",
    "s-welcome",
    "sb",
    "scr",
    "scr-cta",
    "shot",
    "sky",
    "st",
    "stats",
    "tabbar",
    "tx",
    "ui",
    "v",
    "vault",
    "w-b",
    "w-d",
    "w-l",
    "w-r",
    "week",
    "wf",
    "x",
  ],
};

describe("the class names", () => {
  it("cover every stylesheet of src, and only those", () => {
    expect(Object.keys(SHEETS).sort()).toEqual(stylesheets);
  });

  it("are the prefixes the repository lists", () => {
    const doc = readFileSync(
      join(SOURCE, "..", "docs", "02-project-structure", "repository.md"),
      "utf8",
    );
    const rule = /\*\*Классы блока с префиксом\.\*\*([\s\S]*?)\n- \*\*/.exec(doc)?.[1] ?? "";
    const listed = [...rule.matchAll(/`([a-z]+)-`/g)].flatMap(([, prefix]) =>
      prefix ? [prefix] : [],
    );
    expect(listed.length).toBeGreaterThan(0);
    expect(unique(listed)).toEqual(unique(Object.values(SHEETS).flatMap(({ own }) => own)));
  });

  // The sheets of every page visited stay loaded on a move inside the site, so a short name in one
  // meets the same name of another page: the board fell apart that way, and only on a route.
  it.each(stylesheets)("%s names nothing without its prefix", (path) => {
    const { own, dresses = [] } = SHEETS[path] ?? { own: [] };
    const prefixes = [...own, ...dresses];
    const allowed = (name: string) =>
      prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}-`)) ||
      UTILITIES.includes(name);
    expect(classes(path).filter((name) => !allowed(name))).toEqual(UNPREFIXED[path] ?? []);
  });
});

/** Colours written as values on 07.11.2026, outside the themes. The list only shrinks. */
const LITERAL_COLOURS: Record<string, string[]> = {
  "features/flow/flow.css": [
    "#3f3f3f",
    "#666666",
    "#ababab",
    "#dadada",
    "#fafafa",
    "rgb(0 0 0 / 12%)",
    "rgb(0 0 0 / 20%)",
    "rgb(0 0 0 / 30%)",
    "rgb(0 0 0 / 50%)",
    "rgb(0 0 0 / 7%)",
    "rgb(0 0 0 / 90%)",
  ],
  "ui/app-screens.css": [
    "#2f6fed",
    "#5b50a8",
    "#6c6c78",
    "#b5b3c9",
    "#bcbcc8",
    "#d3d3dc",
    "#dcd8f6",
    "#e2e2e8",
    "#e9e9ee",
    "#ecebf3",
    "#f4f4f6",
    "#fff",
    "#ffffff",
  ],
};

describe("the colours", () => {
  // A colour comes from a theme's token, in both modes (ADR-0010). A mask is no colour: its black
  // only says how much shows through.
  it.each(stylesheets.filter((path) => !path.startsWith("themes/")))(
    "%s takes its colours from the themes",
    (path) => {
      const literals = (parsed.get(path) ?? []).flatMap(({ declarations }) =>
        declarations
          .filter(({ property }) => !/^(-webkit-)?mask/.test(property))
          .flatMap(({ value }) =>
            [
              ...value
                .replace(/url\([^)]*\)/g, "")
                .matchAll(
                  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/g,
                ),
            ].map(([literal]) => literal.toLowerCase()),
          ),
      );
      expect(unique(literals)).toEqual(LITERAL_COLOURS[path] ?? []);
    },
  );
});

/** Selectors that set a property again in the same block on 07.11.2026. The list only shrinks. */
const OVERRIDDEN: Record<string, string[]> = {
  // `--footer-rule`: the home page's value, further down, replaces the first one.
  "shell/footer.css": [".footer"],
  // The block of the wireframes twice over, and three blocks resized right below themselves.
  "ui/app-screens.css": [
    ".ben",
    ".memo",
    ".scr-cta",
    ".w-b",
    ".w-b, .w-l, .w-r, .w-d",
    ".w-b.c",
    ".w-b.h",
    ".w-b.p",
    ".w-b.q",
    ".w-b.round",
    ".w-d",
    ".w-l",
    ".w-l.s",
    ".w-r",
    ".wf",
  ],
};

describe("the rules", () => {
  // A selector may come back further down, a section of its own; but a property it sets twice in the
  // same block keeps only the last value, and the first is dead: the copy of a block, most often.
  it.each(stylesheets)("%s sets no property of a selector twice in one block", (path) => {
    const seen = new Map<string, Set<string>>();
    const twice: string[] = [];
    for (const { context, prelude, declarations } of styleRules(path)) {
      const key = `${context} :: ${prelude}`;
      const before = seen.get(key) ?? new Set<string>();
      if (declarations.some(({ property }) => before.has(property))) twice.push(prelude);
      for (const { property } of declarations) before.add(property);
      seen.set(key, before);
    }
    expect(unique(twice)).toEqual(OVERRIDDEN[path] ?? []);
  });
});

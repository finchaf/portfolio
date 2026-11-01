// The link pictures as HTML: one card a page and a language, drawn from the site's own tokens, fonts,
// logo and strings. build.ts photographs them; a unit test compares `digest` with the manifest, so a
// change to any of these sources that leaves the pictures old fails the gates.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { LOCALES, type Locale } from "../../src/i18n/locales.ts";
import { PAGE_PATHS, PAGES } from "../../src/lib/pages.ts";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)));
const text = (path: string) => read(path).toString("utf8");

const THEMES = ["home", "pora", "flow", "projects"];

/** The faces the cards are set in, with the subsets they use. */
const FONTS = ["geist", "inter", "jetbrains-mono", "nunito"];
const SUBSETS = /-(latin|cyrillic)-wght-normal\.woff2/;

/** When the one lesson on the card starts. A picture, as the week in the demonstration is. */
const LESSON_START = "09:00";

export const SIZE = { width: 1200, height: 630 };

export const CARDS = LOCALES.flatMap((locale) =>
  Object.values(PAGES).map((card) => ({ locale, card, key: `${locale}/${card}` })),
);

type Card = (typeof CARDS)[number]["card"];

const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** The strings of the cards, which the site already shows. */
function strings(locale: Locale) {
  const { work } = JSON.parse(text(`../../messages/${locale}/home.json`)) as {
    work: {
      pora: { week: { days: { mon: string }; lessons: { math: string } } };
      flow: { steps: { brief: { command: string } } };
      projects: { site: { file: string }; thesis: { file: string } };
    };
  };
  return {
    day: work.pora.week.days.mon,
    subject: work.pora.week.lessons.math,
    command: work.flow.steps.brief.command,
    site: work.projects.site.file,
    thesis: work.projects.thesis.file,
  };
}

/** The word of the logo in its own outlines. */
function wordmark() {
  const source = text("../../src/ui/logo.tsx");
  const paths = [...source.slice(source.indexOf("Wordmark")).matchAll(/ d="([^"]+)"/g)];
  return paths.map(([, shape]) => `<path d="${shape ?? ""}"/>`).join("");
}

/** `\finchaf{flow}`: the logo is a command, and the argument is the page's own address. */
function sign(card: Card) {
  const argument = PAGE_PATHS.find((path) => PAGES[path] === card)?.slice(1);
  return `<span class="sign">\\finchaf<i>{${argument ?? ""}}</i></span>`;
}

const mark = (kind: string) =>
  `<svg class="mark mark-${kind}" viewBox="0 0 4420 940"><use href="#word"/></svg>`;

const zone = (world: string, body: string) =>
  `<div class="zone" data-tint="${world}" data-tint-fonts>${body}</div>`;

const field = (world: string, body = "") =>
  `<div class="field" data-tint="${world}" data-tint-fonts>${body}</div>`;

const BODIES: Record<Card, (words: ReturnType<typeof strings>) => string> = {
  // The two faces of the first screen, on the two sides of the slash.
  home: () =>
    zone(
      "home",
      `<svg class="tile-defs"><defs><pattern id="hatch" width="7" height="7"
        patternTransform="scale(14.7)" patternUnits="userSpaceOnUse">
        <path class="hatch-line" d="M-1 8 8-1M-1 1 1-1M6 8 8 6"/></pattern></defs></svg>
      ${mark("plan")}${mark("hatch")}`,
    ) + field("home", mark("solid")),

  pora: ({ day, subject }) =>
    zone("pora", sign("pora")) +
    field("pora") +
    `<div class="lesson" data-tint="pora" data-tint-fonts>
      <span class="time">${escape(`${day} ${LESSON_START}`)}</span>
      <span class="subject">${escape(subject)}</span>
    </div>`,

  flow: ({ command }) => {
    const [prompt = "", name = "", argument = ""] = command.split(" ");
    return (
      zone(
        "flow",
        `${sign("flow")}<span class="command"><b>${escape(prompt)}</b> ${escape(name)}
  ${escape(argument)}<u></u></span>`,
      ) +
      field("flow") +
      `<div class="over" data-tint="flow" data-tint-fonts><span class="hash">#</span></div>`
    );
  },

  projects: ({ site, thesis }) =>
    zone(
      "projects",
      `<i class="band band-danger"></i><i class="band band-peach"></i><i class="band band-warning"></i>
      <i class="band band-success"></i><i class="band band-blue"></i>
      ${sign("projects")}
      <span class="folder folder-site">${escape(site)}</span>
      <span class="folder folder-thesis">${escape(thesis)}</span>`,
    ),
};

/** `@font-face` rules with the files inside them: a page set from a string can load nothing else. */
function fontFaces() {
  return FONTS.flatMap((font) => {
    const directory = `../../node_modules/@fontsource-variable/${font}/`;
    return text(`${directory}index.css`)
      .split("@font-face")
      .filter((rule) => SUBSETS.test(rule))
      .map((rule) => {
        const file = /url\(\.\/(files\/[^)]+)\)/.exec(rule)?.[1] ?? "";
        const data = read(`${directory}${file}`).toString("base64");
        return `@font-face${rule.replace(
          /url\([^)]+\)/,
          `url(data:font/woff2;base64,${data})`,
        )}`.replace(/\/\*[^*]*\*\/\s*$/, "");
      });
  }).join("\n");
}

const STYLE = [
  ...THEMES.map((theme) => text(`../../src/themes/${theme}.css`)),
  fontFaces(),
  text("./card.css"),
].join("\n");

const WORD = `<svg class="tile-defs"><symbol id="word" viewBox="0 0 4420 940">${wordmark()}</symbol></svg>`;

/** The whole page of one card. */
export function cardPage(locale: Locale, card: Card) {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"/>
<style>${STYLE}</style></head>
<body>${WORD}<div class="card card-${card}" data-tint="home" data-tint-fonts>${BODIES[card](strings(locale))}</div></body></html>`;
}

/** What all the cards are made of: the same hash means the same pictures. */
export function digest() {
  const hash = createHash("sha256");
  for (const { locale, card } of CARDS) hash.update(cardPage(locale, card));
  return hash.digest("hex").slice(0, 16);
}

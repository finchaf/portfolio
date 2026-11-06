// The link pictures as HTML: one card a page and a language, drawn from the site's own tokens, fonts,
// logo and strings. build.ts photographs them; a unit test compares `digest` with the manifest, so a
// change to any of these sources that leaves the pictures old fails the gates.
import { createHash } from "node:crypto";

import {
  Bookmark,
  CalendarDays,
  ChevronDown,
  Copy,
  DoorOpen,
  FileSearch,
  Folder,
  GitFork,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Terminal,
  X,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LOCALES, type Locale } from "../../src/i18n/locales.ts";
import { EVERY_PAGE, EVERY_PATH } from "../../src/lib/pages.ts";
import { DAYS, LESSONS, SLOTS, type Lesson } from "../../src/lib/product-week.ts";
import { escape, fontFaces, read, text } from "../print/html.ts";
import { flowGraph, flowGraphSource } from "./flow-graph.ts";

const THEMES = ["home", "pora", "flow", "projects"];

/** The faces the cards are set in. */
const FONTS = ["geist", "inter", "jetbrains-mono", "nunito"];

/** The day the week on Pora na paru's card is open on: a picture of a Wednesday, the third day. */
const TODAY = 2;

/** The board's frames on Projects' card, in the mode the card shows. */
const SHOTS = {
  home: "src/ui/board/shots/home-dark.webp",
  phone: "src/ui/board/shots/phone-flow-dark.webp",
  notes: "src/ui/board/paper/notes-calculus-dark.webp",
  cover: "src/ui/board/paper/doc-cover-dark.webp",
} as const;

const picture = (path: string) => `data:image/webp;base64,${read(path).toString("base64")}`;

export const SIZE = { width: 1200, height: 630 };

export const CARDS = LOCALES.flatMap((locale) =>
  Object.values(EVERY_PAGE).map((card) => ({ locale, card, key: `${locale}/${card}` })),
);

type Card = (typeof CARDS)[number]["card"];

/** The strings of the cards, which the site already shows. */
function strings(locale: Locale) {
  const pora = JSON.parse(text(`messages/${locale}/pora.json`)) as {
    title: string;
    week: {
      days: Record<(typeof DAYS)[number], string>;
      slot: string;
      types: Record<Lesson["type"], string>;
      pairs: Record<Lesson["id"], { title: string; text: string; who: string; where: string }>;
    };
  };
  const shell = JSON.parse(text(`messages/${locale}/shell.json`)) as { write: string };
  // The folders are named as the board of Projects names them.
  const projects = JSON.parse(text(`messages/${locale}/projects.json`)) as {
    title: string;
    lead: string;
    layers: string;
    frames: Record<"home" | "phone" | "themes" | "release" | "gates", { name: string }>;
    portfolio: { chip: string };
    latex: { chip: string };
  };
  const {
    title: flowPage,
    folders,
    card,
    transcript,
  } = JSON.parse(text(`messages/${locale}/flow.json`)) as {
    title: string;
    folders: { process: string; quality: string };
    card: { line: string; lead: string; link: string };
    transcript: { lines: string };
  };
  const title = (note: string) =>
    /^title: (.+)$/m.exec(text(`messages/${locale}/vault/${note}.md`))?.[1] ?? note;
  const [run = "", done = "", , asks = ""] = transcript.lines.split("\n");
  return {
    week: pora.week,
    projects,
    capsule: [pora.title, flowPage, projects.title],
    write: shell.write,
    flow: {
      ...card,
      name: title("flow"),
      rules: title("rules"),
      process: folders.process,
      quality: folders.quality,
      notes: [title("stage-1"), title("stage-2"), title("edits")],
      checklists: title("checklists"),
      run: run.replace(/^\$ /, ""),
      done:
        done
          .trim()
          .split(/\s{2,}/)[0]
          ?.replace(/^✓ /, "") ?? "",
      asks: asks.trim().replace(/^\? /, ""),
    },
    site: projects.portfolio.chip,
    latex: projects.latex.chip,
  };
}

/** The outlines of the logo's word, as logo.tsx draws them: the slash first. */
const LOGO = text("src/ui/logo.tsx");
const WORD_SHAPES = [...LOGO.slice(LOGO.indexOf("Wordmark")).matchAll(/ d="([^"]+)"/g)].map(
  ([, shape]) => shape ?? "",
);

/** The word of the logo in its own outlines. */
const wordmark = () => WORD_SHAPES.map((shape) => `<path d="${shape}"/>`).join("");

/** `\finchaf{flow}`: the logo is a command, and the argument is the page's own address. */
function sign(card: Card) {
  const argument = EVERY_PATH.find((path) => EVERY_PAGE[path] === card)?.slice(1);
  return `<span class="sign">\\finchaf<i>{${argument ?? ""}}</i></span>`;
}

/** The logo inline, its slash in the accent: the capsule's first item. */
function capsuleMark() {
  const paths = WORD_SHAPES.map(
    (shape, index) => `<path fill="var(${index === 0 ? "--accent" : "--ink"})" d="${shape}"/>`,
  ).join("");
  return `<svg class="capsule-mark" viewBox="0 0 4420 940">${paths}</svg>`;
}

/** The capsule over a page, `current` its chosen item, at `k` times its size. */
function capsule(words: ReturnType<typeof strings>, world: string, current: number, left: number) {
  const items = words.capsule
    .map(
      (name, index) =>
        `<span${index === current ? ' class="capsule-on"' : ""}>${escape(name)}</span>`,
    )
    .join("");
  return `<div class="capsule" data-tint="${world}" data-tint-fonts style="--k:1.18;left:${String(left)}px">
    <span>${capsuleMark()}</span>${items}<span class="capsule-write">${escape(words.write)}</span></div>`;
}

const mark = (kind: string) =>
  `<svg class="mark mark-${kind}" viewBox="0 0 4420 940"><use href="#word"/></svg>`;

const zone = (world: string, body: string) =>
  `<div class="zone" data-tint="${world}" data-tint-fonts>${body}</div>`;

const field = (world: string, body = "") =>
  `<div class="field" data-tint="${world}" data-tint-fonts>${body}</div>`;

const icon = (shape: LucideIcon, size: number) =>
  renderToStaticMarkup(createElement(shape, { size, strokeWidth: 1.75, "aria-hidden": true }));

/** A lesson's card on the week, as the page draws it. */
function lessonCard({ week }: ReturnType<typeof strings>, lesson: Lesson, now: boolean) {
  const words = week.pairs[lesson.id];
  return `<div class="lesson${now ? " lesson-now" : ""}" data-type="${lesson.type}">
    <div class="lesson-head">
      <span class="badge"><i></i>${escape(week.types[lesson.type])}</span>
      <span class="lesson-title">${escape(words.title)}</span>
      <span class="lesson-text">${escape(words.text)}</span>
    </div>
    <div class="lesson-rows">
      <span>${icon(GraduationCap, 27)}${escape(words.who)}</span>
      <span>${icon(DoorOpen, 27)}${escape(words.where)}</span>
    </div>
  </div>`;
}

/** Pora na paru's week: the days, its first two slots, today's line and the capsule over it. */
function weekWindow(words: ReturnType<typeof strings>) {
  const { week } = words;
  const head = DAYS.map(
    (day, index) =>
      `<div class="cell day${index === TODAY ? " today" : ""}">${escape(week.days[day])}</div>`,
  ).join("");
  const rows = SLOTS.slice(0, 2)
    .map(([start, end], slot) => {
      const cells = DAYS.map((_, day) => {
        const lesson = LESSONS.find((each) => each.day === day && each.slot === slot);
        const line =
          slot === 0 ? `<i class="now-line${day === TODAY ? " now-here" : ""}"></i>` : "";
        const card = lesson ? lessonCard(words, lesson, day === TODAY && slot === 0) : "";
        return `<div class="cell slot${day === TODAY ? " today" : ""}">${line}${card}</div>`;
      }).join("");
      const name = escape(week.slot.replace("{n}", String(slot + 1)));
      return `<div class="cell slot-time"><b>${start}—${end}</b><i>${name}</i></div>${cells}`;
    })
    .join("");
  return `<div class="pw" data-tint="pora" data-tint-fonts>
    <div class="week"><div class="cell"></div>${head}${rows}</div>
    ${capsule(words, "pora", 0, 558)}
  </div>`;
}

/** Projects' editor: the layers, the board with the two frames and the capsule over it. */
function editorWindow(words: ReturnType<typeof strings>) {
  const { projects } = words;
  const { frames } = projects;
  const z = (value: number) => `${String(value * 1.5)}px`;
  const box = (left: number, top: number, width: number, height: number, inside: string) =>
    `<div class="pf-box" style="left:${z(left)};top:${z(top)};width:${z(width)};height:${z(height)}">${inside}</div>`;
  const name = (left: number, top: number, width: number, label: string) =>
    `<span class="pf-name" style="left:${z(left)};top:${z(top)};max-width:${z(width)}">${escape(label)}</span>`;
  const shot = (key: keyof typeof SHOTS) => `<img alt="" src="${picture(SHOTS[key])}">`;
  const themes = ["pora", "flow", "projects", "home"]
    .map((world) => `<i data-tint="${world}"></i>`)
    .join("");
  const kids = (["home", "phone", "themes", "release", "gates"] as const)
    .map((key) => `<span class="layer-in">${escape(frames[key].name)}</span>`)
    .join("");
  return `<div class="ed" data-tint="projects" data-tint-fonts>
    <div class="ed-side">
      <h3>${escape(projects.title)}</h3><p>${escape(projects.lead)}</p>
      <span class="ed-layers">${escape(projects.layers.toUpperCase())}</span>
      <span class="layer layer-on layer-site"><i></i>${escape(projects.portfolio.chip)}</span>${kids}
      <span class="layer layer-tex"><i></i>${escape(projects.latex.chip)}</span>
    </div>
    <div class="ed-board">
      <div class="pf pf-site">
        ${name(18, 20, 170, frames.home.name)}${box(18, 34, 170, 104, shot("home"))}
        ${name(200, 20, 48, frames.phone.name)}${box(200, 34, 48, 104, shot("phone"))}
        ${name(18, 150, 230, frames.themes.name)}${box(18, 164, 230, 60, `<div class="pf-themes">${themes}</div>`)}
        <span class="pf-chip">${escape(projects.portfolio.chip)}</span>
      </div>
      <div class="pf pf-tex">
        ${box(18, 34, 108, 150, shot("notes"))}${box(136, 34, 108, 150, shot("cover"))}
        <span class="pf-chip">${escape(projects.latex.chip)}</span>
      </div>
      <div class="pf-chosen"><i></i><i></i><i></i><i></i></div>
      <svg class="pointer" viewBox="0 0 22 30"><path d="M2 2v22l6-6 4 9 4-2-4-9h8z" fill="var(--ink)" stroke="var(--page)" stroke-width="1.6" stroke-linejoin="round"/></svg>
      ${capsule(words, "projects", 2, 430)}
    </div>
  </div>`;
}

/** The Flow page itself: its ribbon, tree, note, terminal and graph, in type a chat can show. */
function vaultWindow({ flow }: ReturnType<typeof strings>, graph: () => string) {
  const ribbon = [FileSearch, GitFork, LayoutDashboard, CalendarDays, Copy, Terminal, ListTodo];
  const folder = (name: string) =>
    `<span class="row">${icon(ChevronDown, 18)}${escape(name)}</span>`;
  return `<div class="win" data-tint="flow" data-tint-fonts>
    <div class="win-bar">
      <span class="win-side">${[Folder, Search, Bookmark].map((shape) => icon(shape, 26)).join("")}</span>
      <span class="tab tab-on">${escape(flow.name)}${icon(X, 20)}</span>
      <span class="tab">${escape(flow.rules)}</span>
      <span class="tab-new">${icon(Plus, 24)}</span>
    </div>
    <div class="ribbon">${ribbon.map((shape) => icon(shape, 28)).join("")}</div>
    <div class="tree">
      <span class="row row-on">${escape(flow.name)}</span>
      ${folder(flow.process)}
      ${flow.notes.map((note) => `<span class="row row-in">${escape(note)}</span>`).join("")}
      ${folder(flow.quality)}
      <span class="row row-in">${escape(flow.checklists)}</span>
    </div>
    <div class="note">
      <h3>${escape(flow.name)}</h3>
      <p>${escape(flow.line)}<br>${escape(flow.lead)} <a>${escape(flow.link)}</a></p>
      <pre class="term"><b>$</b> ${escape(flow.run)}
  <s>✓</s> ${escape(flow.done)}
  <b>?</b> ${escape(flow.asks)}<u></u></pre>
    </div>
    <div class="dock">${graph()}</div>
  </div>`;
}

const BODIES: Record<Card, (words: ReturnType<typeof strings>, graph: () => string) => string> = {
  // The two faces of the first screen, on the two sides of the slash.
  home: () =>
    zone(
      "home",
      `<svg class="tile-defs"><defs><pattern id="hatch" width="7" height="7"
        patternTransform="scale(14.7)" patternUnits="userSpaceOnUse">
        <path class="hatch-line" d="M-1 8 8-1M-1 1 1-1M6 8 8 6"/></pattern></defs></svg>
      ${mark("plan")}${mark("hatch")}`,
    ) + field("home", mark("solid")),

  // The page itself, as Flow's: the week in a window on the brand's blue.
  pora: (words) => field("pora") + weekWindow(words),

  flow: (words, graph) => field("flow") + vaultWindow(words, graph),

  // The page itself, as Flow's: the editor in a window on its green.
  projects: (words) => field("projects") + editorWindow(words),

  portfolio: ({ site }) =>
    zone(
      "projects",
      `<i class="band band-danger"></i><i class="band band-peach"></i><i class="band band-warning"></i>
      <i class="band band-success"></i><i class="band band-blue"></i>
      ${sign("portfolio")}
      <span class="folder folder-only">${escape(site)}</span>`,
    ),

  latex: ({ latex }) =>
    zone(
      "projects",
      `<i class="band band-danger"></i><i class="band band-peach"></i><i class="band band-warning"></i>
      <i class="band band-success"></i><i class="band band-blue"></i>
      ${sign("latex")}
      <span class="folder folder-only folder-teal">${escape(latex)}</span>`,
    ),
};

const STYLE = [
  ...THEMES.map((theme) => text(`src/themes/${theme}.css`)),
  fontFaces(FONTS),
  text("scripts/og/card.css"),
].join("\n");

const WORD = `<svg class="tile-defs"><symbol id="word" viewBox="0 0 4420 940">${wordmark()}</symbol></svg>`;

/** The whole page of one card. */
export function cardPage(locale: Locale, card: Card, graph = flowGraph) {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"/>
<style>${STYLE}</style></head>
<body>${WORD}<div class="card card-${card}" data-tint="home" data-tint-fonts>${BODIES[card](strings(locale), graph)}</div></body></html>`;
}

/** What all the cards are made of: the same hash means the same pictures. */
export function digest() {
  const hash = createHash("sha256");
  for (const { locale, card } of CARDS) hash.update(cardPage(locale, card, flowGraphSource));
  return hash.digest("hex").slice(0, 16);
}

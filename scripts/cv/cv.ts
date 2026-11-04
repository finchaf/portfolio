// The CV as one A4 page of HTML, in each language: the Experience block of the home page set for paper,
// from the site's own strings, tokens, typefaces and portrait. build.ts prints it to public/cv/; a unit
// test compares `digest` with the manifest, so a change to any of these sources that leaves the PDFs
// old fails the gates.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { LOCALES, type Locale } from "../../src/i18n/locales.ts";
import {
  EMAIL,
  GITHUB_HANDLE,
  GITHUB_URL,
  SITE_ORIGIN,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "../../src/lib/site.ts";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)));
const text = (path: string) => read(path).toString("utf8");

/** The faces the page is set in, with the subsets it uses. */
const FONTS = ["geologica", "golos-text", "jetbrains-mono"];
const SUBSETS = /-(latin|cyrillic)-wght-normal\.woff2/;

/** The day of the build, as the footer of the site writes it: the short form reads two ways in English. */
const DATE_STYLE: Record<Locale, "short" | "medium"> = { ru: "short", en: "medium" };

const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

interface Place {
  years: string;
  place: string;
  role: string;
  fact?: string;
}

interface Home {
  hero: { name: string; role: string; roleNote: string; city: string; statement: string };
  experience: {
    title: string;
    about: string;
    rows: Record<"pora" | "team" | "freelance" | "first", Place>;
    educationTitle: string;
    education: Record<"masters" | "bachelors", Place>;
    notesTitle: string;
    grant: string;
    pitch: string;
    toolsTitle: string;
    tools: string;
  };
  cv: {
    title: string;
    contacts: string;
    languages: string;
    telegram: string;
    mail: string;
    site: string;
    github: string;
    russian: string;
    english: string;
    rows: Record<
      "pora" | "team" | "freelance" | "first",
      { one: string; two?: string; link?: string }
    >;
    latexLink: string;
    updated: string;
  };
}

const strings = (locale: Locale) => JSON.parse(text(`../../messages/${locale}/home.json`)) as Home;

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

const STYLE = [text("../../src/themes/home.css"), fontFaces(), text("./cv.css")].join("\n");

const PORTRAIT = `data:image/webp;base64,${read("../../src/features/home/portrait.webp").toString("base64")}`;

const head = (title: string) => `<h2 class="cv-head">${escape(title)}</h2>`;

function row(place: Place, lines: string[], link?: [string, string]) {
  const bullets = lines.length
    ? `<ul class="cv-bullets">${lines.map((line) => `<li>${escape(line)}</li>`).join("")}</ul>`
    : "";
  const more = link ? `<a class="cv-link" href="${link[1]}">${escape(link[0])}</a>` : "";
  return `<li class="cv-row"><span class="cv-years">${escape(place.years)}</span><span class="cv-what">
    <span class="cv-place">${escape(place.place)}</span><span class="cv-role">${escape(place.role)}</span>
    ${bullets}${more}</span></li>`;
}

/** The whole page of the CV in one language, with the day it was printed. */
export function cvPage(locale: Locale, updated: string) {
  const { hero, experience: e, cv } = strings(locale);
  const site = `${SITE_ORIGIN}/${locale}`;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: DATE_STYLE[locale],
    timeZone: "Europe/Moscow",
  }).format(new Date(`${updated}T12:00:00+03:00`));
  const lines = (key: keyof Home["cv"]["rows"]) =>
    [cv.rows[key].one, cv.rows[key].two].filter((line): line is string => Boolean(line));

  const contacts: [string, string, string][] = [
    [cv.telegram, TELEGRAM_HANDLE, TELEGRAM_URL],
    [cv.mail, EMAIL, `mailto:${EMAIL}`],
    [cv.site, new URL(SITE_ORIGIN).host, site],
    [cv.github, `github.com/${GITHUB_HANDLE}`, GITHUB_URL],
  ];

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"/>
<title>${escape(cv.title)}</title><style>${STYLE}</style></head>
<body><article class="cv-sheet">
  <aside class="cv-side">
    <figure class="cv-photo"><img alt="" src="${PORTRAIT}"/></figure><i class="cv-rule-thin"></i>
    <h1 class="cv-name">${escape(hero.name)}</h1>
    <p class="cv-roleline">${escape(hero.role)} · ${escape(hero.roleNote)}</p>
    <p class="cv-city"><span class="cv-dot"></span>${escape(hero.city)}</p>
    <p class="cv-about">${escape(hero.statement)} ${escape(e.about)}</p>
    <section>${head(cv.contacts)}<ul class="cv-contacts">${contacts
      .map(
        ([key, value, href]) =>
          `<li><span class="cv-key">${escape(key)}</span><a href="${href}">${escape(value)}</a></li>`,
      )
      .join("")}</ul></section>
    <section>${head(cv.languages)}<ul class="cv-list"><li>${escape(cv.russian)}</li><li>${escape(cv.english)}</li></ul></section>
    <section>${head(e.toolsTitle)}<ul class="cv-tools">${e.tools
      .split(", ")
      .map((tool) => `<li>${escape(tool)}</li>`)
      .join("")}</ul></section>
  </aside>
  <div class="cv-main">
    <h2 class="cv-title">${escape(e.title)}</h2>
    <ul class="cv-rows">
      ${row(e.rows.pora, lines("pora"))}
      ${row(e.rows.team, lines("team"), [cv.rows.team.link ?? "", `${site}/flow`])}
      ${row(e.rows.freelance, lines("freelance"))}
      ${row(e.rows.first, lines("first"))}
    </ul>
    <h3 class="cv-sub">${escape(e.educationTitle)}</h3>
    <ul class="cv-rows">
      ${row(e.education.masters, [])}
      ${row(e.education.bachelors, e.education.bachelors.fact ? [e.education.bachelors.fact] : [], [cv.latexLink, `${site}/projects/latex`])}
    </ul>
    <h3 class="cv-sub">${escape(e.notesTitle)}</h3>
    <ul class="cv-list"><li>${escape(e.grant)}</li><li>${escape(e.pitch)}</li></ul>
  </div>
  <footer class="cv-foot"><span>${escape(hero.name)} · ${escape(hero.role)}</span><a href="${site}">${new URL(SITE_ORIGIN).host}</a><span>${escape(cv.updated.replace("{date}", date))}</span></footer>
</article></body></html>`;
}

/** What the PDFs are made of: the same hash means the same pages. */
export function digest(updated: string) {
  const hash = createHash("sha256");
  for (const locale of LOCALES) hash.update(cvPage(locale, updated));
  return hash.digest("hex").slice(0, 16);
}

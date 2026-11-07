import "@/ui/board/board.css";
import "./projects.css";
import "./portfolio.css";
import "./latex.css";

import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ButtonLink } from "@/ui/button-link";
import { ScrollBar } from "@/ui/scroll-bar";

import { DemoPages } from "./demo-pages";
import { DemoThesis, type SourceBlock } from "./demo-thesis";
import { DemoTyping } from "./demo-typing";
import { DemoWalls } from "./demo-walls";
import { LATEX, SOURCES, THESIS_PDF, THESIS_RELEASES, thesisFile } from "@/lib/latex-facts";
import { THESIS_URL } from "@/lib/site";
import { VERDICTS } from "@/ui/board/latex-frames";
import { Paper, PAPER, type PaperName } from "@/ui/board/paper";
import { LatexFacts } from "./project-parts";
import { ProjectShell, type Ref } from "./project-shell";
import { TYPING_STEPS, TypingRenders } from "./typing-line";

/** Where each block of page 69 stands, read line by line from the released PDF with PDFKit. */
const PAGE_69 = [
  { key: "b0", y: 0.0695, lines: 1, head: true, indent: false },
  { key: "b1", y: 0.1095, lines: 10, head: false, indent: true },
  { key: "b2", y: 0.3795, lines: 1, head: true, indent: false },
  { key: "b3", y: 0.4195, lines: 11, head: false, indent: true },
  { key: "b4", y: 0.6895, lines: 8, head: false, indent: true },
  { key: "b5", y: 0.8895, lines: 1, head: false, indent: true },
] as const;

/** The five lines of `main.tex` and `preamble.tex` that set the university's rules. */
const PREAMBLE = [
  "\\documentclass[14pt,a4paper,oneside]{extarticle}",
  "\\setmainfont{CMU Serif}",
  "\\usepackage[a4paper, top=2cm, bottom=2cm, left=3cm, right=1cm]{geometry}",
  "\\onehalfspacing",
  "\\setlength{\\parindent}{1.25cm}",
];

/** The pages of the notes on the strip, and their place in the notes. */
const PAGES = [
  ["notes-calculus", "calculus"],
  ["notes-taylor", "taylor"],
  ["notes-graphs", "graphs"],
  ["notes-sphere", "sphere"],
  ["notes-contour", "contour"],
  ["notes-proofs", "proofs"],
] as const satisfies readonly (readonly [PaperName, string])[];

/** A request of the example registry's `document.json`, as it is written there, shortened. */
const REQUEST = `"by-city": {
  "dataset": "example",
  "table": "organizations",
  "caption": "По городам",
  "pivot": {
    "by": "city",
    "total": true,
    "values": [
      { "key": "organizations", "count": true },
      { "key": "universities", "count": true,
        "filter": { "kind": "university" } },
      { "key": "students", "sum": "students" },
      { "key": "per-organization",
        "ratio": ["students", "organizations"] }
    ]
  },
  "sort": ["-students", "by"]
}`;

const PIPELINE = [
  ["make release", "release"],
  ["git tag vYYYY.MM.DD", "tag"],
  ["build-pdf.yml", "action"],
  ["texlive/texlive:latest", "container"],
  ["bachelor-thesis.pdf", "asset"],
] as const;

/** Files and signs as they are written: code, the same in every language. */
const CODE = {
  request: "document.json",
  verify: "collect_verify.py",
  quality: "quality.py",
  died: "†",
  notesDate: "16.03.2019",
  figuresDate: "26.04.2019",
} as const;

const PDF_CHECKS = ["glyph", "overfull", "reference", "font", "rerun", "embedded"] as const;

const SECTIONS = [
  {
    id: "notes",
    paragraphs: ["p1", "p2", "p3"],
    refs: [
      { label: "ejmastnak.com/tutorials/vim-latex", href: SOURCES.mastnak },
      { label: "castel.dev/post/lecture-notes-1", href: SOURCES.castel },
    ],
  },
  { id: "pages", paragraphs: ["p1", "p2", "p3"], refs: [] },
  {
    id: "origin",
    paragraphs: ["p1", "p2", "p3"],
    refs: [
      { label: "castel.dev/post/lecture-notes-1", href: SOURCES.castel },
      { label: "castel.dev/post/lecture-notes-2", href: SOURCES.castelFigures },
      { label: "ejmastnak.com/tutorials/vim-latex/castel", href: SOURCES.castelMirror },
      { label: "ejmastnak.com/tutorials/vim-latex", href: SOURCES.mastnak },
    ],
  },
  {
    id: "thesis",
    paragraphs: ["p1", "p2"],
    refs: [thesisFile("preamble.tex"), thesisFile("requirements.md"), thesisFile("meta.tex")],
  },
  {
    id: "releases",
    paragraphs: ["p1", "p2"],
    refs: [
      thesisFile("Makefile"),
      thesisFile(".github/workflows/build-pdf.yml"),
      { label: "releases/", href: `${THESIS_URL}/releases` },
    ],
  },
  { id: "documents", paragraphs: ["p1", "p2", "p3"], refs: [] },
  { id: "checks", paragraphs: ["p1", "p2", "p3"], refs: [] },
] as const satisfies readonly { id: string; paragraphs: readonly string[]; refs: readonly Ref[] }[];

type SectionId = (typeof SECTIONS)[number]["id"];

/** The numbers the words carry. */
const VALUES = {
  ...LATEX.notes,
  ...LATEX.snippets,
  thesisPages: LATEX.thesis.pages,
  commits: LATEX.documents.commits,
  gates: LATEX.documents.gates,
  tests: LATEX.documents.tests,
  types: LATEX.documents.types,
  // A sign, not a tag: the message format reads "<" as the start of one.
  le: "<=",
};

const RICH = { ...VALUES, c: (chunks: ReactNode) => <code>{chunks}</code> };

/** What stands under a section's words. */
function SectionDemo({ id }: { id: SectionId }) {
  const t = useTranslations("latex");
  const format = useFormatter();
  switch (id) {
    case "notes":
      return (
        <DemoTyping
          renders={<TypingRenders />}
          steps={TYPING_STEPS}
          strings={{
            file: t("typing.file"),
            pdf: t("typing.pdf"),
            keys: t("typing.keys"),
            chars: t("typing.chars"),
            replay: t("typing.replay"),
            insert: t("typing.insert"),
            normal: t("typing.normal"),
            pressed: t("typing.pressed"),
          }}
        />
      );
    case "pages":
      return (
        <DemoPages
          pages={PAGES.map(([name, key]) => ({
            node: (
              <Paper
                alt={t(`pages.${key}.alt`)}
                name={name}
                sizes="(min-width: 64rem) 22rem, 70vw"
              />
            ),
            title: t(`pages.${key}.title`),
            detail: t(`pages.${key}.detail`),
          }))}
          strings={{ back: t("pages.back"), next: t("pages.next"), label: t("pages.label") }}
        />
      );
    case "origin":
      return (
        <div className="pj-tx-people">
          <article className="pj-tx-person" data-memory>
            <p className="pj-tx-name">
              {t("origin.castel.name")} <span aria-hidden>{CODE.died}</span>
            </p>
            <p className="pj-tx-role">{t("origin.castel.role")}</p>
            <p className="pj-tx-rip">
              {t("origin.castel.died")}{" "}
              <a href={SOURCES.castelDeath} rel="noreferrer" target="_blank">
                {t("origin.castel.source")}
              </a>
            </p>
            <ul className="pj-tx-posts">
              <li>
                <a href={SOURCES.castel} rel="noreferrer" target="_blank">
                  {t("origin.castel.notes")}
                </a>
                <span>{CODE.notesDate}</span>
              </li>
              <li>
                <a href={SOURCES.castelFigures} rel="noreferrer" target="_blank">
                  {t("origin.castel.figures")}
                </a>
                <span>{CODE.figuresDate}</span>
              </li>
            </ul>
            <p className="pj-demo-note">{t("origin.castel.note")}</p>
          </article>
          <article className="pj-tx-person">
            <p className="pj-tx-name">{t("origin.mastnak.name")}</p>
            <p className="pj-tx-role">{t("origin.mastnak.role")}</p>
            <ul className="pj-tx-posts">
              <li>
                <a href={SOURCES.mastnak} rel="noreferrer" target="_blank">
                  {t("origin.mastnak.guide")}
                </a>
              </li>
              <li>
                <a href={SOURCES.castelMirror} rel="noreferrer" target="_blank">
                  {t("origin.mastnak.mirror")}
                </a>
              </li>
            </ul>
            <p className="pj-demo-note">{t("origin.mastnak.note")}</p>
          </article>
        </div>
      );
    case "thesis":
      return (
        <DemoThesis
          blocks={PAGE_69.map(({ key, ...place }): SourceBlock => ({
            ...place,
            // The source as it is written: braces and backslashes are not a message's.
            text: t.raw(`thesis.source.${key}`) as string,
          }))}
          page={
            <Paper alt={t("thesis.alt")} name="thesis-69" sizes="(min-width: 64rem) 34rem, 92vw" />
          }
          preamble={PREAMBLE}
          strings={{
            label: t("thesis.label"),
            lens: t("thesis.lens"),
            fields: t("thesis.fields"),
            source: t("thesis.sourceView"),
            hint: t("thesis.hint"),
            top: t("thesis.top"),
            bottom: t("thesis.bottom"),
            left: t("thesis.left"),
            right: t("thesis.right"),
            indent: t("thesis.indent"),
            spacing: t("thesis.spacing"),
          }}
        />
      );
    case "releases": {
      const size = (bytes: number) =>
        bytes > 1e6
          ? t("releases.mb", { value: format.number(bytes / 1e6, { maximumFractionDigits: 1 }) })
          : t("releases.kb", { value: format.number(Math.round(bytes / 1e3)) });
      return (
        <>
          <DemoWalls
            strings={{
              label: t("releases.label"),
              alt: t("releases.alt"),
              pages: t("releases.pages"),
              date: t("releases.date"),
              words: t("releases.words"),
              size: t("releases.size"),
            }}
            walls={THESIS_RELEASES.map(([tag, date, pages, words, bytes]) => {
              const [light, dark] = PAPER[`wall-${tag}`];
              return {
                tag,
                date,
                pages,
                words: format.number(words),
                size: size(bytes),
                light: light.src,
                dark: dark.src,
              };
            })}
          />
          <ol className="pj-tx-pipe">
            {PIPELINE.map(([command, key]) => (
              <li key={command}>
                <code>{command}</code>
                <span>{t(`releases.pipe.${key}`)}</span>
              </li>
            ))}
          </ol>
        </>
      );
    }
    case "documents":
      return (
        <figure className="pj-tx-request">
          <div className="pj-term">
            <p className="pj-term-command">{CODE.request}</p>
            <div className="pj-scroll">
              <pre>{REQUEST}</pre>
              <ScrollBar axis="x" />
            </div>
          </div>
          <div className="pj-tx-spread">
            <span className="pj-paper">
              <Paper
                alt={t("documents.chartAlt")}
                name="doc-registry"
                sizes="(min-width: 64rem) 48rem, 92vw"
              />
            </span>
            <span className="pj-paper">
              <Paper
                alt={t("documents.tableAlt")}
                name="doc-sources"
                sizes="(min-width: 64rem) 48rem, 92vw"
              />
            </span>
          </div>
          <figcaption className="pj-demo-note">{t("documents.caption")}</figcaption>
        </figure>
      );
    case "checks":
      return (
        <div className="pj-tx-checks">
          <div className="pj-term">
            <p className="pj-term-command">{CODE.verify}</p>
            {VERDICTS.map(([verdict, held]) => (
              <p key={verdict}>
                <span>
                  <b data-failed={held ? undefined : ""}>{verdict}</b>{" "}
                  {t(
                    `checks.verdict.${verdict.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())}` as never,
                  )}
                </span>
              </p>
            ))}
          </div>
          <div className="pj-term">
            <p className="pj-term-command">{CODE.quality}</p>
            {PDF_CHECKS.map((key) => (
              <p key={key}>
                <span>{t(`checks.pdf.${key}`)}</span>
              </p>
            ))}
          </div>
        </div>
      );
  }
}

const BRIEF = ["what", "how", "open"] as const;

/** The LaTeX project's page. Its words are in `messages/<locale>/latex.json`. */
export function LatexPage() {
  const t = useTranslations("latex");
  const projects = useTranslations("projects");
  return (
    <ProjectShell
      brief={BRIEF.map((key) => ({ label: t(`brief.${key}`), text: t(`brief.${key}Text`) }))}
      facts={<LatexFacts />}
      lead={t("lead")}
      links={
        <p className="pj-panel-links">
          <ButtonLink href={THESIS_PDF} size="small">
            {t("pdf")}
          </ButtonLink>
          <ButtonLink href={THESIS_URL} size="small" tone="quiet">
            {projects("latex.code")}
          </ButtonLink>
        </p>
      }
      project="latex"
      refsLabel={t("open")}
      sections={SECTIONS.map(({ id, paragraphs, refs }) => ({
        id,
        name: t(`sections.${id}.name`),
        title: t(`sections.${id}.title`, VALUES),
        paragraphs: paragraphs.map((key) =>
          t.rich(`sections.${id}.${key}` as never, RICH as never),
        ),
        demo: <SectionDemo id={id} />,
        refs,
      }))}
      title={t("title")}
    />
  );
}

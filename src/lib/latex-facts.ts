import { THESIS_URL } from "./site";

/**
 * The numbers of the LaTeX project, each with where it comes from. A dated snapshot: the notes and
 * the thesis are finished, and the documents' repository is private and moves on, so its numbers
 * are as of the date and change by hand.
 *
 * Notes, `finchaf/university`, branch master:
 *   pdfs, pages      every committed `master.pdf`, pages counted with PDFKit
 *   lectures         git ls-files | grep -E '/lessons/.*\.tex$' | wc -l
 *   figures          Inkscape figures, `*.pdf_tex`, counted once per content hash
 *   first, last      the dates of the first and the last `\lesson{…}`
 * Snippets, the LuaSnip folder of the owner's Neovim config:
 *   all              grep -o '{ *trig *=' | wc -l over `snippets/all.lua` and `snippets/tex/*.lua`
 *   auto             grep -o 'snippetType = "autosnippet"'
 *   math             grep -o 'condition = tex.in_mathzone'
 * Thesis, `finchaf/bachelor-thesis` and its GitHub releases: pages and words of each PDF with
 * PDFKit, `doc.string` split on white space; size in bytes as GitHub serves the asset.
 * Documents, the product's private repository, branch master:
 *   commits          git rev-list --count master
 *   decisions        git ls-files 'docs/decisions/0*.md' | wc -l
 *   gates            the timed steps of `scripts/check.py`
 *   tests            git grep -c 'def test_' -- 'scripts/test_*.py', summed
 *   types            the document types the class knows
 *   classLines       wc -l pnp.cls styles/*.sty
 */
export const LATEX = {
  date: "03.11.2026",
  notes: {
    pdfs: 22,
    pages: 630,
    lecturePdfs: 8,
    lecturePages: 263,
    examPdfs: 14,
    examPages: 367,
    lectures: 47,
    subjects: 9,
    figures: 64,
    first: "01.09.2023",
    last: "03.06.2025",
  },
  snippets: { all: 139, auto: 132, math: 44 },
  thesis: { pages: 130, words: 23049, releases: 10, commits: 22 },
  documents: {
    commits: 433,
    decisions: 20,
    gates: 11,
    tests: 465,
    types: 6,
    classLines: 1181,
    first: "30.09.2026",
  },
} as const;

/** The releases of the thesis: tag, date, pages, words and bytes of the PDF. */
export const THESIS_RELEASES = [
  ["v2026.05.12", "12.05.2026", 3, 147, 16076],
  ["v2026.05.12.2", "12.05.2026", 3, 147, 16076],
  ["v2026.05.18", "18.05.2026", 30, 5263, 81558],
  ["v2026.05.19", "19.05.2026", 39, 7338, 110537],
  ["v2026.05.19.2", "19.05.2026", 63, 12944, 206579],
  ["v2026.05.20", "20.05.2026", 125, 24213, 390576],
  ["v2026.05.22", "22.05.2026", 130, 22935, 21179451],
  ["v2026.06.04", "04.06.2026", 130, 22981, 21180471],
  ["v2026.06.08", "08.06.2026", 130, 22981, 21183024],
  ["v2026.06.10", "10.06.2026", 130, 23049, 21182813],
] as const;

const THESIS_FILE = `${THESIS_URL}/blob/master/`;
export const THESIS_PDF = `${THESIS_URL}/releases/latest/download/bachelor-thesis.pdf`;

/** Where the setup came from: the articles that started it. */
export const SOURCES = {
  castel: "https://web.archive.org/web/20261026155134/https://castel.dev/post/lecture-notes-1/",
  castelFigures:
    "https://web.archive.org/web/20261026155146/https://castel.dev/post/lecture-notes-2/",
  castelMirror: "https://ejmastnak.com/tutorials/vim-latex/castel/1-snippets",
  castelDeath:
    "https://web.archive.org/web/20230320162924/https://www.kuleuven.be/wieiswie/en/person/00131443",
  mastnak: "https://ejmastnak.com/tutorials/vim-latex/intro/",
} as const;

export const thesisFile = (path: string) => ({ label: path, href: `${THESIS_FILE}${path}` });

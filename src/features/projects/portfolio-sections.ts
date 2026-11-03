import { REPOSITORY_URL } from "@/lib/site";

const FILE = `${REPOSITORY_URL}/blob/main/`;
const FOLDER = `${REPOSITORY_URL}/tree/main/`;

/** The record of the log a section rests on: a link and the short name beside it. */
const adr = (file: string) => ({
  label: `ADR-${file.slice(0, 4)}`,
  href: `${FILE}docs/01-architecture/decisions/${file}.md`,
});

const code = (path: string) => ({ label: path, href: `${FILE}${path}` });
const folder = (path: string) => ({ label: path, href: `${FOLDER}${path}` });

/**
 * The sections of the page, in order. The words are in `messages/<locale>/portfolio.json` under the
 * section's id; each section also says where to read the code and the decision behind it, which the
 * inspector shows beside the section and a phone shows under it.
 */
export const SECTIONS = [
  {
    id: "form",
    paragraphs: ["p1", "p2"],
    refs: [
      code("src/lib/pages.ts"),
      code("eslint.config.mjs"),
      folder("src/features"),
      adr("0009-features-and-boundaries"),
    ],
  },
  {
    id: "themes",
    paragraphs: ["p1", "p2", "p3"],
    refs: [
      code("src/themes/tokens.css"),
      code("src/themes/themes.test.ts"),
      code("src/ui/control.css"),
      adr("0010-themes"),
      adr("0011-control-skins"),
    ],
  },
  {
    id: "lens",
    paragraphs: ["p1", "p2", "p3"],
    refs: [
      code("src/features/home/hero-lens.tsx"),
      code("src/features/home/hero-code.tsx"),
      code("src/shell/capsule.css"),
      adr("0004-motion-stack"),
    ],
  },
  {
    id: "motion",
    paragraphs: ["p1", "p2", "p3"],
    refs: [
      code("src/shell/page-change.tsx"),
      code("src/shell/page-change.css"),
      code("src/motion/tokens.ts"),
      code("docs/04-design-system/motion.md"),
      adr("0004-motion-stack"),
    ],
  },
  {
    id: "gates",
    paragraphs: ["p1", "p2"],
    refs: [
      code("scripts/check.py"),
      code("docs/06-quality/ci-and-tooling.md"),
      folder("e2e"),
      adr("0007-process-and-gates"),
    ],
  },
  {
    id: "decisions",
    paragraphs: ["p1", "p2"],
    refs: [
      folder("docs/01-architecture/decisions"),
      adr("0002-static-export-on-caddy"),
      adr("0008-open-repository"),
    ],
  },
  {
    id: "release",
    paragraphs: ["p1", "p2"],
    refs: [
      code("scripts/deploy.py"),
      code("docs/01-architecture/infrastructure.md"),
      adr("0005-atomic-deploy-from-laptop"),
    ],
  },
  {
    id: "stage",
    paragraphs: ["p1"],
    refs: [code("docs/07-roadmap/README.md")],
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

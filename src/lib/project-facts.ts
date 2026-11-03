/**
 * The numbers the Projects pages show, each with the command that gives it. They are a dated
 * snapshot, not a live count: a number on the site carries its date, and it changes by hand.
 *
 *   commits   git log --oneline main | wc -l
 *   decisions the files in docs/01-architecture/decisions/
 *   gates     python3 scripts/check.py, its table and the sum of its seconds
 *   tests     the same run: Vitest's count, and Playwright's over the browser gates
 *   budgets   python3 scripts/check_bundle.py
 *   home      document.documentElement.scrollHeight on /ru at 1440 × 900
 */
export const FACTS = {
  date: "03.11.2026",
  commits: 135,
  decisions: 14,
  checks: 14,
  unit: 300,
  browser: 257,
  themes: 4,
  languages: 2,
} as const;

export const GATES = [
  ["Docs", 0.1],
  ["Public", 0.2],
  ["Types", 2.3],
  ["Lint", 13.7],
  ["Format", 2.2],
  ["Content", 0],
  ["Unit", 1],
  ["Build", 11.3],
  ["Bundle", 0.3],
  ["Addresses", 15.5],
  ["SEO", 9.1],
  ["A11y", 35.8],
  ["Motion", 210.2],
  ["Themes", 36.8],
] as const;

/** Commands as they are typed: code, the same in every language. */
export const COMMAND = {
  check: "python3 scripts/check.py",
  checkShort: "$ check.py",
  deployShort: "$ deploy.py --status",
  journal: "decisions/",
  releases: "ls portfolio/releases",
  passed: "ok",
  mode: "NORMAL",
  branch: "main",
  cat: "=^..^=",
  seconds: " s",
  live: "live",
} as const;

/** Commits in `main` by day: `git log --format=%ad --date=format:%d.%m main | sort | uniq -c`. */
export const COMMITS_BY_DAY = [
  ["30.10", 38],
  ["31.10", 61],
  ["01.11", 26],
  ["02.11", 10],
] as const;

/** `python3 scripts/deploy.py --status`, newest first. */
export const RELEASES = [
  ["664494f84cee", "02.11", "hash what the Flow graph is made of"],
  ["252bf73f2ffc", "02.11", "change pages along the slash of the logo"],
  ["1a4994f45e0d", "01.11", "rewrite the story's lines and its ending"],
] as const;

/** Kilobytes of first-load JavaScript, gzip. */
export const BUDGET = { limit: 280, home: 245.2, flow: 192.2, other: 178.2 } as const;

/** The records of the log, as the file names give them. */
export const JOURNAL = [
  "0001-knowledge-base",
  "0002-static-export-on-caddy",
  "0003-stack-as-in-the-web",
  "0004-motion-stack",
  "0005-atomic-deploy-from-laptop",
  "0006-domains-and-mail",
  "0007-process-and-gates",
  "0008-open-repository",
  "0009-features-and-boundaries",
  "0010-themes",
  "0011-control-skins",
  "0012-link-previews",
  "0013-flow-as-a-vault",
  "0014-projects-as-an-editor",
] as const;

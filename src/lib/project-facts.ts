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
  date: "06.11.2026",
  commits: 166,
  decisions: 16,
  checks: 14,
  unit: 353,
  browser: 309,
  themes: 4,
  languages: 2,
} as const;

export const GATES = [
  ["Docs", 0.1],
  ["Public", 0.2],
  ["Types", 3.1],
  ["Lint", 14.1],
  ["Format", 2.6],
  ["Content", 0],
  ["Unit", 1.4],
  ["Build", 14.9],
  ["Bundle", 0.3],
  ["Addresses", 18.3],
  ["SEO", 8],
  ["A11y", 56.7],
  ["Motion", 300.8],
  ["Themes", 54.8],
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

/**
 * The days of the work: the date, the key of what landed that day in `portfolio.days`, and the
 * commits in `main` that day, `git log --format=%ad --date=format:%d.%m main | sort | uniq -c`.
 */
export const DAYS = [
  ["30.10", "oct30", 38],
  ["31.10", "oct31", 61],
  ["01.11", "nov01", 26],
  ["02.11", "nov02", 10],
  ["03.11", "nov03", 8],
  ["04.11", "nov04", 7],
  ["05.11", "nov05", 6],
  ["06.11", "nov06", 10],
] as const;

/** `python3 scripts/deploy.py --status`, newest first. */
export const RELEASES = [
  ["00f836b6267e", "06.11"],
  ["6534e6491252", "05.11"],
  ["41387ec62038", "05.11"],
] as const;

/** Kilobytes of first-load JavaScript, gzip. */
export const BUDGET = { limit: 280, home: 251.1, flow: 239.9, other: 239.3 } as const;

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
  "0015-pora-as-a-week",
  "0016-drawn-scrollbar",
] as const;

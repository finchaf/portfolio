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
  date: "05.11.2026",
  commits: 156,
  decisions: 16,
  checks: 14,
  unit: 319,
  browser: 307,
  themes: 4,
  languages: 2,
} as const;

export const GATES = [
  ["Docs", 0.1],
  ["Public", 0.2],
  ["Types", 2.2],
  ["Lint", 13.3],
  ["Format", 2.2],
  ["Content", 0],
  ["Unit", 1.3],
  ["Build", 13.9],
  ["Bundle", 0.3],
  ["Addresses", 17],
  ["SEO", 7.1],
  ["A11y", 51.2],
  ["Motion", 201.3],
  ["Themes", 43.4],
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
  ["03.11", 8],
  ["04.11", 7],
  ["05.11", 6],
] as const;

/** `python3 scripts/deploy.py --status`, newest first. */
export const RELEASES = [
  ["6534e6491252", "05.11", "record the Pora skin, motion and link-preview decisions"],
  ["41387ec62038", "05.11", "wake the far story pictures from where the ribbon is going"],
  ["7ff803273a1b", "04.11", "let the Projects chapter grow on a large monitor"],
] as const;

/** Kilobytes of first-load JavaScript, gzip. */
export const BUDGET = { limit: 280, home: 250.7, flow: 239.9, other: 239.1 } as const;

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

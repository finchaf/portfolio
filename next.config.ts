import { execFileSync } from "node:child_process";

import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

import { DEFAULT_LOCALE } from "./src/i18n/locales";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** The last commit of what is being built: `<short hash> <day>`, or nothing outside a clone. */
function lastCommit(): [string, string] {
  try {
    const line = execFileSync("git", ["log", "-1", "--format=%h %cs"], { encoding: "utf8" });
    const [hash = "", day = ""] = line.trim().split(" ");
    return [hash, day];
  } catch {
    return ["", ""];
  }
}

const [commit, updated] = lastCommit();

const base: NextConfig = {
  // The site is plain files behind Caddy (ADR-0002): a page that needs a server fails the build.
  output: "export",
  poweredByHeader: false,
  reactStrictMode: true,
  // `next dev` writes AGENTS.md and CLAUDE.md into the project unless told not to.
  agentRules: false,
  // One 404 for every address no route answers: the root layout is under [locale], so without
  // this Next.js could not render a 404 ahead of time.
  experimental: { globalNotFound: true },
  env: { NEXT_PUBLIC_SITE_COMMIT: commit, NEXT_PUBLIC_SITE_UPDATED: updated },
};

// In production Caddy chooses the language of `/` (deploy/Caddyfile.test). `next dev` has no Caddy,
// so it answers `/` itself; the export cannot carry a redirect, hence the phase.
const development: NextConfig = {
  ...base,
  output: undefined,
  redirects: () =>
    Promise.resolve([{ source: "/", destination: `/${DEFAULT_LOCALE}`, permanent: false }]),
};

export default function config(phase: string): NextConfig {
  return withNextIntl(phase === PHASE_DEVELOPMENT_SERVER ? development : base);
}

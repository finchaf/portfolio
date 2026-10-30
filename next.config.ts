import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

import { DEFAULT_LOCALE } from "./src/i18n/locales";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

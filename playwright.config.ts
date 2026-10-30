import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT) || 8090;

// The browser gates run against the built site behind the same Caddy as production
// (scripts/serve.py), so its redirects, headers and CSP are what is tested. Chromium only; Safari
// and Firefox are checked by hand (docs/06-quality/ci-and-tooling.md).
export default defineConfig({
  testDir: "e2e",
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `python3 scripts/serve.py --port ${port}`,
    url: `http://127.0.0.1:${port}/ru`,
    reuseExistingServer: false,
    timeout: 60_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 3_000 },
    stdout: "ignore",
    stderr: "pipe",
  },
});

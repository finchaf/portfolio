import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const FILE = readFileSync(join(process.cwd(), "public", ".well-known", "security.txt"), "utf8");
const field = (name: string) =>
  [...FILE.matchAll(new RegExp(`^${name}: (.+)$`, "gm"))].map((match) => match[1] ?? "");

describe("security.txt (RFC 9116)", () => {
  it("names a way to report privately, the policy and its own address", () => {
    expect(field("Contact")).toContain(
      "https://github.com/finchaf/portfolio/security/advisories/new",
    );
    expect(field("Canonical")).toEqual(["https://finchaf.com/.well-known/security.txt"]);
    expect(field("Policy")).toHaveLength(1);
  });

  // It must not outlive a year, and a stale one tells a reporter nobody reads it: renew it then.
  it("expires ahead, within a year", () => {
    const [expires = ""] = field("Expires");
    const days = (Date.parse(expires) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(366);
  });
});

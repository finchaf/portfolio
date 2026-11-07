import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { TOKEN, tone } from "@/ui/code-source";

import { CAPSULE_SOURCE } from "./capsule-source";

describe("the source under the capsule", () => {
  const header = readFileSync(join(import.meta.dirname, "header.tsx"), "utf8");

  it.each(CAPSULE_SOURCE)("%s is in the capsule", (line) => {
    expect(header).toContain(line.trim());
  });
});

describe("the colours of the source under the capsule", () => {
  it("make the label's expression one, template and all", () => {
    const line = CAPSULE_SOURCE.find((each) => each.includes("${"));
    if (!line) throw new Error("no template in the capsule's source");
    const parts = line.split(TOKEN);
    expect(parts.filter((part) => tone(part) === "text-ink")).toEqual([line.trim()]);
    expect(parts.filter((part) => part.trim() && !tone(part))).toEqual([]);
  });
});

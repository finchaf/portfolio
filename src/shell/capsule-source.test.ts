import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CAPSULE_SOURCE } from "./capsule-source";

describe("the source under the capsule", () => {
  const header = readFileSync(join(import.meta.dirname, "header.tsx"), "utf8");

  it.each(CAPSULE_SOURCE)("%s is in the capsule", (line) => {
    expect(header).toContain(line.trim());
  });
});

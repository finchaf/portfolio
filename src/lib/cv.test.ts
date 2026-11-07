import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { digest } from "../../scripts/cv/cv";
import { LOCALES } from "@/i18n/locales";
import cv from "./cv.json";

/** A CV a reader opens from a phone: a photograph and three typefaces, well under a megabyte. */
const LIMIT = 900 * 1024;

describe("the CV in PDF", () => {
  it("is printed from the sources as they stand: if not, run `pnpm cv`", () => {
    expect(cv.input).toBe(digest(cv.updated));
  });

  it.each(LOCALES)("in %s is the one page the manifest names", (locale) => {
    const file = readFileSync(join(process.cwd(), "public", "cv", `${locale}.pdf`));
    const version = createHash("sha256").update(file).digest("hex").slice(0, 8);
    expect(version).toBe(cv.files[locale]);
    expect(file.subarray(0, 5).toString()).toBe("%PDF-");
    expect(file.length).toBeLessThan(LIMIT);
    expect(file.toString("latin1").match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1);
  });
});

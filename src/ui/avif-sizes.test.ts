import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

import SIZES from "./avif-sizes.json";

const SOURCE = join(import.meta.dirname, "..");
const files = readdirSync(SOURCE, { recursive: true, encoding: "utf8" });
const pictures = files.filter((path) => path.endsWith(".avif"));
const measured: Record<string, readonly number[] | undefined> = SIZES;

/** The size an AVIF declares in its `ispe` box: width and height, after four bytes of flags. */
function declared(path: string) {
  const bytes = readFileSync(join(SOURCE, path));
  const at = bytes.indexOf("ispe");
  return [bytes.readUInt32BE(at + 8), bytes.readUInt32BE(at + 12)];
}

describe("the sizes of the AVIF pictures", () => {
  // Turbopack reads none and gives each 100 × 100: `Image` in image.tsx takes them from here.
  it.each(pictures)("%s is in the manifest with its real size", (path) => {
    expect(measured[basename(path)]).toEqual(declared(path));
  });

  it("names each picture once and none that is gone", () => {
    const names = pictures.map((path) => basename(path));
    expect(new Set(names).size).toBe(names.length);
    expect(Object.keys(SIZES).sort()).toEqual([...names].sort());
  });

  it.each(files.filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".test.ts")))(
    "%s shows an AVIF only through the site's Image",
    (path) => {
      const code = readFileSync(join(SOURCE, path), "utf8");
      if (!/from "[^"]+\.avif"/.test(code)) return;
      expect(code).not.toMatch(/import Image\b[^;]*from "next\/image"/);
    },
  );
});

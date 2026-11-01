import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CARDS, digest } from "../../scripts/og/cards";
import { PAGES } from "./pages";
import { SHARE_IMAGE } from "./share-images";
import images from "./share-images.json";

const LIMIT = 300 * 1024;

describe("the link pictures", () => {
  it("are drawn from the sources as they stand: if not, run `pnpm og`", () => {
    expect(images.input).toBe(digest());
  });

  it("cover every page in every language, and nothing else", () => {
    expect(CARDS).toHaveLength(2 * Object.keys(PAGES).length);
    expect(Object.keys(images.files).sort()).toEqual(CARDS.map(({ key }) => key).sort());
  });

  it.each(CARDS.map(({ key }) => key))("%s is the file the manifest names", (key) => {
    const file = readFileSync(join(process.cwd(), "public", "og", `${key}.png`));
    const version = createHash("sha256").update(file).digest("hex").slice(0, 8);
    expect(version).toBe(images.files[key as keyof typeof images.files]);
    expect(file.subarray(1, 4).toString()).toBe("PNG");
    expect(file.readUInt32BE(16)).toBe(SHARE_IMAGE.width);
    expect(file.readUInt32BE(20)).toBe(SHARE_IMAGE.height);
    expect(file.length).toBeLessThan(LIMIT);
  });
});

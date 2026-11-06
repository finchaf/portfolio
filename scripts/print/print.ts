// Opens pages of HTML in Chromium and writes what it makes of each: the link pictures and the CV are
// photographed and printed the same way, with motion reduced and once the faces are in.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { chromium, type BrowserContextOptions, type Page } from "@playwright/test";

interface Sheet {
  key: string;
  /** Where the file goes, from the root, where pnpm runs the builds. */
  path: string;
  html: () => string;
}

/** Writes every sheet's file and returns its version, the first 8 hex of its sha256, by key. */
export async function print(
  options: BrowserContextOptions,
  sheets: Iterable<Sheet>,
  take: (page: Page) => Promise<Buffer>,
) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...options, reducedMotion: "reduce" });

  const files: Record<string, string> = {};
  for (const { key, path, html } of sheets) {
    await page.setContent(html(), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const file = await take(page);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file);
    files[key] = createHash("sha256").update(file).digest("hex").slice(0, 8);
    console.log(`${path}: ${String(Math.round(file.length / 1024))} KB`);
  }
  await browser.close();
  return files;
}

/** The manifest a unit test and the metadata read, in the form Prettier keeps. */
export const writeManifest = (path: string, manifest: object) =>
  writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);

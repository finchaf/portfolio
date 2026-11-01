// Photographs the link pictures into public/og/ and writes the manifest the metadata reads. Run by
// hand with `pnpm og` when a card changes: the pictures are committed, so a build needs no browser.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { chromium } from "@playwright/test";

import { CARDS, cardPage, digest, SIZE } from "./cards.ts";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: SIZE,
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});

const files: Record<string, string> = {};
for (const { locale, card, key } of CARDS) {
  await page.setContent(cardPage(locale, card), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const picture = await page.screenshot({ type: "png", clip: { x: 0, y: 0, ...SIZE } });
  const path = `public/og/${key}.png`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, picture);
  files[key] = createHash("sha256").update(picture).digest("hex").slice(0, 8);
  console.log(`${path}: ${String(Math.round(picture.length / 1024))} KB`);
}
await browser.close();

const manifest = `${JSON.stringify({ input: digest(), files }, null, 2)}\n`;
await writeFile("src/lib/share-images.json", manifest);

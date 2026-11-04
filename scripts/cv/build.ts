// Prints the CV into public/cv/ in each language and writes the manifest the unit test reads. Run by
// hand with `pnpm cv` when a line of it changes: the PDFs are committed, so a build needs no browser.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

import { LOCALES } from "../../src/i18n/locales.ts";
import { cvPage, digest } from "./cv.ts";

/** The day it is printed, in Moscow: the foot of the page says it. */
const updated = new Intl.DateTimeFormat("sv", { timeZone: "Europe/Moscow" }).format(new Date());

const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: "reduce" });
await mkdir("public/cv", { recursive: true });

const files: Record<string, string> = {};
for (const locale of LOCALES) {
  await page.setContent(cvPage(locale, updated), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const path = `public/cv/${locale}.pdf`;
  await writeFile(path, pdf);
  files[locale] = createHash("sha256").update(pdf).digest("hex").slice(0, 8);
  console.log(`${path}: ${String(Math.round(pdf.length / 1024))} KB`);
}
await browser.close();

const manifest = `${JSON.stringify({ input: digest(updated), updated, files }, null, 2)}\n`;
await writeFile("src/lib/cv.json", manifest);

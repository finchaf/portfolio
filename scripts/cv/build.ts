// Prints the CV into public/cv/ in each language and writes the manifest the unit test reads. Run by
// hand with `pnpm cv` when a line of it changes: the PDFs are committed, so a build needs no browser.
import { LOCALES } from "../../src/i18n/locales.ts";
import { print, writeManifest } from "../print/print.ts";
import { cvPage, digest } from "./cv.ts";

/** The day it is printed, in Moscow: the foot of the page says it. */
const updated = new Intl.DateTimeFormat("sv", { timeZone: "Europe/Moscow" }).format(new Date());

const files = await print(
  {},
  LOCALES.map((locale) => ({
    key: locale,
    path: `public/cv/${locale}.pdf`,
    html: () => cvPage(locale, updated),
  })),
  (page) => page.pdf({ preferCSSPageSize: true, printBackground: true }),
);

await writeManifest("src/lib/cv.json", { input: digest(updated), updated, files });

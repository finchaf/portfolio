// What the link pictures and the CV share as pages of HTML: files read from the repository's root,
// text made safe for markup, and typefaces set inside the page, which a page set from a string needs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../", import.meta.url);

/** A file of the repository, by its path from the root. */
export const read = (path: string) => readFileSync(fileURLToPath(new URL(path, ROOT)));
export const text = (path: string) => read(path).toString("utf8");

/** The subsets the pages use of every face. */
const SUBSETS = /-(latin|cyrillic)-wght-normal\.woff2/;

export const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** `@font-face` rules with the files inside them: a page set from a string can load nothing else. */
export function fontFaces(fonts: readonly string[]) {
  return fonts
    .flatMap((font) => {
      const directory = `node_modules/@fontsource-variable/${font}/`;
      return text(`${directory}index.css`)
        .split("@font-face")
        .filter((rule) => SUBSETS.test(rule))
        .map((rule) => {
          const file = /url\(\.\/(files\/[^)]+)\)/.exec(rule)?.[1] ?? "";
          const data = read(`${directory}${file}`).toString("base64");
          return `@font-face${rule.replace(
            /url\([^)]+\)/,
            `url(data:font/woff2;base64,${data})`,
          )}`.replace(/\/\*[^*]*\*\/\s*$/, "");
        });
    })
    .join("\n");
}

// Re-encodes the site's pictures as AVIF next to their WebP:
//   node scripts/media/avif.mjs [--screen] [--quality N] FILE…
//   node scripts/media/avif.mjs --sizes      only writes the manifest of sizes again
// A photograph takes quality 50 with the colour at a quarter, which keeps it to the eye at about 40 %
// less; a screen, with small type and flat colour, takes 60 with the colour whole (`--screen`). The
// WebP stays the source the picture was made from; the page imports the AVIF. Measured 06.11.2026:
// the story's photographs went from 1 315 KB to about 790. The sprite of menus takes `--quality 50`.
// An AVIF not at least 5 % lighter is not kept, and a stale one is taken away: the page then imports
// the WebP, and a build that still asks for the AVIF fails loudly instead of showing an old picture.
// Turbopack reads no size from an AVIF and gives it 100 × 100, so the sizes go to
// src/ui/avif-sizes.json, which `Image` in src/ui/image.tsx reads (avif-sizes.test.ts holds it).
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";

const require = createRequire(`${process.cwd()}/package.json`);
const sharp = require(join(dirname(require.resolve("next/package.json")), "../sharp"));

const args = process.argv.slice(2);
const screen = args.includes("--screen");
const asked = args.indexOf("--quality");
const quality = asked < 0 ? (screen ? 60 : 50) : Number(args[asked + 1]);
const options = { quality, effort: 6, chromaSubsampling: screen ? "4:4:4" : "4:2:0" };

const files = args.filter((arg, at) => !arg.startsWith("--") && (asked < 0 || at !== asked + 1));
const MANIFEST = "src/ui/avif-sizes.json";

for (const file of files) {
  const source = readFileSync(file);
  const avif = await sharp(source).avif(options).toBuffer();
  const target = file.replace(/\.webp$/, ".avif");
  const saved = Math.round((1 - avif.length / source.length) * 100);
  if (saved < 5) {
    if (existsSync(target)) rmSync(target);
    console.log(`${file}: AVIF only ${String(saved)} % lighter, the WebP stays`);
    continue;
  }
  writeFileSync(target, avif);
  console.log(`${target}: ${String(Math.round(avif.length / 1024))} KB, ${String(saved)} % less`);
}

/** Every AVIF of the site by its file name, with the width and height of its pixels. */
const sizes = {};
for (const file of readdirSync("src", { recursive: true, encoding: "utf8" })) {
  if (!file.endsWith(".avif")) continue;
  const { width, height } = await sharp(readFileSync(join("src", file))).metadata();
  const name = basename(file);
  if (name in sizes)
    throw new Error(`${name}: two AVIFs of one name, the manifest keys them by name`);
  sizes[name] = [width, height];
}
const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)));
// One picture a line, as Prettier lays out an object of short arrays.
const lines = Object.entries(sorted).map(
  ([name, [w, h]]) => `  "${name}": [${String(w)}, ${String(h)}]`,
);
writeFileSync(MANIFEST, `{\n${lines.join(",\n")}\n}\n`);
console.log(`${MANIFEST}: ${String(Object.keys(sorted).length)} pictures`);

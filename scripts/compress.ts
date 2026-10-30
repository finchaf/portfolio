// Lays a Brotli and a gzip copy beside every text file of the build. Caddy serves them from disk
// (`precompressed` in its block), so a response costs the shared server no CPU, and the slowest
// Brotli level costs only the build.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const ROOT = "out";
const TEXT = new Set([".css", ".html", ".js", ".json", ".svg", ".txt", ".xml"]);

const entries = await readdir(ROOT, { recursive: true, withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && TEXT.has(extname(entry.name)))
  .map((entry) => join(entry.parentPath, entry.name));

await Promise.all(
  files.map(async (file) => {
    const body = await readFile(file);
    await Promise.all([
      writeFile(`${file}.gz`, gzipSync(body, { level: 9 })),
      writeFile(
        `${file}.br`,
        brotliCompressSync(body, {
          params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
        }),
      ),
    ]);
  }),
);

console.log(`compressed ${files.length} files`);

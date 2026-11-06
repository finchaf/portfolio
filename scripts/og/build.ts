// Photographs the link pictures into public/og/ and writes the manifest the metadata reads. Run by
// hand with `pnpm og` when a card changes: the pictures are committed, so a build needs no browser.
import { print, writeManifest } from "../print/print.ts";
import { CARDS, cardPage, digest, SIZE } from "./cards.ts";

const files = await print(
  { viewport: SIZE, deviceScaleFactor: 1 },
  CARDS.map(({ locale, card, key }) => ({
    key,
    path: `public/og/${key}.png`,
    html: () => cardPage(locale, card),
  })),
  (page) => page.screenshot({ type: "png", clip: { x: 0, y: 0, ...SIZE } }),
);

await writeManifest("src/lib/share-images.json", { input: digest(), files });

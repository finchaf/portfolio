import NextImage, { type ImageProps } from "next/image";

import SIZES from "./avif-sizes.json";

const MEASURED: Record<string, readonly number[] | undefined> = SIZES;

/** An imported AVIF with its real size: the bundler reads none and gives it 100 × 100. */
function sized(source: ImageProps["src"]): ImageProps["src"] {
  if (typeof source !== "object" || !("src" in source)) return source;
  const name =
    source.src
      .split("/")
      .pop()
      ?.replace(/\.[^.]+\.avif$/, ".avif") ?? "";
  const [width, height] = MEASURED[name] ?? [];
  return width && height ? { ...source, width, height } : source;
}

/**
 * Next.js's image, with the size an AVIF really has: without it the page reserves a square for
 * every picture until it loads, and moves when it does. The sizes are measured by
 * scripts/media/avif.mjs into avif-sizes.json.
 */
export function Image({ src, alt, ...props }: ImageProps) {
  return <NextImage alt={alt} src={sized(src)} {...props} />;
}

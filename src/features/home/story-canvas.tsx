import Image from "next/image";
import { useTranslations } from "next-intl";

import figmaFile from "./photos/figma-file.webp";
import figmaFrame from "./photos/figma-frame.webp";
import { CANVAS, CANVAS_ORIGIN } from "./story-data";

/** The sharp frame repeats what the picture already says. */
const DECORATIVE = "";

const percent = (share: number) => `${String(share * 100)}%`;

/**
 * The file behind the first chapter, in a small window of Figma. A scene starts on one frame and
 * pulls back to the whole canvas; without a scene it is the whole canvas. The sharp frame lies exactly
 * over its place in the picture, so the camera can come close to it.
 */
export function FigmaCanvas() {
  const t = useTranslations("home.story.omsk");
  const { left, top, width } = CANVAS.frame;
  return (
    <figure className="story-canvas" data-figma-view data-reveal>
      <div
        className="story-canvas-world"
        data-figma-world
        style={{ transformOrigin: CANVAS_ORIGIN.map(percent).join(" ") }}
      >
        <Image alt={t("canvas")} className="story-image" src={figmaFile} unoptimized />
        <div
          className="story-canvas-frame"
          style={{ left: percent(left), top: percent(top), width: percent(width) }}
        >
          <Image alt={DECORATIVE} className="story-image" src={figmaFrame} unoptimized />
          <i aria-hidden className="story-canvas-select" data-figma-select />
        </div>
      </div>
      <span aria-hidden className="story-canvas-size" data-figma-select>
        {t("canvasSize")}
      </span>
      <span aria-hidden className="story-canvas-zoom">
        <span data-figma-zoom>{CANVAS.fileZoom}</span>
      </span>
    </figure>
  );
}

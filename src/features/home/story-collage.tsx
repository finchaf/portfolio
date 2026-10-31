import Image from "next/image";
import { useTranslations } from "next-intl";

import airport from "./photos/scrap-airport.webp";
import book from "./photos/scrap-book.webp";
import child from "./photos/scrap-child.webp";
import desk from "./photos/scrap-desk.webp";
import forest from "./photos/scrap-forest.webp";
import hat from "./photos/scrap-hat.webp";
import moscow from "./photos/scrap-moscow.webp";
import prom from "./photos/scrap-prom.webp";
import windowView from "./photos/scrap-window.webp";
import { SCRAPS } from "./story-data";

const PICTURES = {
  airport,
  book,
  child,
  desk,
  forest,
  hat,
  moscow,
  prom,
  window: windowView,
};

/**
 * Loose photographs across the opening of the story. A scene deals them out of one pile as the story
 * arrives, and each then moves at its own depth; without a scene they simply lie in a row.
 */
export function StoryCollage() {
  const t = useTranslations("home.story.photos");
  return (
    <div className="story-collage" data-collage>
      {SCRAPS.map(({ key, left, top, size, tilt, drift }) => (
        <figure
          className="story-scrap"
          data-drift={drift}
          data-tilt={tilt}
          key={key}
          style={{
            "--left": left,
            "--top": top,
            "--size": size,
            "--tilt": `${String(tilt)}deg`,
          }}
        >
          <Image
            alt={t(`scraps.${key}`)}
            className="story-image"
            data-scrap
            src={PICTURES[key]}
            unoptimized
          />
        </figure>
      ))}
    </div>
  );
}

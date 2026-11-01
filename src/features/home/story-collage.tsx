import Image from "next/image";
import { useTranslations } from "next-intl";

import airport from "./photos/scrap-airport.webp";
import book from "./photos/scrap-book.webp";
import child from "./photos/scrap-child.webp";
import desk from "./photos/scrap-desk.webp";
import hat from "./photos/scrap-hat.webp";
import { SCRAPS, SCRAPS_NARROW_HEIGHT } from "./story-data";

const PICTURES = { airport, book, child, desk, hat };

/**
 * Loose photographs across the opening of the story. A scene deals them out of one pile as the story
 * arrives, and each then moves at its own depth; without a scene they simply lie in their places.
 */
export function StoryCollage() {
  const t = useTranslations("home.story.photos");
  return (
    <div className="story-collage" data-collage style={{ "--tall": SCRAPS_NARROW_HEIGHT }}>
      {SCRAPS.map(({ key, left, top, size, tilt, drift, narrow }) => (
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
            "--narrow-left": narrow.left,
            "--narrow-top": narrow.top,
            "--narrow-size": narrow.size,
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

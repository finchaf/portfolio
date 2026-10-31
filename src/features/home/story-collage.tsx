import Image from "next/image";
import { useTranslations } from "next-intl";

import bird from "./photos/scrap-bird.webp";
import cat from "./photos/scrap-cat.webp";
import mirror from "./photos/scrap-mirror.webp";
import mountains from "./photos/scrap-mountains.webp";
import neon from "./photos/scrap-neon.webp";
import pug from "./photos/scrap-pug.webp";
import sky from "./photos/scrap-sky.webp";
import snow from "./photos/scrap-snow.webp";
import { SCRAPS } from "./story-data";

const PICTURES = { bird, cat, mirror, mountains, neon, pug, sky, snow };

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

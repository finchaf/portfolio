import "./board.css";

import Image, { type StaticImageData } from "next/image";

import chapterFlowDark from "./shots/chapter-flow-dark.webp";
import chapterFlowLight from "./shots/chapter-flow-light.webp";
import chapterPoraDark from "./shots/chapter-pora-dark.webp";
import chapterPoraLight from "./shots/chapter-pora-light.webp";
import chapterProjectsDark from "./shots/chapter-projects-dark.webp";
import chapterProjectsLight from "./shots/chapter-projects-light.webp";
import flowDark from "./shots/flow-dark.webp";
import flowLight from "./shots/flow-light.webp";
import homeCodeDark from "./shots/home-code-dark.webp";
import homeCodeLight from "./shots/home-code-light.webp";
import homeDark from "./shots/home-dark.webp";
import homeLight from "./shots/home-light.webp";
import phoneFlowDark from "./shots/phone-flow-dark.webp";
import phoneFlowLight from "./shots/phone-flow-light.webp";
import phonePoraDark from "./shots/phone-pora-dark.webp";
import phonePoraLight from "./shots/phone-pora-light.webp";
import poraDark from "./shots/pora-dark.webp";
import poraLight from "./shots/pora-light.webp";

const SHOTS = {
  home: [homeLight, homeDark],
  homeCode: [homeCodeLight, homeCodeDark],
  flow: [flowLight, flowDark],
  phoneFlow: [phoneFlowLight, phoneFlowDark],
  pora: [poraLight, poraDark],
  phonePora: [phonePoraLight, phonePoraDark],
  chapterPora: [chapterPoraLight, chapterPoraDark],
  chapterFlow: [chapterFlowLight, chapterFlowDark],
  chapterProjects: [chapterProjectsLight, chapterProjectsDark],
} satisfies Record<string, [StaticImageData, StaticImageData]>;

/** The CV's first page as it is printed, light in both modes as the paper is: `shots.mjs` sets it. */
export { default as cvEn } from "./shots/cv-en.webp";
export { default as cvRu } from "./shots/cv-ru.webp";

/**
 * A frame of the built site in the reader's mode: both are in the HTML, and the one the stylesheet
 * hides is never fetched, since a lazy image with no box does not load.
 */
export function Shot({
  name,
  alt = "",
  sizes,
}: {
  name: keyof typeof SHOTS;
  alt?: string;
  sizes: string;
}) {
  const [light, dark] = SHOTS[name];
  return (
    <>
      <Image
        alt={alt}
        className="pj-only-light"
        loading="lazy"
        sizes={sizes}
        src={light}
        unoptimized
      />
      <Image
        alt={alt}
        className="pj-only-dark"
        loading="lazy"
        sizes={sizes}
        src={dark}
        unoptimized
      />
    </>
  );
}

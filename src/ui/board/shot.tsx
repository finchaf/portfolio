import "./board.css";

import type { StaticImageData } from "next/image";

import { Image } from "../image";

import chapterFlowDark from "./shots/chapter-flow-dark.avif";
import chapterFlowLight from "./shots/chapter-flow-light.avif";
import chapterPoraDark from "./shots/chapter-pora-dark.avif";
import chapterPoraLight from "./shots/chapter-pora-light.avif";
import chapterProjectsDark from "./shots/chapter-projects-dark.avif";
import chapterProjectsLight from "./shots/chapter-projects-light.avif";
import flowDark from "./shots/flow-dark.avif";
import flowLight from "./shots/flow-light.avif";
import homeCodeDark from "./shots/home-code-dark.avif";
import homeCodeLight from "./shots/home-code-light.avif";
import homeDark from "./shots/home-dark.avif";
import homeLight from "./shots/home-light.avif";
import phoneFlowDark from "./shots/phone-flow-dark.avif";
import phoneFlowLight from "./shots/phone-flow-light.avif";
import phonePoraDark from "./shots/phone-pora-dark.avif";
import phonePoraLight from "./shots/phone-pora-light.avif";
import poraDark from "./shots/pora-dark.avif";
import poraLight from "./shots/pora-light.avif";

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
export { default as cvEn } from "./shots/cv-en.avif";
export { default as cvRu } from "./shots/cv-ru.avif";

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
      <Image alt={alt} className="pj-only-light" loading="lazy" sizes={sizes} src={light} />
      <Image alt={alt} className="pj-only-dark" loading="lazy" sizes={sizes} src={dark} />
    </>
  );
}

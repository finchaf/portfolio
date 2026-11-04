import type { StaticImageData } from "next/image";

import androidPoster from "./pictures/android-poster.webp";
import iosPoster from "./pictures/ios-poster.webp";
import webLessonDark from "./pictures/web-lesson-dark.webp";
import webLessonLight from "./pictures/web-lesson-light.webp";
import webSearchDark from "./pictures/web-search-dark.webp";
import webSearchLight from "./pictures/web-search-light.webp";
import webWeekDark from "./pictures/web-week-dark.webp";
import webWeekLight from "./pictures/web-week-light.webp";

/**
 * A picture of a chapter: the product's own frames, with made-up people only. A frame of an
 * interface comes in both modes and the reader sees theirs; a poster is one picture for both.
 * Its words are the chapter's `pictures.<key>` in messages.
 */
export interface Picture {
  key: string;
  light: StaticImageData;
  dark?: StaticImageData;
}

/**
 * The posters the team made for the alpha test, 26.09.2026: the apps on the fixtures' data. The
 * web's frames were taken on 04.11.2026 from the product's build at 1680 × 1050, over an API of
 * made-up data (a made-up university, the iOS fixtures' invented tutors), at Thursday 11:31.
 */
export const PICTURES = {
  iosPoster: { key: "poster", light: iosPoster },
  androidPoster: { key: "poster", light: androidPoster },
  webWeek: { key: "week", light: webWeekLight, dark: webWeekDark },
  webLesson: { key: "lesson", light: webLessonLight, dark: webLessonDark },
  webSearch: { key: "search", light: webSearchLight, dark: webSearchDark },
} satisfies Record<string, Picture>;

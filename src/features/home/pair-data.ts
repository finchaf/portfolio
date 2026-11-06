/**
 * The chapter «Пора на пару»: one lesson that travels through the product. Where it lands on each
 * frame, as shares of that frame, so the places hold at any size. The frames are the product's own
 * screens on made-up data: the web from its build on a stand-in API
 * (`docs/private/scripts/pora-shots/chapter.mjs`, Monday 09:31 by Omsk's clock, 1440 × 900), the
 * phones from the iOS simulator and the Android emulator.
 */

/** A place on a frame: left, top, width and height as shares of the frame's width and height. */
export interface Place {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The web's frame is a whole window of 1440 × 900; the card's picture keeps 6 px round it, for its ring. */
const WEB = { width: 1440, height: 900, edge: 6 };

const onWeb = (x: number, y: number, w: number, h: number): Place => ({
  x: (x - WEB.edge) / WEB.width,
  y: (y - WEB.edge) / WEB.height,
  w: (w + 2 * WEB.edge) / WEB.width,
  h: (h + 2 * WEB.edge) / WEB.height,
});

/** A place measured in a phone's frame, in its own pixels. */
const onFrame = (
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): Place => ({
  x: x / width,
  y: y / height,
  w: w / width,
  h: h / height,
});

export const LAND = {
  /** Monday's first lesson, the one going on: its place is empty on the frame. */
  web: onWeb(416, 60, 183, 134),
  /**
   * Over Monday's second lesson, taught by the same teacher: the editor's clash. The lesson is still
   * in the hand, a little aside, so the one under it is seen.
   */
  clash: onWeb(416 + 34, 211 + 26, 183, 134),
  /** Wednesday's first slot, free. */
  free: onWeb(816, 60, 184, 134),
  /** The Live Activity on the iPhone's lock screen, measured on the simulator's frame, 1206 × 2622. */
  la: onFrame(1206, 2622, 41, 1846, 1123, 386),
  /** The card of the lesson going on, on the Android app's home: the emulator's frame, 1280 × 2856. */
  android: onFrame(1280, 2856, 48, 864, 1184, 378),
} satisfies Record<string, Place>;

/**
 * The devices the frames are shown in: the owner's mockups of an iPhone 18 Pro and a Pixel 10 Pro,
 * each a picture with its screen cut out. Where the screen is and the radius of its corner, in the
 * picture's own pixels: the frame of the simulator or the emulator fills that screen to the pixel, and
 * its corners are rounded as the cut, or they would show past the body.
 */
export const DEVICES = {
  ios: { width: 1350, height: 2760, screen: { x: 72, y: 69, w: 1206, h: 2622, r: 186 } },
  android: {
    width: 1414,
    height: 2982,
    screen: { x: 62.617, y: 64.073, w: 1280, h: 2857.065, r: 174.744 },
  },
} as const;

/** The stops, in order: what the lesson is on each, and the type its tick wears in the bar. */
export const PAIR_STOPS = ["intro", "web", "ios", "android", "editor", "origin"] as const;
export type PairStop = (typeof PAIR_STOPS)[number];

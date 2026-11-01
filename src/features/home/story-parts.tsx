import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

import { BLEEDS, SPANS } from "./story-data";

type Part = Exclude<keyof typeof SPANS, "open">;

/** One chapter of the ribbon: on a wide screen a run of columns, on a phone one column. */
export function StoryChapter({
  id,
  dark = false,
  settles = false,
  children,
}: {
  id: Part;
  /** Wears the theme's dark colours in either mode. */
  dark?: boolean;
  /** The ribbon stops here, so its moving lines come to rest instead of passing. */
  settles?: boolean;
  children: ReactNode;
}) {
  const bleed = id in BLEEDS ? BLEEDS[id as keyof typeof BLEEDS] : 0;
  return (
    <li
      className={`story-chapter story-${id}`}
      data-chapter-of-story
      data-ruler-band={dark ? "" : undefined}
      data-settle={settles ? "" : undefined}
      data-tint={dark ? "home" : undefined}
      style={{ "--span": SPANS[id], "--bleed": bleed }}
    >
      {children}
    </li>
  );
}

/** The part of a chapter that stands still on the screen while the ribbon runs on under it. */
export function StoryStay({ children }: { children: ReactNode }) {
  return (
    <div className="story-stay" data-stay>
      {children}
    </div>
  );
}

/** A column of a chapter, held to the top, the middle or the bottom of the screen. */
export function StoryCol({
  at = "top",
  weight = 1,
  spot = false,
  children,
}: {
  at?: "top" | "middle" | "bottom";
  weight?: number;
  /** A band of the accent over the whole height of the screen. */
  spot?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`story-col story-col-${at} ${spot ? "story-spot" : ""}`}
      data-ruler-band={spot ? "" : undefined}
      style={{ "--weight": weight }}
    >
      {children}
    </div>
  );
}

/** How far a chapter's date goes against the ribbon: less than a large line, it stands on its own. */
const DATE_DEPTH = 20;

export function StoryHead({ date, title }: { date: string; title: string }) {
  return (
    <header className="story-head" data-reveal>
      <p className="story-date font-display" data-lines={DATE_DEPTH}>
        {date}
      </p>
      <h3 className="story-name font-display">{title}</h3>
    </header>
  );
}

export function StoryText({ children }: { children: ReactNode }) {
  return (
    <p className="story-text" data-reveal>
      {children}
    </p>
  );
}

/**
 * A line of the story set large. Its lines of text move against the scroll at their own speeds and
 * read straight where they meet; `cross` sends them to opposite sides, for a turn in the story.
 */
export function StoryQuote({
  children,
  depth = 50,
  cross = false,
}: {
  children: ReactNode;
  depth?: number;
  cross?: boolean;
}) {
  return (
    <p className="story-quote" data-lines={depth} data-lines-cross={cross ? "" : undefined}>
      <span data-reveal>{children}</span>
    </p>
  );
}

export interface StoryPhotoProps {
  /** What the picture shows. */
  label: string;
  src: StaticImageData;
  /** Width in the units of the ribbon. */
  size?: number;
  /** Degrees the print lies at when it settles. */
  tilt?: number;
  drift?: number;
  caption?: string;
}

/** A print on the page. */
export function StoryPhoto({
  label,
  src,
  size = 22,
  tilt = 0,
  drift = 60,
  caption,
}: StoryPhotoProps) {
  return (
    <div
      className="story-photo"
      data-drift={drift}
      data-tilt={tilt}
      style={{ "--size": size, "--tilt": `${String(tilt)}deg` }}
    >
      <figure className="story-print" data-reveal>
        <Image alt={label} className="story-image" src={src} unoptimized />
        {caption && <figcaption className="story-caption">{caption}</figcaption>}
      </figure>
    </div>
  );
}

/** Two prints of one thing, the second lying over the corner of the first. Their drifts part them. */
export function StoryStack({ children }: { children: ReactNode }) {
  return <div className="story-stack">{children}</div>;
}

/** Two pictures of one piece of work: the smaller one lies over the lower corner of the larger. */
export function StoryPair({ children }: { children: ReactNode }) {
  return <div className="story-pair">{children}</div>;
}

/** A photograph from the top of the screen to the bottom, which the ribbon slides past. */
export function StoryBleed({ label, src }: { label: string; src: StaticImageData }) {
  return (
    <figure
      className="story-bleed"
      data-bleed
      data-ruler-band
      data-tint="home"
      style={{ "--ratio": src.width / src.height }}
    >
      <Image alt={label} className="story-bleed-image" data-bleed-image src={src} unoptimized />
    </figure>
  );
}

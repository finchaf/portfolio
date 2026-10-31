import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

import { Placeholder } from "./placeholder";
import { SPANS } from "./story-data";

/** One chapter of the ribbon: on a wide screen a run of columns, on a phone one column. */
export function StoryChapter({
  id,
  dark = false,
  children,
}: {
  id: Exclude<keyof typeof SPANS, "open">;
  /** Wears the theme's dark colours in either mode. */
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={`story-chapter story-${id}`}
      data-chapter-of-story
      data-tint={dark ? "home" : undefined}
      style={{ "--span": SPANS[id] }}
    >
      {children}
    </li>
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
      style={{ "--weight": weight }}
    >
      {children}
    </div>
  );
}

export function StoryHead({ date, title }: { date: string; title: string }) {
  return (
    <header className="story-head" data-reveal>
      <p className="story-date font-display">{date}</p>
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

/** A line of the story set large, that drifts against the ribbon on a wide screen. */
export function StoryQuote({ children, drift = 40 }: { children: ReactNode; drift?: number }) {
  return (
    <p className="story-quote" data-drift={drift}>
      <span data-reveal>{children}</span>
    </p>
  );
}

export interface StoryPhotoProps {
  /** What the picture shows; until the file exists, what is to stand here. */
  label: string;
  src?: StaticImageData;
  /** Width over height, of the picture or of the place kept for it. */
  ratio?: number;
  /** Width in the units of the ribbon. */
  size?: number;
  /** Degrees the print lies at when it settles. */
  tilt?: number;
  drift?: number;
}

/** A print on the page. A file not yet delivered keeps its place, and never ships (placeholder.tsx). */
export function StoryPhoto({
  label,
  src,
  ratio = 4 / 3,
  size = 22,
  tilt = 0,
  drift = 60,
}: StoryPhotoProps) {
  return (
    <figure
      className="story-photo"
      data-drift={drift}
      data-tilt={tilt}
      style={{ "--ratio": ratio, "--size": size, "--tilt": `${String(tilt)}deg` }}
    >
      <div className="story-print" data-reveal>
        {src ? (
          <Image alt={label} className="story-image" src={src} unoptimized />
        ) : (
          <Placeholder kind="frame" label={label} />
        )}
      </div>
    </figure>
  );
}

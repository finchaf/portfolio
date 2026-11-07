"use client";

import { useState, type ReactNode } from "react";

export interface ChapterFrame {
  key: string;
  name: string;
  /** The chapter on the home page. */
  href: string;
  shot: ReactNode;
}

/**
 * The three chapters of the home page, each on a stop as the reader sees it. The frames are all in
 * the HTML; the ones not chosen have no box, so their pictures are never fetched.
 */
export function DemoChapters({
  frames,
  label,
  open,
}: {
  frames: readonly ChapterFrame[];
  /** The name of the row of chapters, as the reader hears it. */
  label: string;
  open: string;
}) {
  const [chosen, choose] = useState(frames[0]?.key);
  const shown = frames.find((frame) => frame.key === chosen) ?? frames[0];
  return (
    <div className="pj-chapters-demo">
      <div aria-label={label} className="pj-seg" role="group">
        {frames.map((frame) => (
          <button
            aria-pressed={frame.key === shown?.key}
            key={frame.key}
            onClick={() => {
              choose(frame.key);
            }}
            type="button"
          >
            {frame.name}
          </button>
        ))}
      </div>
      <div className="pj-chapters-frame">
        {frames.map((frame) => (
          <div data-shown={frame.key === shown?.key ? "" : undefined} key={frame.key}>
            {frame.shot}
          </div>
        ))}
      </div>
      {shown ? (
        <a className="pj-mini" href={shown.href}>
          {open}
        </a>
      ) : null}
    </div>
  );
}

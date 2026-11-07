"use client";

import { useState, type ReactNode } from "react";

import { useLens } from "./use-lens";

type View = "lens" | "design" | "code";

/** The lens over the first screen: its size, its pace, and where it waits, the middle. */
const LENS = { radius: 0.17, follow: 0.18, start: { x: 0.5, y: 0.5 }, bounded: false };

/** The two real layers of the first screen, one over the other, and a lens between them. */
export function DemoLens({
  design,
  code,
  strings,
}: {
  design: ReactNode;
  code: ReactNode;
  strings: { hint: string; design: string; code: string; lens: string; label: string };
}) {
  const [view, setView] = useState<View>("lens");
  const { frame, clip, ring } = useLens(view, LENS);

  return (
    <div className="pj-lens-demo" data-view={view}>
      <div aria-label={strings.label} className="pj-seg" role="group">
        {(["lens", "design", "code"] as const).map((key) => (
          <button
            aria-pressed={key === view}
            key={key}
            onClick={() => {
              setView(key);
            }}
            type="button"
          >
            {strings[key]}
          </button>
        ))}
      </div>
      <div className="pj-lens-frame" ref={frame}>
        <div className="pj-lens-layer">{design}</div>
        <div className="pj-lens-layer pj-lens-code" ref={clip}>
          {code}
        </div>
        <i aria-hidden className="pj-lens-ring" ref={ring} />
      </div>
      <p className="pj-demo-note">{strings.hint}</p>
    </div>
  );
}

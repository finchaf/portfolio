"use client";

import { useState, type ReactNode } from "react";

/** Plays the two page changes on two real frames, so the difference is seen and not described. */
export function DemoSlash({
  a,
  b,
  strings,
}: {
  a: ReactNode;
  b: ReactNode;
  strings: {
    before: string;
    after: string;
    play: string;
    beforeNote: string;
    afterNote: string;
    label: string;
  };
}) {
  const [way, setWay] = useState<"before" | "after">("after");
  const [turn, setTurn] = useState(0);
  const [back, setBack] = useState(false);

  const play = (next: "before" | "after") => {
    setWay(next);
    setBack((value) => !value);
    setTurn((value) => value + 1);
  };

  return (
    <div className="pj-slash-demo" data-way={way}>
      <div aria-label={strings.label} className="pj-seg" role="group">
        {(["after", "before"] as const).map((key) => (
          <button
            aria-pressed={key === way}
            key={key}
            onClick={() => {
              play(key);
            }}
            type="button"
          >
            {strings[key]}
          </button>
        ))}
      </div>
      <div className="pj-slash-frame">
        <div className="pj-slash-page">{back ? a : b}</div>
        {turn > 0 ? (
          <div className="pj-slash-page pj-slash-new" key={turn}>
            {back ? b : a}
          </div>
        ) : null}
        {turn > 0 ? <i aria-hidden className="pj-slash-lead" key={`lead-${String(turn)}`} /> : null}
      </div>
      <div className="pj-slash-under">
        <p className="pj-demo-note">{way === "after" ? strings.afterNote : strings.beforeNote}</p>
        <button
          className="pj-mini"
          onClick={() => {
            play(way);
          }}
          type="button"
        >
          {strings.play}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef, type PointerEvent } from "react";

const FRAMES = [
  { left: "6%", top: "10%", width: "42%", height: "42%", depth: 1 },
  { left: "54%", top: "6%", width: "38%", height: "36%", depth: 2 },
  { left: "16%", top: "60%", width: "34%", height: "30%", depth: 3 },
  { left: "58%", top: "50%", width: "36%", height: "40%", depth: 1.5 },
] as const;

/** A piece of the canvas: the frames drift, and part around the pointer at their own depths. */
export function MiniCanvas({ frames }: { frames: readonly string[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    stage.current?.style.setProperty(
      "--pointer-x",
      `${(event.clientX - box.left) / box.width - 0.5}`,
    );
    stage.current?.style.setProperty(
      "--pointer-y",
      `${(event.clientY - box.top) / box.height - 0.5}`,
    );
  };
  return (
    <div
      aria-hidden
      className="mini-canvas relative z-10 min-h-56 overflow-hidden rounded-2xl bg-raised"
      onPointerMove={follow}
      ref={stage}
    >
      {FRAMES.map(({ depth, ...box }, index) => (
        <i className="mini-canvas-frame" key={frames[index]} style={{ ...box, "--depth": depth }}>
          <span className="font-mono text-[11px] text-muted not-italic">{frames[index]}</span>
        </i>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { usePlaying } from "@/motion/use-playing";

const STEP_MS = 900;
const PAUSE_BEATS = 4;

/**
 * A task going through the terminal, line by line. Every line is laid out from the start, hidden or
 * not, so the box keeps its size; the HTML shows the whole run.
 */
export function MiniTerminal({ lines }: { lines: readonly string[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const playing = usePlaying(stage);
  const [beat, setBeat] = useState<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setBeat((current) => ((current ?? 0) + 1) % (lines.length + PAUSE_BEATS));
    }, STEP_MS);
    return () => {
      clearInterval(timer);
    };
  }, [playing, lines.length]);

  return (
    <div
      aria-hidden
      className="relative z-10 min-h-56 overflow-hidden rounded-2xl bg-page p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-ink scheme-dark"
      data-tint="flow"
      ref={stage}
    >
      {lines.map((line, index) => (
        <p className={beat === null || index <= beat ? undefined : "invisible"} key={line}>
          {line}
        </p>
      ))}
    </div>
  );
}

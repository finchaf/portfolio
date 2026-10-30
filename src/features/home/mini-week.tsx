"use client";

import { useEffect, useRef, useState } from "react";

import { usePlaying } from "@/motion/use-playing";

import { conflicts, DAYS, moved, nextSlot, OPENING, SCRIPT, SLOTS, type Lesson } from "./week";

const STEP_MS = 1800;

export interface MiniWeekProps {
  days: readonly string[];
  lessons: Record<Lesson["id"], string>;
  moveLabel: Record<Lesson["id"], string>;
  conflict: string;
  clear: string;
}

/**
 * A week with the product's real rule. It plays a conflict and its fix by itself until a reader
 * presses a lesson; from then on the lessons are theirs, and the rule answers them.
 */
export function MiniWeek({ days, lessons, moveLabel, conflict, clear }: MiniWeekProps) {
  const [week, setWeek] = useState<readonly Lesson[]>(OPENING);
  const [touched, setTouched] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const beat = useRef(0);
  const playing = usePlaying(stage) && !touched;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const move = SCRIPT[beat.current % SCRIPT.length];
      beat.current += 1;
      if (move) setWeek((current) => moved(current, move));
    }, STEP_MS);
    return () => {
      clearInterval(timer);
    };
  }, [playing]);

  const clashing = conflicts(week);
  return (
    <div className="relative z-10 flex min-h-56 flex-col gap-2" ref={stage}>
      <div className="grid grid-cols-5 gap-1 text-center font-mono text-xs text-muted">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mini-week relative flex-1">
        {Array.from({ length: DAYS * SLOTS }, (_, index) => (
          <i className="mini-week-cell" key={index} />
        ))}
        {week.map((lesson) => (
          <button
            aria-label={moveLabel[lesson.id]}
            className={`mini-week-lesson ${clashing.has(lesson.id) ? "bg-danger" : "bg-accent-strong"} text-on-accent`}
            key={lesson.id}
            onClick={() => {
              setTouched(true);
              setWeek((current) => moved(current, nextSlot(lesson)));
            }}
            style={{ "--day": lesson.day, "--slot": lesson.slot }}
            type="button"
          >
            {lessons[lesson.id]}
          </button>
        ))}
      </div>
      <p aria-live={touched ? "polite" : "off"} className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className={`size-2 rounded-full ${clashing.size > 0 ? "bg-danger" : "bg-success"}`}
        />
        {clashing.size > 0 ? conflict : clear}
      </p>
    </div>
  );
}

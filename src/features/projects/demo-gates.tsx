"use client";

import { useEffect, useRef, useState } from "react";

import { COMMAND, GATES } from "./facts";

/** How long the replay takes, in milliseconds: the real run's shares, a fraction of its length. */
const REPLAY = 3200;

/** The table of a real run, replayed once when it reaches the screen. It is all in the HTML. */
export function DemoGates({ again, summary }: { again: string; summary: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState<number>(GATES.length + 1);
  const timers = useRef<number[]>([]);

  const replay = () => {
    timers.current.forEach((timer) => {
      window.clearTimeout(timer);
    });
    timers.current = [];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setDone(0);
    const total = GATES.reduce((sum, [, seconds]) => sum + seconds, 0);
    let at = 160;
    GATES.forEach(([, seconds], index) => {
      at += 60 + (seconds / total) * REPLAY;
      timers.current.push(
        window.setTimeout(() => {
          setDone(index + 1);
        }, at),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setDone(GATES.length + 1);
      }, at + 140),
    );
  };

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          replay();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    const pending = timers.current;
    return () => {
      observer.disconnect();
      pending.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
    // The run starts once, from what is on the screen.
  }, []);

  return (
    <div className="pj-term pj-gates-demo" ref={box}>
      <p className="pj-term-command">{COMMAND.check}</p>
      {GATES.map(([name, seconds], index) => (
        <p data-waiting={index >= done || undefined} key={name}>
          <span>{name}</span>
          <em>{COMMAND.passed}</em>
          <span>
            {seconds.toFixed(1)}
            {COMMAND.seconds}
          </span>
        </p>
      ))}
      <p className="pj-term-sum" data-waiting={done <= GATES.length || undefined}>
        {summary}
      </p>
      <button className="pj-mini" onClick={replay} type="button">
        {again}
      </button>
      <p aria-hidden className="pj-status">
        <span>{COMMAND.mode}</span>
        <span>{COMMAND.branch}</span>
        <span>{COMMAND.cat}</span>
      </p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { isCalm } from "@/motion/reduced";
import { Image } from "@/ui/image";

export interface Wall {
  tag: string;
  date: string;
  pages: number;
  words: string;
  size: string;
  light: string;
  dark: string;
}

/**
 * Every release of the thesis as a wall of its pages, picked with a slider. The walls are fetched
 * when the demonstration comes near, in the reader's mode only; the slider then runs once through
 * them, from the first scaffold to the last release. Without a script the last one stands.
 */
export function DemoWalls({
  walls,
  strings,
}: {
  walls: readonly Wall[];
  strings: {
    label: string;
    alt: string;
    pages: string;
    date: string;
    words: string;
    size: string;
  };
}) {
  const last = walls.length - 1;
  const [at, setAt] = useState(last);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    let frame = 0;
    // A reader who has taken the slider, or a page that has gone, keeps the sweep from starting.
    let stopped = false;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        // The stylesheet shows one mode's picture; only that mode's walls are worth fetching.
        const shown = node.querySelector(".pj-only-dark");
        const dark = shown ? getComputedStyle(shown).display !== "none" : false;
        const loads = walls.map(
          (wall) =>
            new Promise<void>((done) => {
              const image = new window.Image();
              image.onload = image.onerror = () => {
                done();
              };
              image.src = dark ? wall.dark : wall.light;
            }),
        );
        if (isCalm()) return;
        void Promise.all(loads).then(() => {
          if (stopped) return;
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / 3600);
            setAt(Math.round(t * last));
            if (t < 1) frame = requestAnimationFrame(step);
          };
          frame = requestAnimationFrame(step);
        });
      },
      { rootMargin: "0px 0px -35% 0px" },
    );
    near.observe(node);
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
    node.addEventListener("pointerdown", stop);
    node.addEventListener("keydown", stop);
    return () => {
      near.disconnect();
      stop();
      node.removeEventListener("pointerdown", stop);
      node.removeEventListener("keydown", stop);
    };
  }, [walls, last]);

  const wall = walls[at] ?? walls[last];
  if (!wall) return null;

  return (
    <div className="pj-walls" ref={box}>
      <div className="pj-walls-wall">
        <Image
          alt={`${strings.alt} ${wall.tag}`}
          className="pj-only-light"
          draggable={false}
          height={826}
          loading="lazy"
          src={wall.light}
          width={776}
        />
        <Image
          alt={`${strings.alt} ${wall.tag}`}
          className="pj-only-dark"
          draggable={false}
          height={826}
          loading="lazy"
          src={wall.dark}
          width={776}
        />
      </div>
      <div className="pj-walls-side">
        <p className="pj-walls-tag">{wall.tag}</p>
        <p className="pj-walls-pages">
          <b>{wall.pages}</b>
          <span>{strings.pages}</span>
        </p>
        <dl>
          <div>
            <dt>{strings.date}</dt>
            <dd>{wall.date}</dd>
          </div>
          <div>
            <dt>{strings.words}</dt>
            <dd>{wall.words}</dd>
          </div>
          <div>
            <dt>{strings.size}</dt>
            <dd>{wall.size}</dd>
          </div>
        </dl>
        <input
          aria-label={strings.label}
          aria-valuetext={wall.tag}
          className="pj-walls-range"
          data-js-only
          max={last}
          min={0}
          onChange={(event) => {
            setAt(Number(event.target.value));
          }}
          step={1}
          type="range"
          value={at}
        />
      </div>
    </div>
  );
}

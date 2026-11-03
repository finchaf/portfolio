"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

interface Step {
  kind: string;
  keys: string;
  buffer: string;
  cursor: number;
  from?: number;
  to?: number;
  render?: number;
}

/** One picture of the editor: what is in the buffer, where the cursor is, what was just pressed. */
interface Frame {
  buffer: string;
  cursor: number;
  /** The key or the trigger just pressed, and what it turned into. */
  pressed: string;
  became?: string;
  glow?: [number, number];
  keys: number;
  normal?: boolean;
  /** The compile the PDF shows. */
  render: number;
  wait: number;
}

/** The line's number in `les-17.tex`. */
const LINE = 259;

const CHAR = 52;
const EXPANDED = 420;
const JUMP = 300;
const COMPILE = 650;

/** Every frame of the line, from the record: a trigger is typed letter by letter, then expands. */
function framesOf(steps: readonly Step[]): Frame[] {
  const frames: Frame[] = [];
  let buffer = "";
  let cursor = 0;
  let keys = 0;
  let render = -1;
  for (const step of steps) {
    const before = buffer;
    const at = cursor;
    if (step.kind === "type" || step.kind === "snip") {
      // Triggers and words here are plain keys, one code unit each.
      for (let index = 0; index < step.keys.length; index += 1) {
        const typed = step.keys.slice(0, index + 1);
        keys += 1;
        frames.push({
          buffer: before.slice(0, at) + typed + before.slice(at),
          cursor: at + typed.length,
          pressed: step.kind === "snip" ? typed : step.keys.charAt(index),
          keys,
          render,
          wait: CHAR,
        });
      }
    } else {
      keys += step.keys.length;
    }
    buffer = step.buffer;
    cursor = step.cursor;
    if (step.kind === "snip") {
      frames.push({
        buffer,
        cursor,
        pressed: step.keys,
        became: buffer.slice(step.from ?? 0, step.to ?? 0).trim(),
        glow: [step.from ?? 0, step.to ?? 0],
        keys,
        render,
        wait: EXPANDED,
      });
    }
    if (step.kind === "jump") {
      frames.push({ buffer, cursor, pressed: step.keys, keys, render, wait: JUMP });
    }
    // `<leader>c` saves and compiles once, from normal mode; `a` goes back to typing.
    if (step.render !== undefined) {
      keys += 3;
      render = step.render;
      frames.push({
        buffer,
        cursor,
        pressed: "Esc ␣ c",
        keys,
        normal: true,
        render,
        wait: COMPILE,
      });
      keys += 1;
      frames.push({ buffer, cursor, pressed: "a", keys, render, wait: CHAR });
    }
  }
  // After the last compile there is nothing to go back to.
  if (frames[frames.length - 1]?.pressed === "a") frames.pop();
  return frames;
}

/** The source as Neovim colours it: commands, the maths' dollars and the braces apart. */
function painted(text: string, offset: number, glow?: [number, number]) {
  return [...text.matchAll(/\\[a-zA-Z]+|\\.|\$|[{}^_]|[^\\${}^_]+/g)].map((match) => {
    const [token] = match;
    const start = offset + match.index;
    const kind = token.startsWith("\\")
      ? "cmd"
      : token === "$"
        ? "math"
        : /^[{}^_]$/.test(token)
          ? "mark"
          : undefined;
    const lit = glow && start >= glow[0] && start < glow[1];
    return (
      <span data-lit={lit || undefined} data-tok={kind} key={start}>
        {token}
      </span>
    );
  });
}

/**
 * A line of lecture 17, typed again with the snippets it was typed with. The editor plays the
 * record of `scripts/latex/typing.py` back, and at each save the PDF shows the compile TeX made of
 * the buffer then. Without a script, and with reduced motion, the finished line stands.
 */
export function DemoTyping({
  steps,
  renders,
  strings,
}: {
  steps: readonly Step[];
  renders: ReactNode;
  strings: {
    file: string;
    pdf: string;
    keys: string;
    chars: string;
    replay: string;
    insert: string;
    normal: string;
    pressed: string;
  };
}) {
  const frames = useMemo(() => framesOf(steps), [steps]);
  const last = frames.length - 1;
  const [at, setAt] = useState(last);
  const [playing, setPlaying] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef(0);

  const play = () => {
    window.clearTimeout(timer.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAt(last);
      return;
    }
    setPlaying(true);
    let index = 0;
    const tick = () => {
      setAt(index);
      const frame = frames[index];
      index += 1;
      if (index > last || !frame) {
        setPlaying(false);
        return;
      }
      timer.current = window.setTimeout(tick, frame.wait);
    };
    tick();
  };

  // The line types itself once, the first time it comes into view.
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          seen.disconnect();
          play();
        }
      },
      { threshold: 0.6 },
    );
    seen.observe(node);
    return () => {
      seen.disconnect();
      window.clearTimeout(timer.current);
    };
    // `play` reads only stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frame = frames.at(at) ?? frames.at(last);
  if (!frame) return null;
  const { buffer, cursor } = frame;

  return (
    <div className="pj-tx" data-render-at={frame.render} ref={box}>
      <div className="pj-tx-editor">
        <p className="pj-tx-tab">{strings.file}</p>
        <p className="pj-tx-buffer">
          <span className="pj-tx-gutter" aria-hidden>
            {LINE}
          </span>
          <span className="pj-tx-code">
            {painted(buffer.slice(0, cursor), 0, frame.glow)}
            <i aria-hidden className="pj-tx-cursor" data-blink={!playing || undefined} />
            {painted(buffer.slice(cursor), cursor, frame.glow)}
          </span>
        </p>
        <p className="pj-tx-status">
          <span data-normal={frame.normal || undefined}>
            {frame.normal ? strings.normal : strings.insert}
          </span>
          <span className="pj-tx-pressed" aria-live="off">
            {strings.pressed} <kbd>{frame.pressed}</kbd>
            {frame.became && (
              <>
                {" → "}
                <code>{frame.became}</code>
              </>
            )}
          </span>
          <span>
            {strings.keys} {frame.keys} · {strings.chars} {buffer.length}
          </span>
        </p>
      </div>
      <div className="pj-tx-pdf">
        <p className="pj-tx-tab">{strings.pdf}</p>
        <div className="pj-tx-page">{renders}</div>
      </div>
      <button className="pj-mini" disabled={playing} onClick={play} type="button">
        {strings.replay}
      </button>
    </div>
  );
}

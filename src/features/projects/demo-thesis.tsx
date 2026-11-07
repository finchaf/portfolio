"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { isCalm } from "@/motion/reduced";

export interface SourceBlock {
  text: string;
  /** Where the block's first line stands, as a share of the page's height. */
  y: number;
  lines: number;
  head: boolean;
  indent: boolean;
}

type View = "lens" | "fields" | "source";

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/** LaTeX as Neovim colours it: commands apart from the words. */
function painted(text: string) {
  return [...text.matchAll(/\\[a-zA-Z]+|[^\\]+|\\./g)].map((match) => (
    <span data-tok={match[0].startsWith("\\") ? "cmd" : undefined} key={match.index}>
      {match[0]}
    </span>
  ));
}

/**
 * Page 69 of the thesis with its own source under it. The lens shows the source where it stands,
 * block over block, as PDFKit read the places of the lines; the margins show the five lines of the
 * preamble at work. Without a script the page stands alone, with the preamble under it.
 */
export function DemoThesis({
  page,
  blocks,
  preamble,
  strings,
}: {
  page: ReactNode;
  blocks: readonly SourceBlock[];
  preamble: readonly string[];
  strings: {
    label: string;
    lens: string;
    fields: string;
    source: string;
    hint: string;
    top: string;
    bottom: string;
    left: string;
    right: string;
    indent: string;
    spacing: string;
  };
}) {
  const [view, setView] = useState<View>("lens");
  const paper = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLElement>(null);
  const spot = useRef({ x: 0.52, y: 0.34, tx: 0.52, ty: 0.34, frame: 0 });

  useEffect(() => {
    const node = paper.current;
    if (!node) return;
    const s = spot.current;
    const draw = () => {
      const { x, y } = s;
      const w = node.clientWidth;
      const h = node.clientHeight;
      const r = w * 0.2;
      if (code.current) {
        code.current.style.clipPath =
          view === "lens" ? `circle(${String(r)}px at ${String(x * w)}px ${String(y * h)}px)` : "";
      }
      if (ring.current) {
        ring.current.style.width = `${String(r * 2)}px`;
        ring.current.style.height = `${String(r * 2)}px`;
        ring.current.style.transform = `translate(${String(x * w - r)}px, ${String(y * h - r)}px)`;
      }
    };
    const tick = () => {
      const k = isCalm() ? 1 : 0.22;
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      draw();
      s.frame =
        Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > 0.0006 ? requestAnimationFrame(tick) : 0;
    };
    const follow = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      s.tx = clamp((event.clientX - box.left) / box.width, 0, 1);
      s.ty = clamp((event.clientY - box.top) / box.height, 0, 1);
      if (!s.frame) s.frame = requestAnimationFrame(tick);
    };
    node.addEventListener("pointermove", follow);
    node.addEventListener("pointerdown", follow);
    const size = new ResizeObserver(draw);
    size.observe(node);
    draw();
    return () => {
      node.removeEventListener("pointermove", follow);
      node.removeEventListener("pointerdown", follow);
      size.disconnect();
      cancelAnimationFrame(s.frame);
      s.frame = 0;
    };
  }, [view]);

  const views: [View, string][] = [
    ["lens", strings.lens],
    ["fields", strings.fields],
    ["source", strings.source],
  ];

  return (
    <div className="pj-thesis" data-view={view}>
      <div aria-label={strings.label} className="pj-seg" data-js-only role="group">
        {views.map(([key, label]) => (
          <button
            aria-pressed={view === key}
            key={key}
            onClick={() => {
              setView(key);
            }}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="pj-thesis-paper" ref={paper}>
        {page}
        <div aria-hidden className="pj-thesis-code" ref={code}>
          {blocks.map((block) => (
            <p
              data-head={block.head || undefined}
              data-indent={block.indent || undefined}
              key={block.y}
              style={{ top: `${String(block.y * 100)}%`, "--lines": block.lines }}
            >
              {painted(block.text)}
            </p>
          ))}
        </div>
        <div aria-hidden className="pj-thesis-fields">
          <i data-edge="top">
            <b>{strings.top}</b>
          </i>
          <i data-edge="bottom">
            <b>{strings.bottom}</b>
          </i>
          <i data-edge="left">
            <b>{strings.left}</b>
          </i>
          <i data-edge="right">
            <b>{strings.right}</b>
          </i>
          <i data-edge="indent">
            <b>{strings.indent}</b>
          </i>
          <i data-edge="spacing">
            <b>{strings.spacing}</b>
          </i>
        </div>
        <i aria-hidden className="pj-thesis-ring" ref={ring} />
      </div>
      <p className="pj-demo-note" data-js-only>
        {strings.hint}
      </p>
      <pre className="pj-thesis-preamble">
        {preamble.map((line) => (
          <code key={line}>{painted(line)}</code>
        ))}
      </pre>
    </div>
  );
}

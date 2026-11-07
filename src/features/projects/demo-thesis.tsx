"use client";

import { type ReactNode, useState } from "react";

import { ScrollBar } from "@/ui/scroll-bar";

import { useLens } from "./use-lens";

export interface SourceBlock {
  text: string;
  /** Where the block's first line stands, as a share of the page's height. */
  y: number;
  lines: number;
  head: boolean;
  indent: boolean;
}

type View = "lens" | "fields" | "source";

/** The lens over page 69: a little larger and quicker, waiting on the text, kept on the page. */
const LENS = { radius: 0.2, follow: 0.22, start: { x: 0.52, y: 0.34 }, bounded: true };

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
  const { frame, clip, ring } = useLens(view, LENS);

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
      <div className="pj-thesis-paper" ref={frame}>
        {page}
        <div aria-hidden className="pj-thesis-code" ref={clip}>
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
      <div className="pj-scroll pj-thesis-preamble-box">
        <pre className="pj-thesis-preamble">
          {preamble.map((line) => (
            <code key={line}>{painted(line)}</code>
          ))}
        </pre>
        <ScrollBar axis="x" />
      </div>
    </div>
  );
}

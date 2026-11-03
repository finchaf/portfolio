"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Pages of the notes side by side. The strip scrolls by itself with a finger or a trackpad and
 * snaps to a page; the buttons are for a mouse, which has no sideways wheel. Without a script the
 * strip scrolls all the same.
 */
export function DemoPages({
  pages,
  strings,
}: {
  pages: readonly { node: ReactNode; title: string; detail: string }[];
  strings: { back: string; next: string; label: string };
}) {
  const strip = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const node = strip.current;
    if (!node) return;
    const read = () => {
      setEdge({
        start: node.scrollLeft < 4,
        end: node.scrollLeft + node.clientWidth > node.scrollWidth - 4,
      });
    };
    read();
    node.addEventListener("scroll", read, { passive: true });
    const size = new ResizeObserver(read);
    size.observe(node);
    return () => {
      node.removeEventListener("scroll", read);
      size.disconnect();
    };
  }, []);

  const move = (way: 1 | -1) => {
    const node = strip.current;
    const page = node?.querySelector("li");
    if (!node || !page) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: way * (page.offsetWidth + 16), behavior: calm ? "instant" : "smooth" });
  };

  return (
    <div className="pj-pages">
      {/* A strip that scrolls takes focus, or a keyboard could not move it. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <ul aria-label={strings.label} className="pj-pages-strip" ref={strip} tabIndex={0}>
        {pages.map(({ node, title, detail }) => (
          <li key={title + detail}>
            <figure>
              <span className="pj-paper">{node}</span>
              <figcaption>
                <b>{title}</b>
                <span>{detail}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="pj-pages-turn" data-js-only>
        <button
          aria-label={strings.back}
          className="pj-mini"
          disabled={edge.start}
          onClick={() => {
            move(-1);
          }}
          type="button"
        >
          <ArrowLeft aria-hidden size={14} />
        </button>
        <button
          aria-label={strings.next}
          className="pj-mini"
          disabled={edge.end}
          onClick={() => {
            move(1);
          }}
          type="button"
        >
          <ArrowRight aria-hidden size={14} />
        </button>
      </p>
    </div>
  );
}

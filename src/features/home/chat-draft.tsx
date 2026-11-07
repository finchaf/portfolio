"use client";

import { useEffect, useRef } from "react";

import { isCalm } from "@/motion/reduced";

/** How long a letter takes to appear, in milliseconds: an even, unhurried hand. */
const LETTER_MS = 48;

/**
 * The first message of a conversation, typed out once when it comes into view. It is part of the
 * thread's picture, which assistive tech never reads: the send names the link. The HTML holds the
 * whole line, so without a script and with reduced motion it is simply there, and a hidden copy of
 * it sizes the bubble from the start, so typing never moves it.
 */
export function ChatDraft({ text }: { text: string }) {
  const typed = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = typed.current;
    if (!node || isCalm()) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    node.textContent = "";
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        let count = 0;
        timer = setInterval(() => {
          count += 1;
          node.textContent = text.slice(0, count);
          if (count >= text.length) clearInterval(timer);
        }, LETTER_MS);
      },
      { threshold: 0.6 },
    );
    seen.observe(node);
    return () => {
      seen.disconnect();
      clearInterval(timer);
      node.textContent = text;
    };
  }, [text]);

  return (
    <span className="talk-draft">
      <span aria-hidden className="talk-draft-room">
        {text}
      </span>
      <span aria-hidden className="talk-draft-typed">
        <span ref={typed}>{text}</span>
        <i className="talk-caret" />
      </span>
    </span>
  );
}

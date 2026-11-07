"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { session } from "@/lib/session";

import { ARRIVE_KEY } from "./board-camera";

/** How long, in milliseconds, the page takes to rise in after the board's camera. */
const ARRIVE_FOR = 900;

/**
 * Keeps the panels on the section in view, and lets the page rise in when the board's camera has
 * just brought the reader here. The links of the outline work without it.
 */
export function PageOutline() {
  const anchor = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const page = anchor.current?.closest<HTMLElement>("[data-subpage]");
    if (!page || !session.get(ARRIVE_KEY)) return;
    session.remove(ARRIVE_KEY);
    page.dataset.arrive = "";
    const timer = window.setTimeout(() => {
      delete page.dataset.arrive;
    }, ARRIVE_FOR);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const page = anchor.current?.closest<HTMLElement>("[data-subpage]");
    if (!page) return;
    const mark = (step: string) => {
      page.querySelectorAll<HTMLElement>("[data-goto]").forEach((link) => {
        if (link.dataset.goto === step) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      page.querySelectorAll<HTMLElement>("[data-inspect]").forEach((block) => {
        block.hidden = block.dataset.inspect !== step;
      });
      page.querySelectorAll<HTMLElement>("[data-step]").forEach((frame) => {
        frame.toggleAttribute("data-active", frame.dataset.step === step);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            mark(entry.target.dataset.step ?? "");
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    page.querySelectorAll("[data-step]").forEach((frame) => {
      observer.observe(frame);
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  return <i hidden ref={anchor} />;
}

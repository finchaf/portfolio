"use client";

import { useRef, type ReactNode } from "react";

import { gsap } from "@/motion/gsap";
import { MOTION_ALLOWED, NARROW, WIDE } from "@/motion/reduced";
import { useScene } from "@/motion/scene";

import { runColumn } from "./story-column";
import { type Mark, turnToPaper } from "./story-moves";
import { runRibbon } from "./story-ribbon";

/** A wide screen runs the story as a ribbon, a narrower one as a column. */
const RIBBON = `${MOTION_ALLOWED} and ${WIDE}`;
const COLUMN = `${MOTION_ALLOWED} and ${NARROW}`;

/**
 * Directs the story. The stage holds by CSS `sticky`, the page scrolls natively and only transforms
 * and opacity move. What hides a reveal is `data-live`, set here, so with no script and with reduced
 * motion nothing is ever hidden and the chapters stay plain sections.
 */
export function StoryScene({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useScene(() => {
    const section = scope.current?.querySelector<HTMLElement>("[id='story']");
    const track = scope.current?.querySelector<HTMLElement>("[data-story-track]");
    if (!section || !track) return;
    const marks = gsap.utils.toArray<HTMLElement>("[data-story-mark]", section);
    const mark: Mark = (index) => {
      marks.forEach((each, at) => {
        each.toggleAttribute("data-active", at === index);
      });
    };

    const motion = gsap.matchMedia();
    const live = (run: () => () => void) => () => {
      section.toggleAttribute("data-live", true);
      mark(0);
      turnToPaper(section);
      const stop = run();
      return () => {
        stop();
        section.toggleAttribute("data-live", false);
        section.querySelectorAll("[data-seen]").forEach((element) => {
          element.removeAttribute("data-seen");
        });
      };
    };
    motion.add(
      RIBBON,
      live(() => runRibbon(section, track, mark)),
    );
    motion.add(
      COLUMN,
      live(() => runColumn(section, mark)),
    );
  }, scope);

  return <div ref={scope}>{children}</div>;
}

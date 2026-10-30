"use client";

import { useRef, type ReactNode } from "react";

import { gsap, headerHeight, MOTION_ALLOWED, useGSAP } from "@/motion/gsap";

const SETTLED = 0.94;

/** Cards hold by CSS `sticky`; this only sinks each one as the next slides over it. */
export function CaseStack({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_ALLOWED, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-case]");
        cards.slice(0, -1).forEach((card, index) => {
          gsap.to(card, {
            scale: SETTLED,
            transformOrigin: "50% 0",
            ease: "none",
            scrollTrigger: {
              trigger: cards[index + 1],
              start: "top bottom",
              end: () => `top top+=${headerHeight()}`,
              scrub: true,
            },
          });
        });
      });
    },
    { scope },
  );
  return <div ref={scope}>{children}</div>;
}

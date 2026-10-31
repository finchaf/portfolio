"use client";

import { useRef, type ReactNode } from "react";

import { driftLines } from "@/motion/drift-lines";
import { gsap, MOTION_ALLOWED, useGSAP } from "@/motion/gsap";

/** A heading whose lines come in from the side as it reaches the reader, and stay. */
export function DriftTitle({
  id,
  className,
  depth,
  cross = false,
  children,
}: {
  id: string;
  className: string;
  /** How far its lines start from their places, in pixels of the wide screen. */
  depth: number;
  /** The lines come from opposite sides. */
  cross?: boolean;
  children: ReactNode;
}) {
  const title = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_ALLOWED, () => {
        const element = title.current;
        if (!element) return;
        return driftLines(element, {
          depth,
          cross,
          path: "arrive",
          scrollTrigger: { trigger: element, start: "top bottom", end: "top 45%" },
        });
      });
    },
    { scope: title },
  );

  return (
    <h2 className={className} id={id} ref={title}>
      {children}
    </h2>
  );
}

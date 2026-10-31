"use client";

import { useRef, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { SCENE } from "@/motion/tokens";

type Setter = (value: number) => void;

/** How far apart two steps stand on the wheel, in widths of a step. */
const SPACING = 1.14;

/**
 * The scroll turns a wheel: the steps hang on its rim, the current one upright at the top, and rest
 * there long enough to read. Only transforms move, and the page scrolls natively: the stage holds
 * by CSS `sticky`. With reduced motion none of this runs and the steps stay a plain grid.
 */
export function StoryScene({ digits, children }: { digits: number[]; children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_ALLOWED, () => {
        const section = scope.current?.querySelector<HTMLElement>("[id='story']");
        const wheel = scope.current?.querySelector<HTMLElement>("[data-wheel]");
        const digit = scope.current?.querySelector<HTMLElement>("[data-year-digit]");
        const progress = scope.current?.querySelector<HTMLElement>("[data-story-progress]");
        if (!section || !wheel || !digit || !progress) return;

        const steps = gsap.utils.toArray<HTMLElement>("[data-step]", section);
        const setters = steps.map((step) => ({
          x: gsap.quickSetter(step, "x", "px") as Setter,
          y: gsap.quickSetter(step, "y", "px") as Setter,
          rotation: gsap.quickSetter(step, "rotation", "rad") as Setter,
        }));
        const turn = { at: 0 };
        const place = () => {
          const radius = wheel.offsetWidth / 2;
          const spread = ((steps[0]?.offsetWidth ?? 0) * SPACING) / radius;
          setters.forEach(({ x, y, rotation }, index) => {
            const angle = (index - turn.at) * spread;
            x(radius * Math.sin(angle));
            y(radius * (1 - Math.cos(angle)));
            rotation(angle);
          });
        };

        const scene = gsap.timeline({
          defaults: { ease: SCENE.move },
          onUpdate: place,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // The last screen of the section stays behind the works rising over it.
            end: () => `+=${section.offsetHeight - 2 * window.innerHeight}`,
            scrub: ScrollTrigger.isTouch === 1 ? true : SCENE.catchUp,
            onRefresh: place,
          },
        });
        scene.to({}, { duration: SCENE.rest });
        steps.slice(1).forEach((_, index) => {
          const next = index + 1;
          scene
            .to(turn, { at: next, duration: 1 })
            .to(digit, { yPercent: -((digits[next] ?? 0) * 100) / 4, duration: 1 }, "<")
            .to({}, { duration: SCENE.rest });
        });
        scene.fromTo(
          progress,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: scene.duration() },
          0,
        );
        place();
      });
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}

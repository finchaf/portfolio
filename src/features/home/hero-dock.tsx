"use client";

import { gsap, MOTION_ALLOWED, useGSAP } from "@/motion/gsap";

/**
 * As the page scrolls, the big name shrinks and flies into the header, then hands over to the
 * name there, set in the same face: `data-docked` on <html> tells the stylesheet to swap them.
 * It only moves what the HTML already shows, so nothing waits for it.
 */
export function HeroDock() {
  useGSAP(() => {
    gsap.matchMedia().add(MOTION_ALLOWED, () => {
      const root = document.documentElement;
      const name = document.querySelector<HTMLElement>("[data-hero-name]");
      const target = document.querySelector<HTMLElement>("[data-brand-name]");
      if (!name || !target) return;

      const distance = () => window.innerHeight * 0.5;
      const scale = () => target.offsetHeight / name.offsetHeight;
      gsap.to(name, {
        x: () => target.getBoundingClientRect().left - name.getBoundingClientRect().left,
        y: () =>
          target.getBoundingClientRect().top -
          (name.getBoundingClientRect().top + window.scrollY) +
          distance(),
        scale,
        transformOrigin: "0 0",
        ease: "none",
        scrollTrigger: {
          start: 0,
          end: distance,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            root.toggleAttribute("data-docked", self.progress >= 1);
          },
          onRefresh: (self) => {
            root.toggleAttribute("data-docked", self.progress >= 1);
          },
        },
      });
      return () => {
        delete root.dataset.docked;
      };
    });
  });
  return null;
}

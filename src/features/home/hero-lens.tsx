"use client";

import { useRef, useState, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { DURATION, PAGE_MOVED, SCENE } from "@/motion/tokens";

import { HERO_FACE } from "./hero-source";
import { Segmented } from "./segmented";

type Layer = "design" | "code";

const RADIUS = { phone: 110, wide: 170 };
const WIDE = 640;
/** How long the lens takes to cross the screen before a reader takes it, in seconds. */
const WANDER = 7;

const moved = () => window.scrollY > PAGE_MOVED;

const size = (node: Element) => {
  const { width, height } = node.getBoundingClientRect();
  return `${String(Math.round(width))} × ${String(Math.round(height))}`;
};

export interface HeroLensProps {
  labels: Record<"label" | Layer, string>;
  children: ReactNode;
}

/**
 * A lens over the first screen: under it the design turns into its source. It wanders until a
 * pointer takes it, and the switch opens the whole screen, which is also the way in with reduced
 * motion, where the lens stays shut and nothing moves. The HTML is whole without it. It reaches the
 * capsule above the screen too, in the capsule's own coordinates, so it belongs to the top of the
 * page alone: it shuts when the page moves, and the layer the reader chose comes back with the top.
 * When a page opens, the stylesheet assembles the screen on the plan of the same layer, and the
 * lens opens once that is over.
 */
export function HeroLens({ labels, children }: HeroLensProps) {
  const scope = useRef<HTMLElement>(null);
  const lens = useRef({ x: 0, y: 0, r: 0 });
  const [layer, setLayer] = useState<Layer>("design");

  const resting = () => (window.innerWidth < WIDE ? RADIUS.phone : RADIUS.wide);

  const open = (shown: Layer, duration: number) => {
    const hero = scope.current;
    if (!hero) return;
    const { width, height } = hero.getBoundingClientRect();
    const moving = matchMedia(MOTION_ALLOWED).matches;
    const wide = shown === "code" ? Math.hypot(width, height) : moving ? resting() : 0;
    gsap.to(lens.current, {
      r: moved() ? 0 : wide,
      duration: moving ? duration : 0,
      ease: SCENE.move,
      overwrite: "auto",
    });
  };

  useGSAP(
    () => {
      const hero = scope.current;
      if (!hero) return;
      const root = document.documentElement;
      const capsule = document.querySelector<HTMLElement>("[data-capsule]");
      const items = capsule?.querySelector("[data-capsule-items]");
      capsule?.setAttribute("data-lens", "");
      const shown = () => (hero.dataset.layer === "code" ? "code" : "design");

      const paint = () => {
        const { x, y, r } = lens.current;
        hero.style.setProperty("--lens-x", `${String(x)}px`);
        hero.style.setProperty("--lens-y", `${String(y)}px`);
        hero.style.setProperty("--lens-r", `${String(r)}px`);
        hero.style.setProperty("--lens-seen", r > 1 ? "1" : "0");
        if (!capsule || !items) return;
        const screen = hero.getBoundingClientRect();
        const box = items.getBoundingClientRect();
        capsule.style.setProperty("--lens-x", `${String(x + screen.left - box.left)}px`);
        capsule.style.setProperty("--lens-y", `${String(y + screen.top - box.top)}px`);
        capsule.style.setProperty("--lens-r", `${String(r)}px`);
      };
      const painting = ScrollTrigger.create({
        trigger: hero,
        onToggle: ({ isActive }) => {
          if (isActive) {
            gsap.ticker.add(paint);
            return;
          }
          // A jump past the screen outruns the lens shutting: nothing may stay open behind it.
          gsap.killTweensOf(lens.current, "r");
          lens.current.r = 0;
          paint();
          gsap.ticker.remove(paint);
        },
      });
      if (painting.isActive) gsap.ticker.add(paint);

      let away = moved();
      const turn = () => {
        if (moved() === away) return;
        away = !away;
        if (!root.hasAttribute("data-intro")) open(shown(), DURATION.base);
      };
      window.addEventListener("scroll", turn, { passive: true });

      const measure = () => {
        const name = hero.querySelector<HTMLElement>("[data-hero-name]");
        const box = hero.querySelector<HTMLElement>("[data-hero-box]");
        if (!name || !box) return;
        const face = parseFloat(getComputedStyle(name).fontSize);
        box.dataset.size = `${size(name)} · ${HERO_FACE} · ${String(Math.round(face))}px`;
        for (const plan of hero.querySelectorAll<HTMLElement>("[data-plan]")) {
          plan.dataset.size = size(plan);
        }
        if (capsule) capsule.dataset.size = size(capsule);
      };
      measure();
      ScrollTrigger.addEventListener("refresh", measure);
      void document.fonts.ready.then(measure);

      const motion = gsap.matchMedia();
      motion.add(MOTION_ALLOWED, () => {
        const assembling = root.hasAttribute("data-intro");
        const { width, height } = hero.getBoundingClientRect();
        lens.current.x = width * 0.34;
        lens.current.y = height * 0.5;
        lens.current.r = assembling || moved() ? 0 : resting();

        const wander = gsap.to(lens.current, {
          x: width * 0.72,
          y: height * 0.42,
          duration: WANDER,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        const onScreen = ScrollTrigger.create({
          trigger: hero,
          onToggle: ({ isActive }) => {
            if (wander.isActive() || wander.paused()) wander.paused(!isActive);
          },
        });

        if (assembling) {
          const plan = hero.querySelector("[data-hero-code]")?.getAnimations() ?? [];
          void Promise.allSettled(plan.map(({ finished }) => finished)).then(() => {
            root.removeAttribute("data-intro");
            open(shown(), DURATION.slow);
          });
        }

        // On the window: the capsule lies over the screen, and the pointer passes through it. The
        // page moves under a still pointer too, so the scroll asks for the last place again.
        let pointer: PointerEvent | undefined;
        const follow = (event: PointerEvent) => {
          pointer = event;
          const box = hero.getBoundingClientRect();
          if (event.clientY > box.bottom) return;
          wander.kill();
          gsap.to(lens.current, {
            x: event.clientX - box.left,
            y: event.clientY - box.top,
            duration: SCENE.catchUp,
            ease: "power3.out",
            overwrite: "auto",
          });
        };
        const stay = () => {
          if (pointer) follow(pointer);
        };
        window.addEventListener("pointermove", follow, { passive: true });
        window.addEventListener("pointerdown", follow, { passive: true });
        window.addEventListener("scroll", stay, { passive: true });
        return () => {
          onScreen.kill();
          window.removeEventListener("pointermove", follow);
          window.removeEventListener("pointerdown", follow);
          window.removeEventListener("scroll", stay);
        };
      });
      if (!matchMedia(MOTION_ALLOWED).matches) root.removeAttribute("data-intro");

      return () => {
        ScrollTrigger.removeEventListener("refresh", measure);
        window.removeEventListener("scroll", turn);
        gsap.ticker.remove(paint);
        painting.kill();
        motion.revert();
        capsule?.removeAttribute("data-lens");
      };
    },
    { scope },
  );

  const choose = (next: Layer) => {
    setLayer(next);
    open(next, DURATION.slow);
  };

  return (
    <section className="hero" data-layer={layer} ref={scope}>
      {children}
      <i aria-hidden className="hero-ring" />
      <div className="hero-switch">
        <Segmented
          label={labels.label}
          name="hero-layer"
          onChange={choose}
          options={[
            { value: "design", label: labels.design },
            { value: "code", label: labels.code },
          ]}
          value={layer}
        />
      </div>
    </section>
  );
}

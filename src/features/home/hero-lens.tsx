"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { gsap, MOTION_ALLOWED, ScrollTrigger } from "@/motion/gsap";
import { useScene } from "@/motion/scene";
import { DURATION, PAGE_MOVED, SCENE } from "@/motion/tokens";

import { HERO_FACE } from "./hero-source";
import { HeroSettings, type HeroSettingsProps } from "./hero-settings";
import { Segmented } from "@/ui/segmented";

type Layer = "design" | "code";

const RADIUS = { phone: 110, wide: 170 };
const WIDE = 640;
/** How long the lens takes to cross the screen before a reader takes it, in seconds. */
const WANDER = 7;
/** How far the lens keeps above the words under the name, in pixels. */
const CLEAR = 12;

const moved = () => window.scrollY > PAGE_MOVED;

const size = (node: Element) => {
  const { width, height } = node.getBoundingClientRect();
  return `${String(Math.round(width))} × ${String(Math.round(height))}`;
};

export interface HeroLensProps {
  labels: Record<"label" | Layer, string>;
  /** The settings stand in the same instrument as the switch, and leave with it. */
  settings: Pick<HeroSettingsProps, "locale" | "labels">;
  children: ReactNode;
}

/**
 * A lens over the first screen: under it the design turns into its source. It wanders until a
 * pointer takes it, and the switch opens the whole screen, which is also the way in with reduced
 * motion, where the lens stays shut and nothing moves. The HTML is whole without it. It reaches the
 * capsule above the screen too, in the capsule's own coordinates, so it belongs to the top of the
 * page alone: it shuts when the page moves, and the layer the reader chose comes back with the top.
 * When a page opens, the stylesheet assembles the screen on the plan of the same layer, and the
 * lens opens once that is over. It also shuts for the settings, which it would only peek out from.
 */
export function HeroLens({ labels, settings, children }: HeroLensProps) {
  const scope = useRef<HTMLElement>(null);
  const lens = useRef({ x: 0, y: 0, r: 0 });
  const menuOpen = useRef(false);
  const [layer, setLayer] = useState<Layer>("design");

  const resting = () => (window.innerWidth < WIDE ? RADIUS.phone : RADIUS.wide);

  /**
   * Where the lens wanders on the screen: across the name, and never down over the words under it.
   * On a phone the name stands high and the role comes close below it, so the way is held above the
   * role, the lens's own radius and a gap clear of it.
   */
  const path = () => {
    const hero = scope.current;
    const box = hero?.getBoundingClientRect();
    const foot = hero?.querySelector(".hero-foot")?.getBoundingClientRect();
    if (!box) return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    const floor = foot ? foot.top - box.top - resting() - CLEAR : box.height;
    return {
      from: { x: box.width * 0.34, y: Math.min(box.height * 0.5, floor) },
      to: { x: box.width * 0.72, y: Math.min(box.height * 0.42, floor) },
    };
  };

  const open = (shown: Layer, duration: number) => {
    const hero = scope.current;
    if (!hero) return;
    const { width, height } = hero.getBoundingClientRect();
    const moving = matchMedia(MOTION_ALLOWED).matches;
    const wide =
      shown === "code" ? Math.hypot(width, height) : moving && !menuOpen.current ? resting() : 0;
    gsap.to(lens.current, {
      r: moved() ? 0 : wide,
      duration: moving ? duration : 0,
      ease: SCENE.move,
      overwrite: "auto",
    });
  };

  useScene(() => {
    const hero = scope.current;
    if (!hero) return;
    const root = document.documentElement;
    const capsule = document.querySelector<HTMLElement>("[data-capsule]");
    const items = capsule?.querySelector("[data-capsule-items]");
    capsule?.setAttribute("data-lens", "");
    const shown = () => (hero.dataset.layer === "code" ? "code" : "design");

    // Shut, the lens shows nothing: wandering on while the page moves below the screen, it would
    // restyle the screen and the capsule every frame for nothing, and WebKit repaints both then.
    let painted = Number.NaN;
    const paint = () => {
      const { x, y, r } = lens.current;
      if (r <= 0 && painted <= 0) return;
      painted = r;
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
      if (capsule) {
        capsule.dataset.size = size(capsule);
        for (const item of capsule.querySelectorAll<HTMLElement>("[data-measure]")) {
          item.dataset.size = size(item);
        }
      }
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);
    // The open code layer reaches the screen's far corners, and a wider or taller screen has
    // corners further off: it opens again over the new one. Outside the motion query, since with
    // reduced motion the switch opens the layer the same way.
    const reopen = () => {
      if (shown() === "code" && !root.hasAttribute("data-intro")) open("code", 0);
    };
    ScrollTrigger.addEventListener("refresh", reopen);
    // The fonts may settle after the page is left: then there is nothing to measure any more.
    let stopped = false;
    void document.fonts.ready.then(() => {
      if (!stopped) measure();
    });

    const motion = gsap.matchMedia();
    motion.add(MOTION_ALLOWED, () => {
      const assembling = root.hasAttribute("data-intro");
      lens.current.x = path().from.x;
      lens.current.y = path().from.y;
      lens.current.r = assembling || moved() ? 0 : resting();

      const wander = gsap.to(lens.current, {
        x: () => path().to.x,
        y: () => path().to.y,
        duration: WANDER,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      // A turned phone is another screen: the lens starts its way again across the new one.
      const again = () => {
        if (!wander.isActive() && !wander.paused()) return;
        const paused = wander.paused();
        gsap.set(lens.current, path().from);
        wander.invalidate().restart();
        if (paused) wander.pause();
      };
      ScrollTrigger.addEventListener("refresh", again);
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
        ScrollTrigger.removeEventListener("refresh", again);
        onScreen.kill();
        window.removeEventListener("pointermove", follow);
        window.removeEventListener("pointerdown", follow);
        window.removeEventListener("scroll", stay);
      };
    });
    if (!matchMedia(MOTION_ALLOWED).matches) root.removeAttribute("data-intro");

    return () => {
      stopped = true;
      ScrollTrigger.removeEventListener("refresh", measure);
      ScrollTrigger.removeEventListener("refresh", reopen);
      window.removeEventListener("scroll", turn);
      gsap.ticker.remove(paint);
      painting.kill();
      // The capsule is the shell's and stays on every page after this one: it leaves clean.
      capsule?.removeAttribute("data-lens");
      for (const name of ["--lens-x", "--lens-y", "--lens-r"]) capsule?.style.removeProperty(name);
      if (capsule) delete capsule.dataset.size;
      for (const item of capsule?.querySelectorAll<HTMLElement>("[data-measure]") ?? []) {
        delete item.dataset.size;
      }
    };
  }, scope);

  const choose = (next: Layer) => {
    setLayer(next);
    open(next, DURATION.slow);
  };

  const onMenu = useCallback((isOpen: boolean) => {
    if (menuOpen.current === isOpen) return;
    menuOpen.current = isOpen;
    if (document.documentElement.hasAttribute("data-intro")) return;
    open(scope.current?.dataset.layer === "code" ? "code" : "design", DURATION.base);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `open` reads only refs and the page.
  }, []);

  // The sheet out of the capsule hangs over this screen too: the shell says so on the root.
  useEffect(() => {
    const root = document.documentElement;
    const watch = new MutationObserver(() => {
      onMenu(root.hasAttribute("data-writing"));
    });
    watch.observe(root, { attributes: true, attributeFilter: ["data-writing"] });
    return () => {
      watch.disconnect();
    };
  }, [onMenu]);

  return (
    <section className="hero" data-layer={layer} ref={scope}>
      {children}
      <i aria-hidden className="hero-ring" />
      <div className="hero-switch">
        <div className="hero-tools">
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
          <HeroSettings {...settings} onToggle={onMenu} />
        </div>
      </div>
    </section>
  );
}

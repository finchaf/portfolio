import { useEffect, useRef } from "react";

import { isCalm } from "@/motion/reduced";

/** How near the pointer, in shares of the frame, the lens is close enough to stop. */
const DONE = 0.0006;

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

interface Lens {
  /** Share of the frame's width the lens's radius takes. */
  radius: number;
  /** How much of the way to the pointer the lens goes in a frame. */
  follow: number;
  /** Where the lens stands before the pointer comes, in shares of the frame. */
  start: { x: number; y: number };
  /** Whether the lens stays inside the frame when the pointer is past its edge. */
  bounded: boolean;
}

/**
 * A lens that follows the pointer over a frame: in the view "lens" it cuts a circle out of the
 * upper layer, and a ring marks its edge. The lens eases after the pointer and stops near it; for a
 * reader who asks for less motion it jumps. A change of view draws it again where it stood. The
 * hook gives the three refs to put on the frame, the layer it cuts and the ring.
 */
export function useLens(view: string, { radius, follow, start, bounded }: Lens) {
  const frame = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLElement>(null);
  const spot = useRef({ x: start.x, y: start.y, tx: start.x, ty: start.y, frame: 0 });

  useEffect(() => {
    const box = frame.current;
    const layer = clip.current;
    const circle = ring.current;
    if (!box || !layer || !circle) return;
    const s = spot.current;

    const draw = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      const r = width * radius;
      const x = s.x * width;
      const y = s.y * height;
      layer.style.clipPath =
        view === "lens" ? `circle(${String(r)}px at ${String(x)}px ${String(y)}px)` : "";
      circle.style.width = `${String(r * 2)}px`;
      circle.style.height = `${String(r * 2)}px`;
      circle.style.transform = `translate(${String(x - r)}px, ${String(y - r)}px)`;
    };
    const tick = () => {
      const k = isCalm() ? 1 : follow;
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      draw();
      s.frame =
        Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > DONE ? requestAnimationFrame(tick) : 0;
    };
    const track = (event: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      s.tx = bounded ? clamp(x, 0, 1) : x;
      s.ty = bounded ? clamp(y, 0, 1) : y;
      if (!s.frame) s.frame = requestAnimationFrame(tick);
    };
    box.addEventListener("pointermove", track, { passive: true });
    box.addEventListener("pointerdown", track, { passive: true });
    const resize = new ResizeObserver(draw);
    resize.observe(box);
    draw();
    return () => {
      box.removeEventListener("pointermove", track);
      box.removeEventListener("pointerdown", track);
      resize.disconnect();
      cancelAnimationFrame(s.frame);
      s.frame = 0;
    };
  }, [view, radius, follow, bounded]);

  return { frame, clip, ring };
}

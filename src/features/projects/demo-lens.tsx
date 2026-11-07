"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { isCalm } from "@/motion/reduced";

type View = "lens" | "design" | "code";

/** Share of the frame's width the lens covers. */
const RADIUS = 0.17;
/** How much of the way to the pointer the lens goes in a frame. */
const FOLLOW = 0.18;
const DONE = 0.0006;

/** The two real layers of the first screen, one over the other, and a lens between them. */
export function DemoLens({
  design,
  code,
  strings,
}: {
  design: ReactNode;
  code: ReactNode;
  strings: { hint: string; design: string; code: string; lens: string; label: string };
}) {
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("lens");
  const target = useRef({ x: 0.5, y: 0.5 });
  const place = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef(0);

  useEffect(() => {
    const box = frame.current;
    const code = layer.current;
    const circle = ring.current;
    if (!box || !code || !circle) return;

    const draw = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      const radius = width * RADIUS;
      const x = place.current.x * width;
      const y = place.current.y * height;
      code.style.clipPath =
        view === "lens" ? `circle(${String(radius)}px at ${String(x)}px ${String(y)}px)` : "";
      circle.style.width = `${String(radius * 2)}px`;
      circle.style.height = `${String(radius * 2)}px`;
      circle.style.transform = `translate(${String(x - radius)}px, ${String(y - radius)}px)`;
    };
    const tick = () => {
      const k = isCalm() ? 1 : FOLLOW;
      place.current.x += (target.current.x - place.current.x) * k;
      place.current.y += (target.current.y - place.current.y) * k;
      draw();
      const left =
        Math.abs(target.current.x - place.current.x) + Math.abs(target.current.y - place.current.y);
      raf.current = left > DONE ? requestAnimationFrame(tick) : 0;
    };
    const follow = (event: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      target.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    box.addEventListener("pointermove", follow, { passive: true });
    box.addEventListener("pointerdown", follow, { passive: true });
    const resize = new ResizeObserver(draw);
    resize.observe(box);
    draw();
    return () => {
      box.removeEventListener("pointermove", follow);
      box.removeEventListener("pointerdown", follow);
      resize.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [view]);

  return (
    <div className="pj-lens-demo" data-view={view}>
      <div aria-label={strings.label} className="pj-seg" role="group">
        {(["lens", "design", "code"] as const).map((key) => (
          <button
            aria-pressed={key === view}
            key={key}
            onClick={() => {
              setView(key);
            }}
            type="button"
          >
            {strings[key]}
          </button>
        ))}
      </div>
      <div className="pj-lens-frame" ref={frame}>
        <div className="pj-lens-layer">{design}</div>
        <div className="pj-lens-layer pj-lens-code" ref={layer}>
          {code}
        </div>
        <i aria-hidden className="pj-lens-ring" ref={ring} />
      </div>
      <p className="pj-demo-note">{strings.hint}</p>
    </div>
  );
}

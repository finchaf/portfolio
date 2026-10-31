"use client";

import "./dot-cursor.css";

import { useEffect, useRef } from "react";

/** A screen with a real pointer: a finger has no cursor to replace. */
const POINTER = "(hover: hover) and (pointer: fine)";
const ACTIVE = "a, button, label, summary";

/** Follows the pointer exactly: any delay would read as a slow site. */
export function DotCursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dot.current;
    if (!node || !matchMedia(POINTER).matches) return;
    const root = document.documentElement;

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        root.removeAttribute("data-pointer");
        return;
      }
      root.setAttribute("data-pointer", "");
      node.style.transform = `translate(${String(event.clientX)}px, ${String(event.clientY)}px)`;
    };
    const over = ({ target }: PointerEvent) => {
      node.toggleAttribute("data-over", target instanceof Element && !!target.closest(ACTIVE));
    };
    const press = () => {
      node.setAttribute("data-pressed", "");
    };
    const release = () => {
      node.removeAttribute("data-pressed");
    };
    const leave = () => {
      root.removeAttribute("data-pointer");
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    root.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      root.removeEventListener("pointerleave", leave);
      root.removeAttribute("data-pointer");
    };
  }, []);

  return (
    <div aria-hidden className="dot-cursor" ref={dot}>
      <i />
    </div>
  );
}

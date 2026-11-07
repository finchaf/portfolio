"use client";

import "./dot-cursor.css";

import { useEffect, useRef } from "react";

import { TOP_LAYER_EVENT } from "@/ui/top-layer";

/** A screen with a real pointer: a finger has no cursor to replace. */
const POINTER = "(hover: hover) and (pointer: fine)";
const ACTIVE = "a, button, label, summary";

/**
 * Follows the pointer exactly: any delay would read as a slow site. It lives in the browser's top
 * layer as a manual popover, so a modal window does not cover it; when a page opens one, the cursor
 * is shown again, which lays it on top of the window.
 */
export function DotCursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dot.current;
    if (!node || !matchMedia(POINTER).matches) return;
    const root = document.documentElement;
    const raise = () => {
      if (!("showPopover" in node)) return;
      if (node.matches(":popover-open")) node.hidePopover();
      node.showPopover();
    };
    raise();

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
    // A drag the page refused (StillImages) leaves the press as it was.
    const drag = (event: DragEvent) => {
      if (!event.defaultPrevented) release();
    };
    const leave = () => {
      root.removeAttribute("data-pointer");
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    // A press that never comes up: a native drag cancels the pointer, or the window loses focus.
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("dragstart", drag, { passive: true });
    window.addEventListener("blur", release);
    root.addEventListener("pointerleave", leave);
    document.addEventListener(TOP_LAYER_EVENT, raise);
    return () => {
      document.removeEventListener(TOP_LAYER_EVENT, raise);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("dragstart", drag);
      window.removeEventListener("blur", release);
      root.removeEventListener("pointerleave", leave);
      root.removeAttribute("data-pointer");
    };
  }, []);

  return (
    <div aria-hidden className="dot-cursor" popover="manual" ref={dot}>
      <i />
    </div>
  );
}

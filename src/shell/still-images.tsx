"use client";

import { useEffect } from "react";

const PICTURES = "img, svg";

/** A picture, or a link that is nothing but one: dragging it would carry off a ghost of it. */
function isPicture(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return !!target.closest(PICTURES) || (target.matches("a") && !target.textContent.trim());
}

/** Gecko has no CSS for this, so pictures stay where they lie by refusing the drag itself. */
export function StillImages() {
  useEffect(() => {
    const refuse = (event: DragEvent) => {
      if (isPicture(event.target)) event.preventDefault();
    };
    document.addEventListener("dragstart", refuse);
    return () => {
      document.removeEventListener("dragstart", refuse);
    };
  }, []);
  return null;
}

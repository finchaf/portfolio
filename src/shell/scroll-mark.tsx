"use client";

import { useEffect } from "react";

import { PAGE_MOVED } from "@/motion/tokens";

/** Marks a page that has left its top, for the capsule to close in. */
export function ScrollMark() {
  useEffect(() => {
    const mark = () => {
      document.documentElement.toggleAttribute("data-scrolled", window.scrollY > PAGE_MOVED);
    };
    mark();
    window.addEventListener("scroll", mark, { passive: true });
    return () => {
      window.removeEventListener("scroll", mark);
    };
  }, []);
  return null;
}

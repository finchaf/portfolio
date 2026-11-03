"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const QUERY = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void): () => void {
  const media = matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
  };
}

/**
 * Whether a small living demo should run now: it is on the screen, and motion is welcome. Inside a
 * chapter's stop it also waits for its stop: a held stage keeps every stop on the screen, and a
 * demo that plays behind the current one only spends a phone's frames.
 */
export function usePlaying(target: RefObject<Element | null>): boolean {
  const allowed = useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(true);
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry?.isIntersecting ?? false);
    });
    observer.observe(node);
    const stop = node.closest("[data-stop]");
    const read = () => {
      // A stop is marked only while a scene runs; without one every stop is plainly on the page.
      const marked = stop?.parentElement?.querySelector(":scope > [data-active]");
      setCurrent(!stop || !marked || stop.hasAttribute("data-active"));
    };
    const watch = new MutationObserver(read);
    if (stop?.parentElement) {
      watch.observe(stop.parentElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ["data-active"],
      });
    }
    read();
    return () => {
      observer.disconnect();
      watch.disconnect();
    };
  }, [target]);
  return allowed && visible && current;
}

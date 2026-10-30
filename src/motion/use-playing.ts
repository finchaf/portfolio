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

/** Whether a small living demo should run now: it is on the screen, and motion is welcome. */
export function usePlaying(target: RefObject<Element | null>): boolean {
  const allowed = useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!target.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry?.isIntersecting ?? false);
    });
    observer.observe(target.current);
    return () => {
      observer.disconnect();
    };
  }, [target]);
  return allowed && visible;
}

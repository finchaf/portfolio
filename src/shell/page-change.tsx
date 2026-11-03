"use client";

import "./page-change.css";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, ViewTransition } from "react";

import { PAGE_PATHS, type PagePath } from "@/lib/pages";
import { DURATION } from "@/motion/tokens";

/** How long, in milliseconds, a quiet change holds off the slash: past the browser's swap. */
const QUIET_FOR = 200;

/**
 * A page's place in the order of the capsule: the address comes with its language in front. A page
 * inside a page stands just after it, so going in is a step forward.
 */
function placeOf(pathname: string) {
  const path = pathname.replace(/^\/[^/]+/, "");
  const place = PAGE_PATHS.indexOf(path as PagePath);
  if (place >= 0) return place;
  return PAGE_PATHS.indexOf(path.replace(/\/[^/]+$/, "") as PagePath) + 0.5;
}

/**
 * What a change of page is hung on. React starts a view transition only when a `<ViewTransition>`
 * is touched, and this one is by every new address; its layer is the strip that leads the edge, and
 * `page-change.css` draws the rest. A layout effect runs inside the transition's update, before the
 * browser builds the pseudo-elements, so the direction is in place by the time they read it.
 */
export function PageChange() {
  const pathname = usePathname();
  const last = useRef(pathname);
  const settle = useRef(0);

  // React drops the picture of the whole page unless the name is already set on the element.
  useLayoutEffect(() => {
    document.documentElement.style.viewTransitionName = "root";
  }, []);

  useLayoutEffect(() => {
    const back = placeOf(pathname) < placeOf(last.current);
    const moved = pathname !== last.current;
    last.current = pathname;
    const root = document.documentElement;
    root.toggleAttribute("data-page-back", back);
    // The new page opens at its top, and this runs before the browser pictures it: the capsule goes
    // straight to where that page will have it, and plays nothing after the change.
    if (moved) {
      window.clearTimeout(settle.current);
      root.setAttribute("data-page-change", "");
      if (!window.location.hash) root.removeAttribute("data-scrolled");
      settle.current = window.setTimeout(() => {
        root.removeAttribute("data-page-change");
      }, DURATION.page * 1000);
    }
    // A page that moved its own camera asked for no second movement on top: `data-page-quiet`.
    if (root.hasAttribute("data-page-quiet")) {
      window.setTimeout(() => {
        root.removeAttribute("data-page-quiet");
      }, QUIET_FOR);
    }
  }, [pathname]);

  return (
    <ViewTransition key={pathname} name="page-lead">
      <i aria-hidden className="page-lead" />
    </ViewTransition>
  );
}

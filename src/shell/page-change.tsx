"use client";

import "./page-change.css";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, ViewTransition } from "react";

import { pagePathOf } from "@/i18n/localized-path";
import { PAGE_PATHS } from "@/lib/pages";
import { markPageShown } from "@/motion/scene";
import { DURATION } from "@/motion/tokens";

/** How long, in milliseconds, a quiet change holds off the slash: past the browser's swap. */
const QUIET_FOR = 200;

/** A path's place among the pages of the capsule, or -1 for one that is not there. */
function indexOfPage(path: string) {
  return PAGE_PATHS.findIndex((page) => page === path);
}

/**
 * A page's place in the order of the capsule: the address comes with its language in front. A page
 * inside a page stands just after it, so going in is a step forward.
 */
function placeOf(pathname: string) {
  const path = pagePathOf(pathname);
  const place = indexOfPage(path);
  if (place >= 0) return place;
  return indexOfPage(path.replace(/\/[^/]+$/, "")) + 0.5;
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
  const quiet = useRef(0);
  const quietMark = useRef(0);

  // React drops the picture of the whole page unless the name is already set on the element.
  // It also runs after the first page's scenes have started: any scene after it came by a change.
  useLayoutEffect(() => {
    document.documentElement.style.viewTransitionName = "root";
    markPageShown();
  }, []);

  // Nothing of this outlives the shell: its timers stop, and the marks they would take off go now.
  useEffect(
    () => () => {
      window.clearTimeout(settle.current);
      window.clearTimeout(quiet.current);
      document.documentElement.removeAttribute("data-page-change");
      document.documentElement.removeAttribute("data-page-quiet");
    },
    [],
  );

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
    // A page that moved its own camera asked for no second movement on top: `data-page-quiet`. The
    // change takes the request by writing its own mark into it, and takes it off only while that
    // mark is still there: a camera that asks again before then writes over it, and keeps its own.
    const asked = root.getAttribute("data-page-quiet");
    if (asked !== null && asked !== String(quietMark.current)) {
      window.clearTimeout(quiet.current);
      const mark = String(++quietMark.current);
      root.setAttribute("data-page-quiet", mark);
      quiet.current = window.setTimeout(() => {
        if (root.getAttribute("data-page-quiet") === mark) root.removeAttribute("data-page-quiet");
      }, QUIET_FOR);
    }
  }, [pathname]);

  return (
    <ViewTransition key={pathname} name="page-lead">
      <i aria-hidden className="page-lead" />
    </ViewTransition>
  );
}

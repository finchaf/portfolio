"use client";

import "./page-change.css";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, ViewTransition } from "react";

import { PAGE_PATHS, type PagePath } from "@/lib/pages";

/** A page's place in the order of the capsule: the address comes with its language in front. */
const placeOf = (pathname: string) =>
  PAGE_PATHS.indexOf(pathname.replace(/^\/[^/]+/, "") as PagePath);

/**
 * What a change of page is hung on. React starts a view transition only when a `<ViewTransition>`
 * is touched, and this one is by every new address; its layer is the strip that leads the edge, and
 * `page-change.css` draws the rest. A layout effect runs inside the transition's update, before the
 * browser builds the pseudo-elements, so the direction is in place by the time they read it.
 */
export function PageChange() {
  const pathname = usePathname();
  const last = useRef(pathname);

  // React drops the picture of the whole page unless the name is already set on the element.
  useLayoutEffect(() => {
    document.documentElement.style.viewTransitionName = "root";
  }, []);

  useLayoutEffect(() => {
    const back = placeOf(pathname) < placeOf(last.current);
    last.current = pathname;
    document.documentElement.toggleAttribute("data-page-back", back);
  }, [pathname]);

  return (
    <ViewTransition key={pathname} name="page-lead">
      <i aria-hidden className="page-lead" />
    </ViewTransition>
  );
}

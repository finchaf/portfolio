"use client";

import "./scroll-bar.css";

import { useEffect, useRef } from "react";

/** How long the bar stays after the pointer leaves or the scrolling stops, as Radix's. */
const HIDE_MS = 600;
/** The shortest thumb, for a page many screens long. */
const SHORTEST = 18;

/**
 * A drawn scrollbar in place of the browser's: the scrolling stays the browser's, only the bar is
 * ours, as the product's ScrollArea has it. It takes no room, so a page whose scrolling is held
 * while a window is open does not move by the width of a bar, and it is the same on every system.
 * `page` draws the document's; without it, the bar draws the scrolling of the element just before
 * it, in a parent that places it. It shows while the pointer is over what it scrolls, while that
 * scrolls and while it is dragged, and is not there when nothing overflows. The thumb can be
 * dragged, and a press on the track goes there. Hidden from assistive technology: the keys and the
 * wheel scroll as they always do. `axis="x"` draws a bar along the bottom for a scroller that
 * runs sideways, as a block of code does.
 */
export function ScrollBar({ page = false, axis = "y" }: { page?: boolean; axis?: "x" | "y" }) {
  const track = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bar = track.current;
    const thumb = bar?.firstElementChild;
    if (!bar || !(thumb instanceof HTMLElement)) return;
    const root = document.documentElement;
    const scroller = page ? root : bar.previousElementSibling;
    if (!(scroller instanceof HTMLElement)) return;
    const area = page ? root : (bar.parentElement ?? scroller);
    const source: HTMLElement | Window = page ? window : scroller;
    let hiding = 0;
    let frame = 0;
    let over = false;
    let drag: { at: number; top: number; ratio: number } | null = null;
    const x = !page && axis === "x";

    const view = () =>
      page ? window.innerHeight : x ? scroller.clientWidth : scroller.clientHeight;
    const full = () => (x ? scroller.scrollWidth : scroller.scrollHeight);
    const length = () => Math.max(0, full() - view());
    const top = () => (page ? window.scrollY : x ? scroller.scrollLeft : scroller.scrollTop);
    const to = (place: number, smooth = false) => {
      const behavior: ScrollBehavior = smooth ? "smooth" : "instant";
      const options: ScrollToOptions = x ? { left: place, behavior } : { top: place, behavior };
      if (page) window.scrollTo(options);
      else scroller.scrollTo(options);
    };

    /** The thumb's length and place, from the share of the content seen and how far it went. */
    const measure = () => {
      const run = x ? bar.clientWidth : bar.clientHeight;
      const rest = length();
      bar.toggleAttribute("data-empty", rest < 1 || run === 0);
      if (rest < 1 || run === 0) return { run, size: run, rest };
      const size = Math.max(SHORTEST, Math.round((run * view()) / full()));
      const place = String(((run - size) * Math.min(top(), rest)) / rest);
      if (x) {
        thumb.style.width = `${String(size)}px`;
        thumb.style.translate = `${place}px 0`;
      } else {
        thumb.style.height = `${String(size)}px`;
        thumb.style.translate = `0 ${place}px`;
      }
      return { run, size, rest };
    };

    const settle = () => {
      window.clearTimeout(hiding);
      if (over || drag) return;
      hiding = window.setTimeout(() => {
        bar.removeAttribute("data-shown");
      }, HIDE_MS);
    };
    const show = () => {
      bar.setAttribute("data-shown", "");
      settle();
    };

    const onScroll = () => {
      measure();
      show();
    };
    const onEnter = () => {
      if (over) return;
      over = true;
      measure();
      show();
    };
    const onLeave = () => {
      over = false;
      settle();
    };
    // A mouse leaving the window leaves the document, which has no `pointerleave` of its own.
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onLeave();
    };
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        measure();
      });
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const { run, size, rest } = measure();
      if (rest < 1) return;
      const ratio = rest / Math.max(1, run - size);
      if (event.target === thumb) {
        drag = { at: x ? event.clientX : event.clientY, top: top(), ratio };
        bar.setPointerCapture(event.pointerId);
        bar.setAttribute("data-dragged", "");
        return;
      }
      // A press on the track brings the thumb's middle there.
      const box = bar.getBoundingClientRect();
      const from = x ? event.clientX - box.left : event.clientY - box.top;
      to((from - size / 2) * ratio, true);
    };
    const onMove = (event: PointerEvent) => {
      if (!drag) return;
      to(drag.top + ((x ? event.clientX : event.clientY) - drag.at) * drag.ratio);
    };
    const onUp = (event: PointerEvent) => {
      if (!drag) return;
      drag = null;
      if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
      bar.removeAttribute("data-dragged");
      over = page || area.matches(":hover");
      settle();
    };

    const sizes = new ResizeObserver(onResize);
    sizes.observe(page ? document.body : scroller);
    if (!page && scroller.firstElementChild) sizes.observe(scroller.firstElementChild);
    measure();

    source.addEventListener("scroll", onScroll, { passive: true });
    if (page) {
      root.addEventListener("pointerover", onEnter, { passive: true });
      root.addEventListener("pointerout", onOut, { passive: true });
    } else {
      area.addEventListener("pointerenter", onEnter, { passive: true });
      area.addEventListener("pointerleave", onLeave, { passive: true });
    }
    window.addEventListener("resize", onResize, { passive: true });
    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove, { passive: true });
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
    return () => {
      sizes.disconnect();
      source.removeEventListener("scroll", onScroll);
      if (page) {
        root.removeEventListener("pointerover", onEnter);
        root.removeEventListener("pointerout", onOut);
      } else {
        area.removeEventListener("pointerenter", onEnter);
        area.removeEventListener("pointerleave", onLeave);
      }
      window.removeEventListener("resize", onResize);
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
      window.clearTimeout(hiding);
      cancelAnimationFrame(frame);
    };
  }, [page, axis]);

  return (
    <span
      aria-hidden
      className="scroll-bar"
      data-axis={axis === "x" ? "x" : undefined}
      data-page={page ? "" : undefined}
      ref={track}
    >
      <i />
    </span>
  );
}

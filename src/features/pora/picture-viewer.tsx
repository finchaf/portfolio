"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { announceTopLayer } from "@/ui/top-layer";

/** The picture grows from its place in the chapter to the screen, and goes back there. */
const GROW_MS = 240;
const GROW_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const SHRINK_MS = 180;

/** The picture is named once it is chosen: its thumbnail's words. */
const UNNAMED = "";

interface Words {
  label: string;
  close: string;
  previous: string;
  next: string;
  /** "{n} из {count}" */
  count: string;
}

/**
 * Looks at the pictures of a chapter at the size of the screen. A picture in a lesson's window is a
 * button (`data-pora-picture`); pressed, it grows from its place into a second modal <dialog> over
 * the window, at the most the screen holds, with its caption. ← and → or the buttons go through the
 * chapter's pictures, Esc, a press beside the picture or the cross go back, and the picture shrinks
 * into its place with the focus. The picture shown is the one the reader's mode already loaded.
 */
export function PictureViewer({ words }: { words: Words }) {
  const mark = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const viewer = mark.current;
    const root = viewer?.closest<HTMLElement>("[data-pora-week]");
    const image = viewer?.querySelector<HTMLImageElement>(".pora-viewer-image");
    const caption = viewer?.querySelector<HTMLElement>(".pora-viewer-caption");
    const counter = viewer?.querySelector<HTMLElement>(".pora-viewer-count");
    if (!viewer || !root || !image || !caption || !counter) return;
    const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let list: HTMLElement[] = [];
    let index = 0;
    let motion: Animation | null = null;
    let leaving = false;

    /** The thumbnail's image as the reader sees it: of the two modes, the one with a box. */
    const shown = (button: HTMLElement) =>
      [...button.querySelectorAll("img")].find((each) => each.getClientRects().length > 0) ?? null;

    const fill = () => {
      const button = list[index];
      const source = button ? shown(button) : null;
      if (!button || !source) return;
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      image.width = source.naturalWidth || source.width;
      image.height = source.naturalHeight || source.height;
      image.dataset.shape = button.dataset.shape ?? "";
      caption.textContent = button.dataset.caption ?? "";
      counter.textContent = words.count
        .replace("{n}", String(index + 1))
        .replace("{count}", String(list.length));
      viewer.toggleAttribute("data-alone", list.length < 2);
    };

    /** From the thumbnail's box to the picture's: a scale and a move, on the compositor. */
    const flight = (from: DOMRect, to: DOMRect) => [
      {
        transform: `translate(${String(from.left - to.left)}px, ${String(from.top - to.top)}px) scale(${String(from.width / to.width)}, ${String(from.height / to.height)})`,
      },
      { transform: "none" },
    ];

    const open = (button: HTMLElement) => {
      const page = button.closest(".pora-window-page");
      list = page ? [...page.querySelectorAll<HTMLElement>("[data-pora-picture]")] : [button];
      index = Math.max(0, list.indexOf(button));
      fill();
      leaving = false;
      viewer.showModal();
      announceTopLayer();
      viewer.querySelector<HTMLElement>(".pora-viewer-stage")?.focus({ preventScroll: true });
      motion?.cancel();
      const from = shown(button)?.getBoundingClientRect();
      const to = image.getBoundingClientRect();
      if (calm() || !from || to.width === 0) return;
      viewer.setAttribute("data-growing", "");
      motion = image.animate(flight(from, to), { duration: GROW_MS, easing: GROW_EASE });
      void motion.finished.then(
        () => {
          viewer.removeAttribute("data-growing");
        },
        () => {
          viewer.removeAttribute("data-growing");
        },
      );
    };

    const finish = () => {
      motion?.cancel();
      motion = null;
      viewer.removeAttribute("data-leaving");
      viewer.removeAttribute("data-growing");
      if (viewer.open) viewer.close();
      list[index]?.focus({ preventScroll: true });
      leaving = false;
    };

    const close = () => {
      if (!viewer.open || leaving) return;
      leaving = true;
      const button = list[index];
      const thumb = button ? shown(button)?.getBoundingClientRect() : undefined;
      const to = image.getBoundingClientRect();
      if (calm() || !thumb || thumb.width === 0 || to.width === 0) {
        finish();
        return;
      }
      // The window under the viewer may have scrolled the thumbnail away: then it only fades.
      const seen = thumb.bottom > 0 && thumb.top < window.innerHeight;
      viewer.setAttribute("data-leaving", "");
      motion?.cancel();
      motion = seen
        ? image.animate([...flight(thumb, to)].reverse(), {
            duration: SHRINK_MS,
            easing: GROW_EASE,
            fill: "forwards",
          })
        : image.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: SHRINK_MS,
            fill: "forwards",
          });
      void motion.finished.then(finish, finish);
    };

    const go = (step: number) => {
      if (list.length < 2 || leaving) return;
      index = (index + step + list.length) % list.length;
      motion?.cancel();
      fill();
      if (calm()) return;
      motion = image.animate(
        [
          { opacity: 0, translate: `${String(step * 1.5)}rem 0` },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: GROW_MS, easing: GROW_EASE },
      );
    };

    const onRootClick = (event: MouseEvent) => {
      const button = (event.target as Element).closest<HTMLElement>("[data-pora-picture]");
      if (!button || !root.contains(button)) return;
      event.preventDefault();
      open(button);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const way = target.closest<HTMLElement>("[data-pora-viewer-go]");
      if (way) {
        go(way.dataset.poraViewerGo === "previous" ? -1 : 1);
        return;
      }
      // The cross, the veil, the room round the picture: everything but the picture and its words.
      if (target.closest("[data-pora-viewer-close]") || !target.closest(".pora-viewer-keep")) {
        close();
      }
    };

    const onCancel = (event: Event) => {
      event.preventDefault();
      close();
    };

    const onKey = (event: KeyboardEvent) => {
      if (!viewer.open) return;
      if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      // The window under it turns its lessons on the same keys: here they turn the pictures.
      event.preventDefault();
      event.stopImmediatePropagation();
      go(event.key === "ArrowLeft" ? -1 : 1);
    };

    root.addEventListener("click", onRootClick);
    viewer.addEventListener("click", onClick);
    viewer.addEventListener("cancel", onCancel);
    viewer.addEventListener("close", finish);
    document.addEventListener("keydown", onKey, true);
    return () => {
      root.removeEventListener("click", onRootClick);
      viewer.removeEventListener("click", onClick);
      viewer.removeEventListener("cancel", onCancel);
      viewer.removeEventListener("close", finish);
      document.removeEventListener("keydown", onKey, true);
      motion?.cancel();
    };
  }, [words]);

  return (
    <dialog aria-label={words.label} className="pora-viewer" ref={mark}>
      <div className="pora-viewer-stage" tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element -- it shows the file a thumbnail already loaded. */}
        <img
          alt={UNNAMED}
          className="pora-viewer-image pora-viewer-keep"
          decoding="async"
          src={undefined}
        />
      </div>
      <div className="pora-viewer-bar">
        <p className="pora-viewer-words pora-viewer-keep">
          <span aria-live="polite" className="pora-viewer-count" />
          <span className="pora-viewer-caption" />
        </p>
        <div className="pora-viewer-tools pora-viewer-keep">
          <button
            aria-label={words.previous}
            className="pora-viewer-button"
            data-pora-viewer-go="previous"
            type="button"
          >
            <ArrowLeft aria-hidden />
          </button>
          <button
            aria-label={words.next}
            className="pora-viewer-button"
            data-pora-viewer-go="next"
            type="button"
          >
            <ArrowRight aria-hidden />
          </button>
          <button
            aria-label={words.close}
            className="pora-viewer-button"
            data-pora-viewer-close=""
            type="button"
          >
            <X aria-hidden />
          </button>
        </div>
      </div>
    </dialog>
  );
}

"use client";

import { useEffect, useRef } from "react";

import { announceTopLayer } from "@/ui/top-layer";

import { WINDOW_ID } from "./week";

/** The product's window comes and goes in 100 ms; a little more lets the last frame land. */
const LEAVE_MS = 160;
/** A page turns in this long: the new one comes over the old one, the chapters slide a little. */
const TURN_MS = 220;
const TURN_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * Opens the lessons' window on a card's page and closes it the product's way: Esc, a press beside
 * it, or the close button on a phone. Its footer, or ← and →, turns to the lesson before or after:
 * only the page changes, the new one coming over the old one, so the frame, the veil and the focus
 * inside the window stay. The browser keeps the focus inside a modal <dialog>; on closing it goes
 * back to the card of the lesson last read, and the page under it stays where it was.
 */
export function WindowLauncher() {
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = mark.current?.closest<HTMLElement>("[data-pora-week]");
    const dialog = root?.querySelector<HTMLDialogElement>(`#${WINDOW_ID}`);
    if (!root || !dialog) return;
    const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let opener: HTMLElement | null = null;
    let leaving = 0;
    /** Ends the turn going on at once, if one is. */
    let turning: (() => void) | null = null;

    const pages = () => [...dialog.querySelectorAll<HTMLElement>(".pora-window-page")];
    const pageOf = (lesson: string) =>
      dialog.querySelector<HTMLElement>(`.pora-window-page[data-lesson="${lesson}"]`);
    const current = () =>
      dialog.querySelector<HTMLElement>(".pora-window-page:not([hidden], [data-leaving])");
    const scrollOf = (page: HTMLElement) => page.querySelector<HTMLElement>(".pora-window-scroll");
    /**
     * The chapter takes the keys when the window opens or turns, so the arrows and Space scroll it
     * at once; that focus is ours, not the reader's, and draws no ring. A Tab back to it does.
     */
    const hand = (scroll: HTMLElement | null) => {
      if (!scroll) return;
      scroll.setAttribute("data-handed", "");
      scroll.addEventListener(
        "blur",
        () => {
          scroll.removeAttribute("data-handed");
        },
        { once: true },
      );
      scroll.focus({ preventScroll: true });
    };
    /** The lesson's card where it is seen: the grid on a wide screen, the list on a phone. */
    const cardOf = (lesson: string) =>
      [...root.querySelectorAll<HTMLElement>(`[data-pora-opens][data-lesson="${lesson}"]`)].find(
        (card) => card.offsetParent !== null,
      ) ?? null;

    const follow = (card: HTMLElement | null) => {
      opener?.setAttribute("aria-expanded", "false");
      opener = card;
      card?.setAttribute("aria-expanded", "true");
    };

    /** Shows one page, read from its top, and names the window after it. */
    const present = (page: HTMLElement) => {
      for (const other of pages()) {
        if (other !== page && !other.hasAttribute("data-leaving")) other.hidden = true;
      }
      page.hidden = false;
      dialog.setAttribute("aria-labelledby", `${page.id}-title`);
      dialog.setAttribute("aria-describedby", `${page.id}-when`);
      scrollOf(page)?.scrollTo({ top: 0, behavior: "instant" });
    };

    const open = (lesson: string, card: HTMLElement) => {
      const page = pageOf(lesson);
      if (!page || dialog.open) return;
      window.clearTimeout(leaving);
      present(page);
      follow(card);
      document.documentElement.style.overflow = "hidden";
      dialog.showModal();
      announceTopLayer();
      // The browser gives the focus to the first link inside, scrolled to: the chapter starts again.
      const body = scrollOf(page);
      hand(body);
      body?.scrollTo({ top: 0, behavior: "instant" });
    };

    const finish = () => {
      window.clearTimeout(leaving);
      dialog.removeAttribute("data-closing");
      if (dialog.open) dialog.close();
    };

    // However the window went — by us or by the browser, on a second Esc — the page comes back.
    const onClose = (event: Event) => {
      if (event.target !== dialog) return;
      // A close of our own may still be counting down: it must not shut the window opened next.
      window.clearTimeout(leaving);
      turning?.();
      dialog.removeAttribute("data-closing");
      document.documentElement.style.removeProperty("overflow");
      opener?.setAttribute("aria-expanded", "false");
      opener?.focus({ preventScroll: true });
      opener = null;
    };

    const close = () => {
      if (!dialog.open || dialog.hasAttribute("data-closing")) return;
      turning?.();
      if (calm()) {
        finish();
        return;
      }
      dialog.setAttribute("data-closing", "");
      leaving = window.setTimeout(finish, LEAVE_MS);
    };

    /**
     * The lesson before or after: the new page comes over the old one, its chapter sliding in from
     * the side it lies on, the old chapter giving way under it. A key that pressed a footer's
     * button finds the same button on the new page, so the next press goes on.
     */
    const turn = (lesson: string, way: string, byKey: boolean) => {
      if (!dialog.open || dialog.hasAttribute("data-closing")) return;
      turning?.();
      const from = current();
      const to = pageOf(lesson);
      if (!from || !to || from === to) return;
      from.setAttribute("data-leaving", "");
      present(to);
      follow(cardOf(lesson));
      const step = byKey
        ? to.querySelector<HTMLElement>(`[data-pora-go][data-way="${way}"]`)
        : null;
      if (step) step.focus({ preventScroll: true });
      else hand(scrollOf(to));

      const motions: Animation[] = [];
      const end = () => {
        if (turning !== end) return;
        turning = null;
        for (const motion of motions) motion.cancel();
        from.hidden = true;
        from.removeAttribute("data-leaving");
      };
      turning = end;
      if (calm()) {
        end();
        return;
      }
      const side = way === "previous" ? -1 : 1;
      const timing = { duration: TURN_MS, easing: TURN_EASE };
      const columns = (page: HTMLElement) => page.querySelector(".pora-window-columns");
      motions.push(to.animate([{ opacity: 0 }, { opacity: 1 }], timing));
      const coming = columns(to);
      if (coming) {
        motions.push(
          coming.animate([{ translate: `${String(side)}rem 0` }, { translate: "0 0" }], timing),
        );
      }
      const going = columns(from);
      if (going) {
        motions.push(
          going.animate([{ translate: "0 0" }, { translate: `${String(-side / 2)}rem 0` }], {
            ...timing,
            fill: "forwards",
          }),
        );
      }
      void Promise.all(motions.map((motion) => motion.finished)).then(end, () => undefined);
    };

    /** A press on the veil lands on the dialog itself, outside its box. */
    const onVeil = (event: MouseEvent) => {
      if (event.target !== dialog) return false;
      const box = dialog.getBoundingClientRect();
      return (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      );
    };
    /**
     * Whether the last press began on the veil. A selection dragged out of the chapter and let go
     * over the veil also clicks the dialog outside its box, and must leave the window open.
     */
    let pressedVeil = false;
    const onPress = (event: PointerEvent) => {
      pressedVeil = onVeil(event);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const card = target.closest<HTMLElement>("[data-pora-opens]");
      if (card && root.contains(card)) {
        open(card.dataset.lesson ?? "", card);
        return;
      }
      if (!dialog.contains(target)) return;
      const pressed = pressedVeil;
      pressedVeil = false;
      const step = target.closest<HTMLElement>("[data-pora-go]");
      if (step) {
        // A click from a key has no pointer behind it: `detail` is 0.
        turn(step.dataset.poraGo ?? "", step.dataset.way ?? "next", event.detail === 0);
        return;
      }
      if (target.closest("[data-pora-close]")) {
        close();
        return;
      }
      // Only a press that both began and ended on the veil shuts the window.
      if (pressed && onVeil(event)) close();
    };

    const onCancel = (event: Event) => {
      if (event.target !== dialog) return;
      event.preventDefault();
      close();
    };

    // ← and → walk the lessons, as the footer says, unless a key is busy with a control.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const page = dialog.open ? current() : null;
      if (!page) return;
      const way = event.key === "ArrowLeft" ? "previous" : "next";
      const step = page.querySelector<HTMLElement>(`[data-pora-go][data-way="${way}"]`);
      if (!step) return;
      event.preventDefault();
      turn(step.dataset.poraGo ?? "", way, false);
    };

    root.addEventListener("click", onClick);
    dialog.addEventListener("pointerdown", onPress);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);
    document.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      dialog.removeEventListener("pointerdown", onPress);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(leaving);
      turning?.();
      document.documentElement.style.removeProperty("overflow");
    };
  }, []);

  return <span hidden ref={mark} />;
}

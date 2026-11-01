"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Every link that opens the sheet, wherever it stands on the page. */
const TRIGGER = "[data-write]";

export interface WriteSheetProps {
  label: string;
  children: ReactNode;
}

/**
 * The ways to write, out of the capsule. Part of the capsule rather than a modal: the page stays and
 * goes on working under it, it wears the theme the capsule wears, and the dot cursor stays over it.
 * Every trigger is a plain link to the chat, so without a script, or with a modifier key, nothing
 * here happens and the link does what it says. `data-writing` tells the first screen's lens.
 */
export function WriteSheet({ label, children }: WriteSheetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => {
    document.querySelectorAll(TRIGGER).forEach((link) => {
      link.setAttribute("aria-haspopup", "dialog");
      link.setAttribute("aria-controls", id);
      link.setAttribute("aria-expanded", String(open));
    });
    document.documentElement.toggleAttribute("data-writing", open);
  }, [id, open, pathname]);

  useEffect(() => {
    const press = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLElement>(TRIGGER);
      const plain = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      if (!link || !plain || event.button !== 0) return;
      event.preventDefault();
      opener.current = link;
      setOpen((now) => !now);
    };
    document.addEventListener("click", press);
    return () => {
      document.removeEventListener("click", press);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    sheet.current?.focus({ preventScroll: true });
    // A pointer or a key that goes anywhere else. A trigger toggles the sheet by itself.
    const away = (event: Event) => {
      const target = event.target as Element;
      if (!sheet.current?.contains(target) && !target.closest(TRIGGER)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      opener.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div
      aria-label={label}
      className="write-sheet"
      hidden={!open}
      id={id}
      ref={sheet}
      role="dialog"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

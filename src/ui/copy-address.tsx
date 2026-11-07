"use client";

import { useEffect, useRef, useState } from "react";

/** How long the button says it has copied, in milliseconds. */
const CONFIRMED = 1600;

export interface CopyAddressProps {
  address: string;
  labels: Record<"copy" | "copied", string>;
  /** The button's look where it stands: the sheet's own, or a control of the theme. */
  className?: string;
}

/** Puts the address on the clipboard: `mailto:` opens nothing on a computer with no mail program. */
export function CopyAddress({ address, labels, className = "write-copy" }: CopyAddressProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    // Refused, or not there at all off a secure origin: the button then just stays as it is.
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
    }, CONFIRMED);
  };

  return (
    <button
      className={className}
      onClick={() => {
        void copy();
      }}
      type="button"
    >
      <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
    </button>
  );
}

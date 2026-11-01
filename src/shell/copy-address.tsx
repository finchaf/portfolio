"use client";

import { useEffect, useRef, useState } from "react";

/** How long the button says it has copied, in milliseconds. */
const CONFIRMED = 1600;

export interface CopyAddressProps {
  address: string;
  labels: Record<"copy" | "copied", string>;
}

/** Puts the address on the clipboard: `mailto:` opens nothing on a computer with no mail program. */
export function CopyAddress({ address, labels }: CopyAddressProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
    }, CONFIRMED);
  };

  return (
    <button
      className="write-copy"
      onClick={() => {
        void copy();
      }}
      type="button"
    >
      <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
    </button>
  );
}

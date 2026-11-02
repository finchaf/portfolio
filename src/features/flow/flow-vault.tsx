"use client";

import { useEffect } from "react";

import type { VaultStrings } from "./engine/strings";
import { startVault } from "./engine/workspace";

/** Brings the server's HTML to life; everything it needs is already on the page. */
export function FlowVault({ strings }: { strings: VaultStrings }) {
  useEffect(() => {
    const controller = new AbortController();
    startVault(strings, controller.signal);
    return () => {
      controller.abort();
    };
  }, [strings]);
  return null;
}

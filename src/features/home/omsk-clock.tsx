"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 20_000;

function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, TICK_MS);
  return () => {
    clearInterval(timer);
  };
}

/** The time in Omsk, once a browser can tell it: the HTML is built long before anyone reads it. */
export function OmskClock({ locale }: { locale: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () =>
      new Date().toLocaleTimeString(locale, {
        timeZone: "Asia/Omsk",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
    () => "",
  );
  return <span className="font-mono tabular-nums">{time && `, ${time}`}</span>;
}

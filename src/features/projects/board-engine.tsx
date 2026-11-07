"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { WIDE } from "@/motion/reduced";
import { DURATION } from "@/motion/tokens";

import { attachBoard } from "./board-camera";

/** Adds the camera to a board that is already drawn, and takes it off below the wide layout. */
export function BoardEngine() {
  const anchor = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const board = anchor.current?.closest<HTMLElement>("[data-board]");
    if (!board) return;
    const wide = matchMedia(WIDE);
    let detach: () => void = () => undefined;
    const sync = () => {
      detach();
      detach = wide.matches
        ? attachBoard(board, {
            open: (href) => {
              router.push(href);
            },
            duration: DURATION.slow * 1000,
          })
        : () => undefined;
    };
    sync();
    wide.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      detach();
    };
  }, [router]);

  return <i data-board-engine hidden ref={anchor} />;
}

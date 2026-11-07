"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { session } from "@/lib/session";
import { WIDE } from "@/motion/reduced";

import { RETURN_KEY } from "./board-camera";

/**
 * The way back: the board then opens inside the project and pulls out, with no slash on top. Only
 * the wide editor has a camera to do it, and a click that opens a new tab leaves this one alone.
 */
export function BackToBoard({
  href,
  label,
  project,
}: {
  href: string;
  label: string;
  project: string;
}) {
  return (
    <Link
      className="pj-back"
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!matchMedia(WIDE).matches) return;
        session.set(RETURN_KEY, project);
        document.documentElement.setAttribute("data-page-quiet", "");
      }}
    >
      <ArrowLeft aria-hidden size={14} /> {label}
    </Link>
  );
}

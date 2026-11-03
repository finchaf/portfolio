"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RETURN_KEY } from "./board-camera";

/** The way back: the board then opens inside the project and pulls out, with no slash on top. */
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
      onClick={() => {
        sessionStorage.setItem(RETURN_KEY, project);
        document.documentElement.setAttribute("data-page-quiet", "");
      }}
    >
      <ArrowLeft aria-hidden size={14} /> {label}
    </Link>
  );
}

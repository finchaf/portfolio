"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** A link of the header that says when it is the current page. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const current = usePathname() === href;
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className="underline-offset-4 hover:underline aria-[current=page]:font-semibold aria-[current=page]:text-accent-strong"
      href={href}
    >
      {children}
    </Link>
  );
}

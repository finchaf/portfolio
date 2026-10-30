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
      className="block rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted transition-colors duration-(--duration-quick) hover:text-ink aria-[current=page]:bg-page aria-[current=page]:text-ink"
      href={href}
    >
      {children}
    </Link>
  );
}

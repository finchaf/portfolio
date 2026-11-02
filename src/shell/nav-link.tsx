"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavLinkProps {
  href: string;
  /** The link's name when its content is a picture. */
  label?: string;
  children: ReactNode;
}

/** A link of the capsule that says when it is the current page. */
export function NavLink({ href, label, children }: NavLinkProps) {
  const current = usePathname() === href;
  return (
    <Link
      aria-current={current ? "page" : undefined}
      aria-label={label}
      className="capsule-link text-muted transition-colors duration-(--duration-quick) hover:text-ink aria-[current=page]:text-ink"
      href={href}
    >
      {children}
    </Link>
  );
}

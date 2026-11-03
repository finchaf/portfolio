"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavLinkProps {
  href: string;
  /** The link's name when its content is a picture. */
  label?: string;
  /** The letters of its name: `capsule.css` sets the cell from them, whatever the typeface. */
  chars?: number;
  children: ReactNode;
}

/** A link of the capsule that says when it is the current page. */
export function NavLink({ href, label, chars, children }: NavLinkProps) {
  const pathname = usePathname();
  // The home page's address starts every other: only a section holds the pages inside it.
  const inside = href.split("/").length > 2 && pathname.startsWith(`${href}/`);
  return (
    <Link
      aria-current={pathname === href ? "page" : inside ? "true" : undefined}
      aria-label={label}
      style={chars ? { "--chars": chars } : undefined}
      className="capsule-link text-muted transition-colors duration-(--duration-quick) hover:text-ink aria-[current=page]:text-ink aria-[current=true]:text-ink"
      href={href}
    >
      {children}
    </Link>
  );
}

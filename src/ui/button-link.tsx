import type { ReactNode } from "react";

const TONES = {
  primary: "bg-accent-strong text-on-accent",
  quiet: "bg-surface text-ink",
  inverse: "bg-on-accent text-accent-strong",
} as const;

const SIZES = { regular: "px-4 py-2.5 lg:px-5", small: "px-3.5 py-1.5 text-sm" } as const;

export interface ButtonLinkProps {
  href: string;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  children: ReactNode;
}

/** A link that looks like a button: the action that leaves for elsewhere, with or without script. */
export function ButtonLink({
  href,
  tone = "primary",
  size = "regular",
  children,
}: ButtonLinkProps) {
  return (
    <a
      className={`inline-flex items-center gap-2 rounded-full font-medium whitespace-nowrap transition-transform duration-(--duration-quick) ease-out hover:-translate-y-px active:translate-y-0 ${TONES[tone]} ${SIZES[size]}`}
      href={href}
    >
      {children}
    </a>
  );
}

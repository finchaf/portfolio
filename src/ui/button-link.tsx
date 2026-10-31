import "./control.css";

import type { ReactNode } from "react";

const TONES = {
  primary: "control-primary",
  quiet: "control-quiet",
  inverse: "control-inverse",
} as const;

const SIZES = { regular: "control-regular", small: "control-small" } as const;

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
    <a className={`control-button ${TONES[tone]} ${SIZES[size]}`} href={href}>
      {children}
    </a>
  );
}

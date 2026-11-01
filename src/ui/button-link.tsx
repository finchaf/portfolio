import "./control.css";

import type { ComponentProps } from "react";

const TONES = {
  primary: "control-primary",
  quiet: "control-quiet",
  inverse: "control-inverse",
} as const;

const SIZES = { regular: "control-regular", small: "control-small" } as const;

export interface ButtonLinkProps extends ComponentProps<"a"> {
  href: string;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  "data-write"?: boolean;
}

/** A link that looks like a button: the action that leaves for elsewhere, with or without script. */
export function ButtonLink({
  tone = "primary",
  size = "regular",
  className = "",
  children,
  ...link
}: ButtonLinkProps) {
  return (
    <a className={`control-button ${TONES[tone]} ${SIZES[size]} ${className}`} {...link}>
      {children}
    </a>
  );
}

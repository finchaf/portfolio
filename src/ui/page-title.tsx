import type { ReactNode } from "react";

/** The one heading of a page, in the theme's display face. */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-4xl font-semibold tracking-tight">{children}</h1>;
}

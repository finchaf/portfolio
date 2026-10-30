import type { ReactNode } from "react";

/** The one heading of a page. */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-4xl font-semibold tracking-tight">{children}</h1>;
}

import type { ReactNode } from "react";

/** The line under a page's heading. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-muted">{children}</p>;
}

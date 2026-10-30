import type { ReactNode } from "react";

/**
 * Declares the page's theme. The stylesheet answers on :root with `:has()`, so the header and the
 * background take it too, in the first HTML, with no script and no change to the layout.
 */
export function World({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3" data-world={name}>
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

import type { WorldName } from "@/themes/worlds";

/**
 * Declares the page's theme. The stylesheet answers on :root with `:has()`, so the header and the
 * background take it too, in the first HTML, with no script and no change to the layout. The page
 * lays out its own sections, to the edge of the screen.
 */
export function World({ name, children }: { name: WorldName; children: ReactNode }) {
  return <div data-world={name}>{children}</div>;
}

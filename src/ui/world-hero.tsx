import { ViewTransition, type ReactNode } from "react";

/**
 * The top of a page that a card on the home page opens: both carry the same transition name, so the
 * card flows into this block. The name is the page's world.
 */
export function WorldHero({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition name={`world-${name}`}>
      <div className="flex flex-col gap-3 rounded-3xl bg-surface p-6 lg:p-10">{children}</div>
    </ViewTransition>
  );
}

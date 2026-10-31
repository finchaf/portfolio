import type { ReactNode } from "react";

/**
 * Declares the page's theme. The stylesheet answers on :root with `:has()`, so the header and the
 * background take it too, in the first HTML, with no script and no change to the layout. A page that
 * draws its sections to the edge of the screen asks for `bleed`.
 */
export function World({
  name,
  bleed = false,
  children,
}: {
  name: string;
  bleed?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        bleed
          ? undefined
          : "flex flex-col gap-3 px-4 pt-[calc(var(--header)+1rem)] pb-[calc(var(--dock)+1rem)] lg:px-8"
      }
      data-world={name}
    >
      {children}
    </div>
  );
}

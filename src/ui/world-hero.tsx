import { ViewTransition, type ReactNode } from "react";

import { PageTitle } from "@/ui/page-title";

/**
 * The top of a page that a chapter of the home page opens: the chapter's name and this title carry
 * the same transition name, so the one flows into the other. The title is as wide as its words,
 * since a picture of the name stretched to a full line would blur. The name is the page's world.
 */
export function WorldHero({
  name,
  title,
  children,
}: {
  name: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-6 lg:p-10">
      <ViewTransition default="none" name={`world-${name}`} share="world-name">
        <div className="w-fit">
          <PageTitle>{title}</PageTitle>
        </div>
      </ViewTransition>
      {children}
    </div>
  );
}

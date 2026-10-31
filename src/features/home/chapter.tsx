import Link from "next/link";
import { useLocale } from "next-intl";
import { ViewTransition, type ReactNode } from "react";

import { localizedPath } from "@/i18n/localized-path";
import type { PagePath } from "@/lib/pages";

export interface ChapterProps {
  world: "pora" | "flow" | "projects";
  path: PagePath;
  /** The direction the chapter moves in: down its stops, or sideways along a track. */
  axis: "y" | "x";
  index: number;
  name: string;
  open: string;
  next: { href: string; label: string };
  ticks: readonly string[];
  children: ReactNode;
}

/**
 * A product on the whole screen, in its theme and its typefaces. In the HTML it is a section like
 * any other. The bar holds through every stop, with the way to the product's page, and the name in
 * it carries the page's transition name, so the name flows into that page.
 */
export function Chapter({
  world,
  path,
  axis,
  index,
  name,
  open,
  next,
  ticks,
  children,
}: ChapterProps) {
  const locale = useLocale();
  return (
    <article
      aria-label={name}
      className="chapter"
      data-axis={axis}
      data-chapter={world}
      data-tint={world}
      data-tint-fonts
      id={`work-${world}`}
      style={{ "--stops": ticks.length }}
    >
      <div className="chapter-stage" data-stage>
        {children}
        <div className="chapter-bar">
          <i aria-hidden className="chapter-progress" data-chapter-progress />
          <p className="chapter-name">
            <span aria-hidden className="font-mono text-sm text-muted">
              {String(index).padStart(2, "0")}
            </span>
            <ViewTransition name={`world-${world}`}>
              <span className="font-display font-semibold">{name}</span>
            </ViewTransition>
          </p>
          <ol aria-hidden className="chapter-rail">
            {ticks.map((tick, position) => (
              <li data-active={position === 0 ? "" : undefined} data-tick key={tick}>
                {tick}
              </li>
            ))}
          </ol>
          <p className="chapter-actions">
            <a className="chapter-next text-sm text-muted" href={next.href}>
              {next.label} ↓
            </a>
            <Link
              className="rounded-full bg-accent-strong px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-on-accent"
              href={localizedPath(locale, path)}
            >
              {open} →
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}

/** One stop of a chapter: what is said, and what is shown beside it. */
export function Stop({ copy, visual }: { copy: ReactNode; visual: ReactNode }) {
  return (
    <li className="stop" data-stop>
      <div className="stop-copy" data-stop-copy>
        {copy}
      </div>
      <div className="stop-visual" data-stop-visual>
        {visual}
      </div>
    </li>
  );
}

import Link from "next/link";
import { useLocale } from "next-intl";
import { ViewTransition, type ReactNode } from "react";

import "@/ui/control.css";

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
  /** How many screens of stops the chapter holds, when its scene does not step tick by tick. */
  stops?: number;
  /**
   * The bar in the dress of the product it belongs to: `status` is the status line of tmux and
   * lualine, `vault` the bottom of Obsidian. Its rail can be pressed, the ways out are the theme's
   * buttons, `mark` follows the name, and `left` and `right` hold the scene's own modules.
   */
  bar?: {
    skin: "status" | "vault" | "paper";
    mark?: ReactNode;
    left?: ReactNode;
    right?: ReactNode;
  };
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
  stops = ticks.length,
  bar,
  children,
}: ChapterProps) {
  const locale = useLocale();
  const pressable = axis === "x" || bar !== undefined;
  return (
    <article
      aria-label={name}
      className="chapter"
      data-axis={axis}
      data-chapter={world}
      data-tint={world}
      data-bar={bar?.skin}
      data-tint-fonts
      id={`work-${world}`}
      style={{ "--stops": stops }}
    >
      <div className="chapter-stage" data-stage>
        {children}
        <div className="chapter-bar">
          {axis === "y" ? (
            <i aria-hidden className="chapter-progress" data-chapter-progress />
          ) : null}
          <p className="chapter-name">
            <span aria-hidden className="font-mono text-sm text-muted">
              {String(index).padStart(2, "0")}
            </span>
            <ViewTransition default="none" name={`world-${world}`} share="world-name">
              <span className="font-display font-semibold">{name}</span>
            </ViewTransition>
            {bar?.mark}
          </p>
          {bar?.left}
          <ol aria-hidden={!pressable} className="chapter-rail">
            {ticks.map((tick, position) => (
              <li data-active={position === 0 ? "" : undefined} data-tick key={tick}>
                {pressable ? (
                  <button data-go={position} type="button">
                    {bar?.skin === "status" ? <span aria-hidden>{position + 1}</span> : null}
                    {tick}
                  </button>
                ) : (
                  tick
                )}
              </li>
            ))}
          </ol>
          {bar?.right}
          <p className="chapter-actions">
            {bar ? (
              <>
                <a
                  className="chapter-next control-button control-quiet control-small"
                  href={next.href}
                >
                  {next.label}
                </a>
                <Link
                  className="control-button control-primary control-small"
                  href={localizedPath(locale, path)}
                >
                  {open}
                </Link>
              </>
            ) : (
              <>
                <a className="chapter-next text-sm text-muted" href={next.href}>
                  {next.label} ↓
                </a>
                <Link
                  className="rounded-full bg-accent-strong px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-on-accent"
                  href={localizedPath(locale, path)}
                >
                  {open} →
                </Link>
              </>
            )}
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

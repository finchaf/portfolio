"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { LOCALES, type Locale } from "@/i18n/locales";
import { switchLocale } from "@/i18n/localized-path";
import { PAGE_MOVED } from "@/motion/tokens";
import { THEMES, type Theme } from "@/themes/theme";
import { useTheme } from "@/themes/use-theme";

import { Segmented } from "./segmented";
import { SettingsIcon } from "./settings-icon";

export interface HeroSettingsProps {
  locale: string;
  /** Told when the menu opens and shuts: the lens steps aside for it. */
  onToggle: (open: boolean) => void;
  /** The button's name, the two groups' and every choice's, from the catalog. */
  labels: Record<"label" | "language" | "theme" | Theme | Locale, string>;
}

/**
 * The language and the theme, in the same instrument as the layers: it leaves with them when the
 * page moves, and shuts then. The footer keeps both on every page, and without a script. A language
 * is a plain link to this page in it, as in the footer, and a theme the same hook, so they agree.
 */
export function HeroSettings({ locale, onToggle, labels }: HeroSettingsProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useId();
  const heading = useId();

  useEffect(() => {
    onToggle(open);
  }, [open, onToggle]);

  useEffect(() => {
    if (!open) return;
    const shut = () => {
      setOpen(false);
    };
    // A pointer or a key that goes anywhere else: Safari does not focus a button it clicks.
    const away = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) shut();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      shut();
      button.current?.focus();
    };
    const scroll = () => {
      if (window.scrollY > PAGE_MOVED) shut();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", scroll);
    };
  }, [open]);

  return (
    <div className="hero-settings" data-open={open ? "" : undefined} ref={root}>
      <button
        aria-controls={menu}
        aria-expanded={open}
        aria-label={labels.label}
        className="segmented-option segmented-icon"
        onClick={() => {
          setOpen(!open);
        }}
        ref={button}
        title={labels.label}
        type="button"
      >
        <SettingsIcon />
      </button>
      <div aria-label={labels.label} className="hero-menu" data-tint="home" id={menu} role="group">
        <div aria-labelledby={heading} className="flex flex-col" role="group">
          <p className="pb-1 text-xs text-muted" id={heading}>
            {labels.language}
          </p>
          <div className="segmented">
            {LOCALES.map((each) => (
              <a
                aria-current={each === locale ? "true" : undefined}
                aria-label={labels[each]}
                className="segmented-option"
                href={switchLocale(pathname, each)}
                hrefLang={each}
                key={each}
                lang={each}
              >
                {each.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
        <Segmented
          label={labels.theme}
          name="hero-theme"
          onChange={setTheme}
          options={THEMES.map((each) => ({ value: each, label: labels[each] }))}
          value={theme}
        />
      </div>
    </div>
  );
}

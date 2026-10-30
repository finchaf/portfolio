"use client";

import type { ReactNode } from "react";

import { THEMES, type Theme } from "@/themes/theme";
import { useTheme } from "@/themes/use-theme";

export interface ThemeSwitcherProps {
  /** The control's name and each choice's, from the catalog. */
  labels: Record<"label" | Theme, string>;
}

const ICONS: Record<Theme, ReactNode> = {
  system: (
    <>
      <rect height="10" rx="1.5" width="14" x="3" y="4" />
      <path d="M7 17h6" />
    </>
  ),
  light: (
    <>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
    </>
  ),
  dark: <path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z" />,
};

/**
 * The system's mode, light or dark, remembered in this browser only. Native radio buttons: arrows,
 * focus and the announced state come with them. The name stays for a screen reader, a mark for the eye.
 */
export function ThemeSwitcher({ labels }: ThemeSwitcherProps) {
  const [theme, setTheme] = useTheme();
  return (
    <fieldset className="flex rounded-full bg-raised p-0.5 text-ink">
      <legend className="sr-only">{labels.label}</legend>
      {THEMES.map((each) => (
        <label
          className="grid size-7 cursor-pointer place-items-center rounded-full has-checked:bg-page has-focus-visible:outline-2 has-focus-visible:outline-accent-strong"
          key={each}
          title={labels[each]}
        >
          <input
            checked={theme === each}
            className="sr-only"
            name="theme"
            onChange={() => {
              setTheme(each);
            }}
            type="radio"
          />
          <span className="sr-only">{labels[each]}</span>
          <svg
            aria-hidden
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 20 20"
          >
            {ICONS[each]}
          </svg>
        </label>
      ))}
    </fieldset>
  );
}

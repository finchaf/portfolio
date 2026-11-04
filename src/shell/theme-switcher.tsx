"use client";

import type { ReactNode } from "react";

import { THEMES, type Theme } from "@/themes/theme";
import { useTheme } from "@/themes/use-theme";
import { Segmented } from "@/ui/segmented";

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

function Icon({ theme }: { theme: Theme }) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 20 20"
    >
      {ICONS[theme]}
    </svg>
  );
}

/**
 * The system's mode, light or dark, remembered in this browser only. The page's tabs: each theme
 * shows the word, the mark or both, and a screen reader hears the word.
 */
export function ThemeSwitcher({ labels }: ThemeSwitcherProps) {
  const [theme, setTheme] = useTheme();
  return (
    <Segmented
      label={labels.label}
      legend="hidden"
      name="theme"
      onChange={setTheme}
      options={THEMES.map((each) => ({
        value: each,
        label: labels[each],
        icon: <Icon theme={each} />,
      }))}
      value={theme}
    />
  );
}

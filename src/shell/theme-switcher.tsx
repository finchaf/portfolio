"use client";

import { THEMES, type Theme } from "@/themes/theme";
import { useTheme } from "@/themes/use-theme";

export interface ThemeSwitcherProps {
  /** The control's name and each choice's, from the catalog. */
  labels: Record<"label" | Theme, string>;
}

/**
 * The system's mode, light or dark, remembered in this browser only. Native radio buttons: arrows,
 * focus and the announced state come with them.
 */
export function ThemeSwitcher({ labels }: ThemeSwitcherProps) {
  const [theme, setTheme] = useTheme();
  return (
    <fieldset className="flex rounded-md bg-raised p-0.5 text-sm">
      <legend className="sr-only">{labels.label}</legend>
      {THEMES.map((each) => (
        <label
          className="cursor-pointer rounded px-2 py-0.5 has-checked:bg-page has-focus-visible:outline-2 has-focus-visible:outline-accent-strong"
          key={each}
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
          {labels[each]}
        </label>
      ))}
    </fieldset>
  );
}

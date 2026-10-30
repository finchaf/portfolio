/**
 * The reader's choice: the system's mode, or light or dark. It lives in `localStorage`, never a
 * cookie, and shows as `data-theme` on <html>, which the stylesheet reads. No attribute means the
 * system's.
 */
export const THEMES = ["system", "light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "theme";

export function parseTheme(value: string | null | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

/** Puts `theme` on the document. The theme script inlines the same logic before hydration. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/**
 * The script for <head>, run before the first paint so that a page in a chosen mode never flashes
 * the other one. It stays standalone: it is inlined as text, and nothing can be imported.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

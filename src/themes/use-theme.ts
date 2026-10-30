"use client";

import { useCallback, useSyncExternalStore } from "react";

import { applyTheme, parseTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

const CHANGE_EVENT = "portfolio:theme";

// The choice when `localStorage` refuses it, as in a private window: it holds for this page.
let unsaved: Theme | null = null;

function read(): Theme {
  if (unsaved !== null) return unsaved;
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void): () => void {
  // Another tab chose a mode: this page takes it too, not only its switcher.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    applyTheme(read());
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** The reader's choice and a setter that remembers it. The build renders «system». */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as const);
  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
      unsaved = null;
    } catch {
      unsaved = next;
    }
    applyTheme(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [theme, setTheme];
}

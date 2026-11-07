"use client";

import { useSyncExternalStore } from "react";

import {
  applyTheme,
  readTheme,
  saveTheme,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type Theme,
} from "./theme";

function subscribe(onChange: () => void): () => void {
  // Another tab chose a mode: this page takes it too, not only its switcher.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    applyTheme(readTheme());
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

/** The reader's choice and a setter that remembers it. The build renders «system». */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as const);
  return [theme, saveTheme];
}

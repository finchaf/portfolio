import en from "../../messages/en/shell.json";
import ru from "../../messages/ru/shell.json";

import type { Locale } from "./locales";

/**
 * The shell's strings alone, for a client component. Importing `CATALOG` from one would put the
 * words of every page in the script of every page.
 */
export const SHELL = { ru, en } satisfies Record<Locale, unknown>;

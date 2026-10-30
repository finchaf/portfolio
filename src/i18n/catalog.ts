import enFlow from "../../messages/en/flow.json";
import enHome from "../../messages/en/home.json";
import enPora from "../../messages/en/pora.json";
import enProjects from "../../messages/en/projects.json";
import enShell from "../../messages/en/shell.json";
import ruFlow from "../../messages/ru/flow.json";
import ruHome from "../../messages/ru/home.json";
import ruPora from "../../messages/ru/pora.json";
import ruProjects from "../../messages/ru/projects.json";
import ruShell from "../../messages/ru/shell.json";

import type { Locale } from "./locales";

/**
 * The site's strings: a file per area in messages/<locale>/, its namespace the file's name.
 * Imported, not read, so the keys are typed and a missing file fails the build.
 */
export const CATALOG = {
  ru: { flow: ruFlow, home: ruHome, pora: ruPora, projects: ruProjects, shell: ruShell },
  en: { flow: enFlow, home: enHome, pora: enPora, projects: enProjects, shell: enShell },
} satisfies Record<Locale, unknown>;

/** Keys are typed from the Russian catalog; that English has the same keys is the Content gate's. */
export type Messages = (typeof CATALOG)["ru"];

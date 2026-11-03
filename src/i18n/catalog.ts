import enFlow from "../../messages/en/flow.json";
import enHome from "../../messages/en/home.json";
import enLatex from "../../messages/en/latex.json";
import enPora from "../../messages/en/pora.json";
import enPortfolio from "../../messages/en/portfolio.json";
import enProjects from "../../messages/en/projects.json";
import enShell from "../../messages/en/shell.json";
import ruFlow from "../../messages/ru/flow.json";
import ruHome from "../../messages/ru/home.json";
import ruLatex from "../../messages/ru/latex.json";
import ruPora from "../../messages/ru/pora.json";
import ruPortfolio from "../../messages/ru/portfolio.json";
import ruProjects from "../../messages/ru/projects.json";
import ruShell from "../../messages/ru/shell.json";

import type { Locale } from "./locales";

/**
 * The site's strings: a file per area in messages/<locale>/, its namespace the file's name.
 * Imported, not read, so the keys are typed and a missing file fails the build.
 */
export const CATALOG = {
  ru: {
    flow: ruFlow,
    home: ruHome,
    latex: ruLatex,
    pora: ruPora,
    portfolio: ruPortfolio,
    projects: ruProjects,
    shell: ruShell,
  },
  en: {
    flow: enFlow,
    home: enHome,
    latex: enLatex,
    pora: enPora,
    portfolio: enPortfolio,
    projects: enProjects,
    shell: enShell,
  },
} satisfies Record<Locale, unknown>;

/** Keys are typed from the Russian catalog; that English has the same keys is the Content gate's. */
export type Messages = (typeof CATALOG)["ru"];

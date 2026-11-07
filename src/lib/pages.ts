/**
 * Every page of the site, in the order of the header: its path without the language prefix (`""`
 * is the home page) and the namespace of its strings. The header, the sitemap, each page's metadata
 * and the browser gates read this; a new page is added here and to expected-build.json.
 */
export const PAGES = {
  "": "home",
  "/poranaparu": "pora",
  "/flow": "flow",
  "/projects": "projects",
} as const;

export type PagePath = keyof typeof PAGES;

export const PAGE_PATHS = Object.keys(PAGES) as PagePath[];

/** Pages inside a page: not in the capsule, in everything else that walks over the pages. */
const SUBPAGES = {
  "/projects/portfolio": "portfolio",
  "/projects/latex": "latex",
} as const;

export const EVERY_PAGE = { ...PAGES, ...SUBPAGES };

export type AnyPagePath = keyof typeof EVERY_PAGE;

export const EVERY_PATH = Object.keys(EVERY_PAGE) as AnyPagePath[];

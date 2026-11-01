/** The site's production address: canonical links, hreflang and the sitemap are built on it. */
export const SITE_ORIGIN = "https://finchaf.com";

/** What a browser shows in a tab and a phone on its home screen, for every page, the 404 included. */
export const SITE_ICONS = {
  icon: [
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
  ],
  apple: "/apple-touch-icon.png",
};

/** The site's name on a link shared in a chat or a feed: the logo's word, the same in any language. */
export const SITE_NAME = "finchaf";

/** Where a reader writes. A plain link, so it works without JavaScript. */
export const TELEGRAM_URL = "https://t.me/finchaf";

/** The same chat as a person writes it. */
export const TELEGRAM_HANDLE = "@finchaf";

/** The address the site shows: an alias for work, so the mailbox itself stays out of public view. */
export const EMAIL = "work@finchaf.com";

export const GITHUB_URL = "https://github.com/finchaf";

/** This site's code: it is part of the portfolio. */
export const REPOSITORY_URL = "https://github.com/finchaf/portfolio";

/** The sources of the thesis, a project of its own. */
export const THESIS_URL = "https://github.com/finchaf/bachelor-thesis";

/** The commit a build comes from, for the footer: next.config.ts reads it from git. */
export const SITE_COMMIT = process.env.NEXT_PUBLIC_SITE_COMMIT ?? "";

/** The day of that commit, as YYYY-MM-DD. */
export const SITE_UPDATED = process.env.NEXT_PUBLIC_SITE_UPDATED ?? "";

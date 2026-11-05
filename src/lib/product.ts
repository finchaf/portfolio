/**
 * Facts of «Пора на пару» and of its first version that more than one page shows. Each has its
 * source beside it. The first version's name and its stores' addresses are words of the pages: they
 * live in `messages/`.
 */

/**
 * The first version's App Store downloads per day, 1 to 14 September 2025. From App Store Connect's export, as
 * is: the home page's chart draws them and its text adds them up, and story-data.test.ts keeps the
 * two equal; the Pora page draws them in the window of its first lesson.
 */
export const LAUNCH_DOWNLOADS = [160, 411, 61, 38, 25, 14, 13, 28, 18, 20, 11, 7, 8, 9] as const;

/** The product's site. */
export const PRODUCT_SITE_URL = "https://poranaparu.com";

/**
 * Commits in the three clients of the new version by month, June to October 2026, without
 * Dependabot's: `git log master --since=2026-06-02 --until=2026-10-31` in `ios`, `android` and `web`,
 * counted 04.11.2026. They add up to 1 450, 907 and 285.
 */
export const CLIENT_COMMITS = {
  months: ["jun", "jul", "aug", "sep", "oct"],
  ios: [294, 700, 392, 39, 25],
  android: [1, 0, 451, 404, 51],
  web: [1, 0, 0, 50, 234],
} as const;

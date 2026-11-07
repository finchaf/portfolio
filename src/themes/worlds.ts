/**
 * The worlds a page can stand in, one theme each in this folder, in the order of the header. It
 * imports nothing, so that the scripts Node runs without the `@/` alias can read it too.
 */
export const WORLDS = ["home", "pora", "flow", "projects"] as const;

export type WorldName = (typeof WORLDS)[number];

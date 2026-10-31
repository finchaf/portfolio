/**
 * What the lens uncovers under the capsule: one map makes every item, which is the point of showing
 * it. Real lines of header.tsx: capsule-source.test.ts finds each of them there.
 */
export const CAPSULE_SOURCE = [
  "{PAGE_PATHS.map((path) => (",
  "  <NavLink",
  "    href={localizedPath(locale, path)}",
  "    world={PAGES[path]}",
  "  >",
  '    {path === "" ? <Mark /> : t(`${PAGES[path]}.title`)}',
  "  </NavLink>",
  "))}",
] as const;

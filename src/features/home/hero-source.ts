/**
 * What the lens uncovers: lines of this page's real source, in the order of the screen. Plain lines
 * rather than a copy to keep by hand: hero-source.test.ts finds each of them in the file they come from.
 */
export const HERO_SOURCE = {
  status: ["<LocalClock locale={locale} />"],
  copy: [
    '<p className="font-display font-semibold">',
    '  {t("role")} <span className="text-muted">· {t("roleNote")}</span>',
    "</p>",
    '<p className="hero-statement">{t("statement")}</p>',
  ],
  action: ['<ButtonLink href="#work">{t("work")}</ButtonLink>'],
} as const;

/** The switch of the layers: real lines of hero-lens.tsx, where it lives. */
export const SWITCH_SOURCE = [
  "<Segmented",
  "  label={labels.label}",
  '  name="hero-layer"',
  "  onChange={choose}",
  "  value={layer}",
  "/>",
] as const;

/** The face of the name, for the measure beside it. */
export const HERO_FACE = "Geologica 800";

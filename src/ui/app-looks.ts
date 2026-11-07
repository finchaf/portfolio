/** The six looks of the made-up app, in src/themes/flow-looks.css, and the one its tool recommended. */
export const APP_LOOKS = ["a", "b", "c", "d", "e", "f"] as const;
export const DEFAULT_LOOK = "c";

export type AppLook = (typeof APP_LOOKS)[number];

export const isLook = (value: string): value is AppLook =>
  (APP_LOOKS as readonly string[]).includes(value);

/**
 * What the Flow terminal shows of each look: the font it is set in and four of its colours, the
 * surface, the card, the text and the accent. Look b's accent is its moon's red, `--s-moon`, not
 * its ink-dark `--s-acc`.
 */
export const LOOK_SPECS: Record<AppLook, { font: string; tokens: string[] }> = {
  a: { font: "Geist", tokens: ["#0e1330", "#1a2147", "#eef0ff", "#f5c26b"] },
  b: { font: "Geologica", tokens: ["#f4efe6", "#fffdf8", "#211c16", "#d9573f"] },
  c: { font: "Nunito", tokens: ["#efeaff", "#ffffff", "#2a2352", "#5b3df5"] },
  d: { font: "Geologica", tokens: ["#070707", "#171717", "#ffffff", "#d4ff3f"] },
  e: { font: "JetBrains Mono", tokens: ["#e8eef1", "#ffffff", "#102027", "#0f6e84"] },
  f: { font: "Golos Text", tokens: ["#ffe6d6", "#fff5ee", "#3a1a12", "#c8391f"] },
};

import { THEME_SCRIPT } from "./theme";

/** Goes first in <head>: sets the chosen mode before the page paints. */
export function ThemeScript() {
  // A constant of ours, never input. The CSP allows inline scripts for Next.js's own anyway.
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} id="theme" />;
}

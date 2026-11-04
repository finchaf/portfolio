/**
 * The browser's top layer: a modal <dialog> rises over everything on the page, the site's own cursor
 * too. A page that opens one says so, and the cursor (src/shell/dot-cursor.tsx), a popover in the
 * same layer, climbs back over it. An event, as a page may not reach into the shell (ADR-0009).
 */
export const TOP_LAYER_EVENT = "finchaf:top-layer";

export function announceTopLayer(): void {
  document.dispatchEvent(new Event(TOP_LAYER_EVENT));
}

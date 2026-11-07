import { WIDE } from "@/motion/reduced";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- a caller names what it expects.
export function find<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
) {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`The vault has no ${selector}`);
  return found;
}

export function all<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
) {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function isWide() {
  return window.matchMedia(WIDE).matches;
}

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

export function isStill() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isWide() {
  return window.matchMedia("(min-width: 64rem)").matches;
}

/** Session storage that refuses quietly: a private window must not break the page. */
export const session = {
  read(key: string) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  write(key: string, value: string | null) {
    try {
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch {
      // Nothing to keep: the run simply starts over.
    }
  },
};

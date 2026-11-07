/**
 * Session storage that refuses quietly. With site data blocked, reading `sessionStorage` itself
 * throws, and a note between two pages must not break either: a key that cannot be kept is lost.
 */
export const session = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Nothing to keep: the next page simply opens as it would on its own.
    }
  },
  remove(key: string) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Nothing was kept, so nothing is left to remove.
    }
  },
};

import { afterEach, describe, expect, it, vi } from "vitest";

import { session } from "./session";

/** A storage in memory, as a browser that keeps site data has. */
const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
};

/** Site data blocked: the getter itself throws, as Chromium's does. */
const blocked = () => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    get() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(globalThis, "sessionStorage");
});

describe("session", () => {
  it("keeps, reads and drops a key", () => {
    vi.stubGlobal("sessionStorage", memory());
    expect(session.get("board-return")).toBeNull();
    session.set("board-return", "latex");
    expect(session.get("board-return")).toBe("latex");
    session.remove("board-return");
    expect(session.get("board-return")).toBeNull();
  });

  it("never throws when the storage is blocked", () => {
    blocked();
    expect(() => {
      session.set("board-arrive", "1");
      session.remove("board-arrive");
    }).not.toThrow();
    expect(session.get("board-arrive")).toBeNull();
  });

  // Firefox with storage disabled hands back null, so the call on it is what throws.
  it("never throws when there is no storage at all", () => {
    vi.stubGlobal("sessionStorage", null);
    expect(() => {
      session.set("board-arrive", "1");
      session.remove("board-arrive");
    }).not.toThrow();
    expect(session.get("board-arrive")).toBeNull();
  });

  it("never throws when the storage is full", () => {
    vi.stubGlobal("sessionStorage", {
      ...memory(),
      setItem: () => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      },
    });
    expect(() => {
      session.set("board-arrive", "1");
    }).not.toThrow();
    expect(session.get("board-arrive")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { gsap } from "./gsap";
import { leaving, takeDown, undo } from "./scene";

// `drop` reads GSAP's own list of a context's cleanups: an update that renames it fails here.
describe("a leaving page's scene", () => {
  it("is killed where it stands, and its cleanups still run", () => {
    const target = { x: 0 };
    const inner = { x: 0 };
    const seen: boolean[] = [];
    const context = gsap.context(() => {
      gsap.to(target, { x: 100, duration: 1, paused: true }).progress(1);
      const nested = gsap.context(() => {
        gsap.to(inner, { x: 50, duration: 1, paused: true }).progress(1);
        return () => seen.push(leaving());
      });
      return () => {
        seen.push(leaving());
        undo(nested);
      };
    });
    takeDown(context);
    expect(target.x).toBe(100);
    expect(inner.x).toBe(50);
    expect(seen).toEqual([true, true]);
    expect(leaving()).toBe(false);
    expect((context as unknown as { data: unknown[] }).data).toHaveLength(0);
  });

  it("is put back when the page stays", () => {
    const target = { x: 0 };
    const context = gsap.context(() => {
      gsap.to(target, { x: 100, duration: 1, paused: true }).progress(1);
    });
    undo(context);
    expect(target.x).toBe(0);
  });
});

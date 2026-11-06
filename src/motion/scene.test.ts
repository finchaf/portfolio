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

  // Every scene keeps its work in a `gsap.matchMedia()`, which the context lists as one of its own.
  // The key `all` matches without a window, so the media need not be faked.
  it("drops the work of a matchMedia inside it, cleanups included", () => {
    const target = { x: 0 };
    const seen: boolean[] = [];
    let media: gsap.MatchMedia | undefined;
    const context = gsap.context(() => {
      media = gsap.matchMedia();
      media.add({ all: "all" }, () => {
        gsap.to(target, { x: 100, duration: 1, paused: true }).progress(1);
        return () => seen.push(leaving());
      });
    });
    takeDown(context);
    expect(target.x).toBe(100);
    expect(seen).toEqual([true]);
    const [made] = (media as unknown as { contexts: { data: unknown[] }[] }).contexts;
    expect(made?.data).toHaveLength(0);
  });

  // A query that starts to match later runs outside the scene's context, which then knows its work
  // only through the matchMedia's own list: `drop` has to walk it.
  it("drops what a matchMedia started after the scene was set up", () => {
    const target = { x: 0 };
    const seen: boolean[] = [];
    let media: gsap.MatchMedia | undefined;
    const context = gsap.context(() => {
      media = gsap.matchMedia();
    });
    media?.add({ all: "all" }, () => {
      gsap.to(target, { x: 100, duration: 1, paused: true }).progress(1);
      return () => seen.push(leaving());
    });
    takeDown(context);
    expect(target.x).toBe(100);
    expect(seen).toEqual([true]);
  });

  it("drops a matchMedia that a cleanup undoes while the page leaves", () => {
    const target = { x: 0 };
    const seen: boolean[] = [];
    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add({ all: "all" }, () => {
        gsap.to(target, { x: 100, duration: 1, paused: true }).progress(1);
        return () => seen.push(leaving());
      });
      return () => {
        undo(media);
      };
    });
    takeDown(context);
    expect(target.x).toBe(100);
    expect(seen).toEqual([true]);
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

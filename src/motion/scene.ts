"use client";

import { type RefObject, useLayoutEffect } from "react";

import { gsap } from "./gsap";

/** What GSAP keeps in a context: what it made, and the cleanups its functions returned. */
interface Made {
  data: unknown[];
  _r?: ((revert: unknown, context: unknown) => void)[];
  kill: (revert?: boolean, matchMedia?: boolean) => void;
}

let leavingPage = false;
let pageShown = false;

/**
 * The first page of a visit has been shown: from now on a page that mounts came by a change of
 * page. The shell's page change says so once, after the first page's scenes have started.
 */
export function markPageShown() {
  pageShown = true;
}

/** True while a page that is going away takes its scenes down. */
export function leaving() {
  return leavingPage;
}

/**
 * Takes down what a context made without putting anything back: its cleanups run first, as they
 * would on a revert, and then its animations, triggers and splits are killed where they stand.
 * Reverting would render every tween to its start, starting the ones that never played, for
 * elements about to leave the document: on the home page that was 650 ms of the change of page.
 */
function drop(context: Made) {
  const cleanups = [...(context._r ?? [])];
  cleanups.forEach((cleanup) => {
    cleanup(false, context);
  });
  context.data.forEach((each) => {
    if (each instanceof Object && "contexts" in each && Array.isArray(each.contexts)) {
      (each.contexts as Made[]).forEach(drop);
    } else if (each instanceof Object && "data" in each && "_r" in each) {
      drop(each as Made);
    }
  });
  context.kill(false, true);
}

/** Takes a leaving page's scene down: see `drop`; `leaving()` is true while it runs. */
export function takeDown(context: gsap.Context) {
  leavingPage = true;
  try {
    drop(context as unknown as Made);
  } finally {
    leavingPage = false;
  }
}

/**
 * Undoes what a scene made: put back while the page stays, as a change of width or of the reader's
 * motion setting asks, and dropped where it stands while the page leaves.
 */
export function undo(made: gsap.Context | gsap.MatchMedia) {
  if (!leavingPage) {
    made.revert();
    return;
  }
  const contexts = (made as { contexts?: Made[] }).contexts;
  if (contexts) {
    contexts.forEach((context) => {
      drop(context);
    });
  } else {
    drop(made as unknown as Made);
  }
}

/** Whether a view transition of the page is on the screen now. */
function changing() {
  return document
    .getAnimations()
    .filter((animation) =>
      (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith("::view-transition"),
    );
}

/**
 * Runs `start` once the change of page that brought this page has played. The browser builds the
 * transition's pictures a frame or two after the page has mounted: until then, and if none comes,
 * it looks again, and gives up after a few frames. Returns what cancels the wait.
 */
function afterPageChange(start: () => void) {
  let cancelled = false;
  let frames = 0;
  let frame = 0;
  const look = () => {
    if (cancelled) return;
    const playing = changing();
    if (playing.length > 0) {
      void Promise.allSettled(playing.map(({ finished }) => finished)).then(() => {
        if (!cancelled) start();
      });
      return;
    }
    frames += 1;
    if (frames < 4) frame = requestAnimationFrame(look);
    else start();
  };
  frame = requestAnimationFrame(look);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}

/**
 * A page's scene: GSAP's work in a context scoped to the page, as `useGSAP` gives it, with two
 * differences that keep the change of page fluid. A page that came by a change of page starts its
 * scene once the slash has played, not inside the update the transition waits for: the HTML already
 * shows the page as it stands without motion. And a page that leaves drops its scene instead of
 * reverting it. `setup` may return a cleanup; it runs in both cases.
 */
export function useScene(
  setup: () => (() => void) | undefined,
  scope: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    let context: gsap.Context | undefined;
    const start = () => {
      context = gsap.context(setup, scope.current ?? undefined);
    };
    const cancel = pageShown ? afterPageChange(start) : undefined;
    if (!cancel) start();
    return () => {
      cancel?.();
      if (context) takeDown(context);
    };
    // A scene is set up once for its page, as `useGSAP` without dependencies does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

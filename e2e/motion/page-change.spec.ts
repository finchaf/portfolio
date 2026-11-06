import { expect, test, type Page } from "@playwright/test";

import { HOME, jump } from "../helpers";

// The view transition between pages.

/** What a test leaves on the page's window to read back: none of it is the site's. */
type Probe = { change?: string[]; held?: string; done?: boolean };

test.describe("a change of page", () => {
  const FLOW = "/ru/flow";

  // What the next view transition runs, read when it is ready: the browser drops it right after.
  // `done` says when it has finished, so the next one does not cut it short.
  const watch = (page: Page) =>
    page.evaluate(() => {
      const start = document.startViewTransition.bind(document) as (
        update: unknown,
      ) => ViewTransition;
      const seen = window as Window & Probe;
      delete seen.change;
      delete seen.done;
      Object.assign(document, {
        startViewTransition(update: unknown) {
          Object.assign(document, { startViewTransition: start });
          const transition = start(update);
          const end = () => {
            seen.done = true;
          };
          void transition.finished.then(end, end);
          void transition.ready.then(() => {
            const root = document.documentElement;
            seen.held = getComputedStyle(root, "::view-transition-group(root)").height;
            seen.change = root
              .getAnimations({ subtree: true })
              .filter((run) => (run.effect as KeyframeEffect).pseudoElement?.includes("transition"))
              .map((run) => {
                const { pseudoElement } = run.effect as KeyframeEffect;
                return `${pseudoElement} ${(run as CSSAnimation).animationName}`;
              });
          });
          return transition;
        },
      });
    });

  const change = async (page: Page) => {
    await page.waitForFunction(() => (window as Window & Probe).change);
    return page.evaluate(() => (window as Window & Probe).change ?? []);
  };

  const capsule = (page: Page, path: string) =>
    page.locator(`[data-capsule] a[href$="${path}"]`).first();

  // A click goes through the router once the page has named its root for the change: without the
  // name React drops the picture of the whole page.
  const live = (page: Page) =>
    expect
      .poll(() => page.evaluate(() => document.documentElement.style.viewTransitionName))
      .toBe("root");

  test("crosses the screen along the slash, and back the other way", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FLOW);
    await live(page);

    await watch(page);
    await capsule(page, "/ru/projects").click();
    const forward = await change(page);
    expect(forward).toContain("::view-transition-new(root) page-slash-in");
    expect(forward).toContain("::view-transition-new(page-lead) page-lead-in");
    expect(forward).toContain("::view-transition-old(capsule) page-capsule-off");
    await expect(page).toHaveURL(/\/ru\/projects$/);
    await expect(page.locator("html")).not.toHaveAttribute("data-page-back");

    await page.waitForFunction(() => (window as Window & Probe).done);
    await watch(page);
    await capsule(page, "/ru").click();
    const back = await change(page);
    expect(back).toContain("::view-transition-new(root) page-slash-back");
    expect(back).toContain("::view-transition-new(page-lead) page-lead-back");
    await expect(page.locator("html")).toHaveAttribute("data-page-back");
  });

  test("keeps the picture of the page to the size of the screen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(HOME);
    await live(page);
    await watch(page);
    await capsule(page, "/ru/flow").click();
    await change(page);
    const held = await page.evaluate(() => (window as Window & Probe).held);
    expect(held).toBe("900px");
  });

  test("lets the name of a chapter flow into the page it opens", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(HOME);
    await live(page);
    const open = page.locator('main a[href$="/ru/flow"]').first();
    await jump(page, (await open.evaluate((node) => node.getBoundingClientRect().top)) - 500);
    await expect(open).toBeInViewport();

    await watch(page);
    await open.click();
    const run = await change(page);
    expect(run).toContain("::view-transition-old(world-flow) page-name-off");
    expect(run).toContain("::view-transition-new(world-flow) page-name-on");
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("is instant", async ({ page }) => {
      await page.goto(FLOW);
      await live(page);
      await watch(page);
      await capsule(page, "/ru/projects").click();
      expect(await change(page)).toEqual([]);
      await expect(page).toHaveURL(/\/ru\/projects$/);
    });
  });
});

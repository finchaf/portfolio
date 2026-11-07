import { expect, test, type Page } from "@playwright/test";

import { jump } from "../helpers";

// The Flow vault.

test.describe("the Flow vault", () => {
  const FLOW = "/ru/flow";
  const TRANSPARENT = "rgba(0, 0, 0, 0)";

  /** The vault's script has started: it takes the scroll over from the browser. */
  const started = (page: Page) =>
    expect.poll(() => page.evaluate(() => history.scrollRestoration)).toBe("manual");
  const title = (page: Page) => page.locator(".note[data-open] .inline-title");

  test("opens a note by its address and Back returns to the place", async ({ page }) => {
    await page.goto(FLOW);
    // The vault starts at the top of the page: a scroll made before it runs would be lost.
    await expect.poll(() => page.evaluate(() => history.scrollRestoration)).toBe("manual");
    await page.evaluate(() => {
      window.scrollTo({ top: 900, behavior: "instant" });
    });
    await page.locator('#tree a[data-note="critic"]').click();
    await expect(page).toHaveURL(/#critic$/);
    await expect(page.locator(".note[data-open] .inline-title")).toHaveText("Критик");
    await page.goBack();
    await expect(page.locator(".note[data-open] .inline-title")).toHaveText("Флоу");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(900);
  });

  test("runs by itself, stops for a person, and takes commands", async ({ page }) => {
    await page.goto(FLOW);
    await expect(page.locator("#term-log")).toContainText("new-app 000", { timeout: 5000 });
    await expect(page.locator("#term-now[data-ask]")).toBeVisible({ timeout: 15000 });
    await page.locator('.sdir[data-dir="a"]').click();
    await expect(page.locator(".compare").first()).toHaveAttribute("data-style", "a");
    await page.locator("#term-in").fill("open rules");
    await page.locator("#term-in").press("Enter");
    await expect(page).toHaveURL(/#rules$/);
  });

  test("keeps a question's chips through a pause", async ({ page }) => {
    await page.goto(FLOW);
    await expect(page.locator("#term-now[data-ask]")).toBeVisible({ timeout: 15000 });
    const chips = page.locator("#term-chips .chip");
    const auto = page.locator("#auto-button");
    await expect(chips).toHaveCount(6);
    await auto.click();
    await expect(auto).toHaveAttribute("data-on", "false");
    await expect(chips).toHaveCount(6);
    await auto.click();
    await expect(auto).toHaveAttribute("data-on", "true");
    await expect(chips).toHaveCount(6);
  });

  test("keeps a theme chosen in the terminal", async ({ page }) => {
    await page.goto(FLOW);
    await started(page);
    await page.locator("#term-in").fill("theme dark");
    await page.locator("#term-in").press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await started(page);
    await page.locator("#term-in").fill("theme system");
    await page.locator("#term-in").press("Enter");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
  });

  test("keeps decisions on their side of the map", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FLOW);
    await expect(page.locator(".lane.me.lane-stop a").first()).toHaveCSS("text-align", "right");
  });

  test("keeps the header flat over the page on a wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FLOW);
    await page.evaluate(() => {
      window.scrollTo({ top: 600, behavior: "instant" });
    });
    await expect(page.locator(".capsule-surface")).toBeHidden();
    await expect(page.locator("[data-capsule]")).toHaveCSS("top", "0px");
  });

  test("opens a note from the phone's tree in one step of history", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(FLOW);
    await started(page);
    await jump(page, 900);
    const steps = await page.evaluate(() => history.length);
    const tree = page.locator('.mobile-bar [data-action="tree"]');
    const scrolled = () => page.evaluate(() => window.scrollY);

    await tree.click();
    // The click may nudge the page to reach the sticky bar: the note's place is where it opened.
    const place = await scrolled();
    expect(place).toBeGreaterThan(800);
    await page.locator('#tree a[data-note="critic"]').click();
    await expect(title(page)).toHaveText("Критик");
    // The note takes the sheet's step: one Back returns to the note under it, at its place.
    expect(await page.evaluate(() => history.length)).toBe(steps + 1);
    await page.goBack();
    await expect(title(page)).toHaveText("Флоу");
    await expect.poll(scrolled).toBe(place);

    // The note already shown takes the sheet's step back with it.
    await tree.click();
    await page.locator('#tree a[data-note="flow"]').click();
    await expect
      .poll(() => page.evaluate(() => history.state as { flowSheet?: boolean }))
      .not.toHaveProperty("flowSheet");
  });

  test("lights the switcher's choice and a menu's row under the pointer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FLOW);
    await started(page);
    await page.keyboard.press("Control+k");
    await expect(page.locator("#prompt-list li[data-selected]")).not.toHaveCSS(
      "background-color",
      TRANSPARENT,
    );
    await page.keyboard.press("Escape");
    await page.locator('[data-action="settings-menu"]').click();
    const row = page.locator(".menu-item").first();
    await row.hover();
    await expect(row).not.toHaveCSS("background-color", TRANSPARENT);
  });

  test("keeps the pencil with the note shown, and off the graph", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FLOW);
    await started(page);
    const pencil = page.locator('.view-header [data-action="source"]');
    await pencil.click();
    await expect(pencil).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".note[data-open] pre.note-source")).toBeVisible();
    await page.locator('#tree a[data-note="critic"]').click();
    await expect(title(page)).toHaveText("Критик");
    await expect(pencil).toHaveAttribute("aria-pressed", "false");
    await page.goBack();
    await expect(pencil).toHaveAttribute("aria-pressed", "true");
    await page.locator("#term-in").fill("graph");
    await page.locator("#term-in").press("Enter");
    await expect(page).toHaveURL(/#graph$/);
    await expect(pencil).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("draws the pane's scrollbar again when a dock folds", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FLOW);
    await started(page);
    await jump(page, 600);
    const thumb = page.locator("#scroll-thumb");
    await expect(thumb).toBeVisible();
    const left = () => thumb.evaluate((node) => node.getBoundingClientRect().left);
    const before = await left();
    await page.locator('[data-action="toggle-right"]').click();
    await expect.poll(left).toBeGreaterThan(before + 200);
  });

  test("sizes the graph's canvas to the pane", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${FLOW}#graph`);
    await expect(page.locator("#graph-full")).toBeVisible();
    await expect.poll(() => page.locator("#graph-full").getAttribute("width")).not.toBe("300");
  });

  test.describe("without a script", () => {
    test.use({ javaScriptEnabled: false });

    test("stands every note on the page", async ({ page }) => {
      await page.goto(FLOW);
      await expect(page.locator("article.note:visible")).toHaveCount(17);
      await expect(page.locator(".transcript")).toBeVisible();
    });
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("shows the whole run at once", async ({ page }) => {
      await page.goto(FLOW);
      await expect(page.locator("#term-log")).toContainText("harvest");
      await expect(page.locator('#tree [data-note="brief"]')).toBeVisible();
    });

    test("turns a folder's chevron at once, and still turns it", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(FLOW);
      const chevron = page.locator("#tree details[open] > summary .collapse-icon").first();
      await expect(chevron).toHaveCSS("transition-duration", "0s");
      await expect(chevron).toHaveCSS("rotate", "90deg");
    });
  });
});

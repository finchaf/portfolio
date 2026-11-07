import { expect, test, type Page } from "@playwright/test";

// The Flow vault.

test.describe("the Flow vault", () => {
  const FLOW = "/ru/flow";
  const TRANSPARENT = "rgba(0, 0, 0, 0)";

  /** The vault's script has started: it takes the scroll over from the browser. */
  const started = (page: Page) =>
    expect.poll(() => page.evaluate(() => history.scrollRestoration)).toBe("manual");

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
  });
});

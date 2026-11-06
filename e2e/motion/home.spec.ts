import { expect, test } from "@playwright/test";

import { HOME } from "../helpers";

// The home page as a whole: without a script, with reduced motion, and its pictures.

const CHAPTERS = 9;
const STOPS = 6;
const PANELS = 7;
const DESK = 5;

test.describe("the home page without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows every step, stop and panel, and no dead controls", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-chapter")).toHaveCount(CHAPTERS);
    for (const chapter of await page.locator(".story-chapter").all()) {
      await expect(chapter).toBeVisible();
    }
    await expect(page.locator(".story-ruler")).toBeHidden();
    await expect(page.locator(".story-menu")).toHaveCount(47);
    await expect(page.locator(".story-photo img").first()).toHaveAttribute("loading", "lazy");
    await expect(page.locator(".stop")).toHaveCount(STOPS);
    for (const stop of await page.locator(".stop").all()) await expect(stop).toBeVisible();
    await expect(page.locator(".desk-copy")).toHaveCount(DESK);
    for (const copy of await page.locator(".desk-copy").all()) await expect(copy).toBeVisible();
    await expect(page.locator(".desk-world .pj-sec").first()).toBeVisible();
    await expect(page.locator("#work-projects [data-go]").first()).toBeHidden();
    await expect(page.locator(".map-stop")).toHaveCount(PANELS);
    for (const stop of await page.locator(".map-stop").all()) await expect(stop).toBeVisible();
    await expect(page.locator("[data-map-canvas]")).toBeHidden();
    await expect(page.locator(".hero-switch")).toBeHidden();
    await expect(page.locator("[data-hero-code]")).toBeHidden();
  });

  test("keeps each work in its theme", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("#work-flow")).toHaveCSS("font-family", /Inter Variable/);
  });
});

test.describe("the home page with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("stays a plain page: nothing is pinned, nothing hidden", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-stage")).toHaveCSS("position", "relative");
    await expect(page.locator(".chapter-stage").first()).toHaveCSS("position", "static");
    await expect(page.locator(".story-quote > span").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".story-quote > span > span")).toHaveCount(0);
    for (const chapter of await page.locator(".story-chapter").all()) {
      await expect(chapter).toBeVisible();
    }
    for (const stop of await page.locator(".stop").all()) await expect(stop).toBeVisible();
    await expect(page.locator(".hero-ring")).toBeHidden();
  });
});

test.describe("the home page in motion", () => {
  test("keeps every picture of the page from being dragged away", async ({ page }) => {
    await page.goto(HOME);
    // The refusal is the page's own listener, there once the page has woken up.
    await expect
      .poll(() =>
        page
          .locator("main img")
          .first()
          .evaluate((image) => {
            const drag = new DragEvent("dragstart", { bubbles: true, cancelable: true });
            image.dispatchEvent(drag);
            return drag.defaultPrevented;
          }),
      )
      .toBe(true);
  });
});

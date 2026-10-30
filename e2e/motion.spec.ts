import { expect, test, type Page } from "@playwright/test";

import { ADDRESSES } from "./pages";

// The promise of ADR-0002: the page is in the HTML and never waits for animation.
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const address of ADDRESSES) {
    test(`${address} shows its heading and its links`, async ({ page }) => {
      await page.goto(address);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(4);
    });
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const address of ADDRESSES) {
    test(`${address} shows its heading`, async ({ page }) => {
      await page.goto(address);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

const HOME = "/ru";
const STEPS = 6;

test.describe("the home page without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows every step, the card and its code, and no dead controls", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-step")).toHaveCount(STEPS);
    for (const step of await page.locator(".story-step").all()) await expect(step).toBeVisible();
    await expect(page.locator("[data-whole]")).toBeVisible();
    await expect(page.locator("[data-code]")).toBeVisible();
    await expect(page.locator("[data-lab]")).toBeHidden();
    await expect(page.locator("[data-brand-text]")).toBeVisible();
  });
});

test.describe("the home page with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("stays a plain page: nothing is pinned, nothing hidden", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-stage")).toHaveCSS("position", "static");
    await expect(page.locator(".build-stage")).toHaveCSS("position", "static");
    await expect(page.locator(".case").first()).toHaveCSS("position", "relative");
    for (const step of await page.locator(".story-step").all()) await expect(step).toBeVisible();
    await expect(page.locator("[data-lab]")).toBeVisible();
    await expect(page.locator("[data-brand-text]")).toHaveCSS("opacity", "1");
  });
});

test.describe("the home page in motion", () => {
  const jump = (page: Page, top: number) =>
    page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: "instant" });
    }, top);

  const height = (page: Page) => page.evaluate(() => window.innerHeight);

  test("hands the name over to the header", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("[data-brand-text]")).toHaveCSS("opacity", "0");
    await jump(page, 1200);
    await expect(page.locator("html")).toHaveAttribute("data-docked");
    await expect(page.locator("[data-brand-text]")).toHaveCSS("opacity", "1");
    await jump(page, 0);
    await expect(page.locator("html")).not.toHaveAttribute("data-docked");
  });

  test("turns the story with the scroll, and never widens the page", async ({ page }) => {
    await page.goto(HOME);
    const story = page.locator("#story");
    const box = await story.evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    const last = page.locator(".story-step").last();
    const start = await last.evaluate((node) => node.getBoundingClientRect().left);
    await jump(page, box.top + box.height - (await height(page)));
    await expect
      .poll(() => last.evaluate((node) => node.getBoundingClientRect().left))
      .toBeLessThan(start - 500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });

  test("holds the keyboard's way to the card's controls", async ({ page }) => {
    await page.goto(HOME);
    await page.getByRole("radio", { name: "24" }).focus();
    await expect(page.locator("[data-lab]")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("[data-code]")).toContainText("radius={16}");
  });

  test("changes the card and its code together", async ({ page }) => {
    await page.goto(HOME);
    await page.getByRole("radio", { name: "Олива" }).check({ force: true });
    await expect(page.locator("[data-code]")).toContainText('tone="success"');
  });

  test("runs the week's rule when a lesson is pressed", async ({ page }) => {
    await page.goto(HOME);
    const status = page.locator("#cases").getByText(/Конфликт/);
    const lesson = page.getByRole("button", { name: "Перенести пару: Код" });
    for (let press = 0; press < 20 && !(await status.isVisible()); press += 1) {
      await lesson.click();
    }
    await expect(status).toBeVisible();
  });
});

test.describe("the home page on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("moves the sections to the bottom and fits the width", async ({ page }) => {
    await page.goto(HOME);
    const bar = await page.getByRole("navigation").boundingBox();
    expect(bar?.y).toBeGreaterThan(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole("button", { name: "Тема и язык" }).click();
    await expect(page.getByRole("link", { name: "English" })).toBeVisible();
  });
});

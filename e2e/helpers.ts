import { expect, type Locator, type Page } from "@playwright/test";

/** The home page in Russian, where most of the motion tests start. */
export const HOME = "/ru";

/**
 * Opens the sheet of ways to write from one of its triggers, the capsule's by default. A trigger is
 * a plain link to the chat until the sheet listens, and a press before that follows the link: the
 * sheet marks every trigger with `aria-haspopup` in the same commit that adds its listener.
 */
export async function openWriteSheet(
  page: Page,
  { by = "click", trigger }: { by?: "click" | "key"; trigger?: Locator } = {},
) {
  const link = trigger ?? page.locator("[data-capsule] [data-write]");
  await expect(link).toHaveAttribute("aria-haspopup", "dialog");
  if (by === "click") {
    await link.click();
    return;
  }
  await link.focus();
  await page.keyboard.press("Enter");
}

/** Puts the page at `top` at once, as a reader's scroll would, with no smooth run to wait for. */
export const jump = (page: Page, top: number) =>
  page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: "instant" });
  }, top);

/** Where an element starts on the page, whatever the scroll. */
export const topOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

/** Puts the page at its foot, where a tall page keeps its footer. */
export const toBottom = (page: Page) =>
  page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });

/** The height of the screen. */
export const height = (page: Page) => page.evaluate(() => window.innerHeight);

/** The page is as wide as the screen: nothing in it scrolls sideways. */
export async function expectNoSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
}

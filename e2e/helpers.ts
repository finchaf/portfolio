import { expect, type Locator, type Page } from "@playwright/test";

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

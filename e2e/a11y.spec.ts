import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { ADDRESSES } from "./pages";

// What a machine can see of WCAG 2.2 AA. A screen reader and the feel of the keyboard are checked
// by hand.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const address of [...ADDRESSES, "/ru/no-such-page"]) {
  test(`${address} has no violations`, async ({ page }) => {
    await page.goto(address);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(
      violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(", ")}`),
    ).toEqual([]);
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`the open settings have no violations, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/ru");
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await page.getByRole("button", { name: "Настройки" }).click();
    await expect(page.locator(".hero-menu")).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .include(".hero-tools")
      .withTags(TAGS)
      .analyze();
    expect(violations.map(({ id }) => id)).toEqual([]);
  });
}

test("a key reaches every choice of the settings, and leaving them shuts them", async ({
  page,
}) => {
  await page.goto("/ru");
  const button = page.getByRole("button", { name: "Настройки" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".hero-menu")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(".hero-menu").getByRole("link", { name: "Русский" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".hero-menu").getByRole("link", { name: "English" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".hero-menu").getByRole("radio", { name: "Система" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".hero-menu")).toBeHidden();
});

test("the first Tab reaches the skip link, and it leads to the page", async ({ page }) => {
  await page.goto("/ru");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "К содержанию" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

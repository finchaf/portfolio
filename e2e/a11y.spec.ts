import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { ADDRESSES } from "./pages";

// What a machine can see of WCAG 2.2 AA. A screen reader and the feel of the keyboard are checked
// by hand.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const address of [...ADDRESSES, "/ru/no-such-page"]) {
  test(`${address} has no violations`, async ({ page }) => {
    await page.goto(address);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(
      violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(", ")}`),
    ).toEqual([]);
  });
}

test("the first Tab reaches the skip link, and it leads to the page", async ({ page }) => {
  await page.goto("/ru");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "К содержанию" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

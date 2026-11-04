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

for (const colorScheme of ["light", "dark"] as const) {
  for (const address of ["/ru", "/ru/poranaparu", "/ru/flow", "/ru/projects"]) {
    test(`the sheet of ways to write has no violations on ${address}, ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(address);
      await expect(page.locator("html")).not.toHaveAttribute("data-intro");
      await page.locator("[data-capsule] [data-write]").click();
      const sheet = page.locator(".write-sheet");
      await expect(sheet).toBeVisible();
      // Half way through its entrance it is half transparent, and axe would measure that.
      await sheet.evaluate((node) =>
        Promise.all(node.getAnimations().map((animation) => animation.finished)),
      );
      const { violations } = await new AxeBuilder({ page })
        .include(".write-sheet")
        .withTags(TAGS)
        .analyze();
      expect(violations.map(({ id }) => id)).toEqual([]);
    });
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const lesson of [
    "about",
    "origin",
    "fork",
    "ios",
    "android",
    "web",
    "system",
    "editor",
    "numbers",
    "next",
  ]) {
    test(`the window of the lesson ${lesson} has no violations, ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/ru/poranaparu");
      const window = page.locator(`#pora-window-${lesson}`);
      // The first press may land before the page listens: it is pressed until the window opens.
      await expect(async () => {
        await page.locator(`.pora-card[data-lesson="${lesson}"]`).click();
        await expect(window).toBeVisible({ timeout: 500 });
      }).toPass();
      await window.evaluate((node) =>
        Promise.all(node.getAnimations().map((animation) => animation.finished)),
      );
      const { violations } = await new AxeBuilder({ page })
        .include(`#pora-window-${lesson}`)
        .withTags(TAGS)
        .analyze();
      expect(violations.map(({ id }) => id)).toEqual([]);
    });
  }
}

test("a key opens a lesson's window, Esc shuts it, and the focus goes back to the card", async ({
  page,
}) => {
  await page.goto("/ru/poranaparu");
  const card = page.locator('.pora-card[data-lesson="about"]');
  const window = page.locator("#pora-window-about");
  await expect(async () => {
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(window).toBeVisible({ timeout: 500 });
  }).toPass();
  await expect(card).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(window).toBeHidden();
  await expect(card).toBeFocused();
  await expect(card).toHaveAttribute("aria-expanded", "false");
});

test("the window's footer and the arrows walk the lessons, and the focus lands on the last one", async ({
  page,
}) => {
  await page.goto("/ru/poranaparu");
  const first = page.locator("#pora-window-about");
  const second = page.locator("#pora-window-origin");
  await expect(async () => {
    await page.locator('.pora-card[data-lesson="about"]').click();
    await expect(first).toBeVisible({ timeout: 500 });
  }).toPass();
  await first.getByRole("button", { name: /Следующая пара/ }).click();
  await expect(second).toBeVisible();
  await expect(first).toBeHidden();
  await page.keyboard.press("ArrowLeft");
  await expect(first).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(second).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(second).toBeHidden();
  await expect(page.locator('.pora-card[data-lesson="origin"]')).toBeFocused();
  await expect(page.locator("html")).not.toHaveAttribute("style", /overflow/);
});

test("a chapter's picture opens full screen, the arrows turn its pictures, and Esc gives the focus back", async ({
  page,
}) => {
  await page.goto("/ru/poranaparu");
  const window = page.locator("#pora-window-web");
  await expect(async () => {
    await page.locator('.pora-card[data-lesson="web"]').click();
    await expect(window).toBeVisible({ timeout: 500 });
  }).toPass();
  const pictures = window.locator("[data-pora-picture]");
  await pictures.first().click();
  const viewer = page.locator(".pora-viewer");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator(".pora-viewer-count")).toHaveText("1 из 3");
  const { violations } = await new AxeBuilder({ page })
    .include(".pora-viewer")
    .withTags(TAGS)
    .analyze();
  expect(violations.map(({ id }) => id)).toEqual([]);
  await page.keyboard.press("ArrowRight");
  await expect(viewer.locator(".pora-viewer-count")).toHaveText("2 из 3");
  await expect(window).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(window).toBeVisible();
  await expect(pictures.nth(1)).toBeFocused();
});

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

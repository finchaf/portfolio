import { expect, test } from "@playwright/test";

import { height, HOME, jump, topOf } from "../helpers";

// The CV block and the last call.

test.describe("the home page in motion", () => {
  test("brings the last call together from both sides, and leaves it straight", async ({
    page,
  }) => {
    await page.goto(HOME);
    const lines = page.locator("#finale-title > span");
    await expect.poll(() => lines.count()).toBeGreaterThan(0);
    const lefts = () =>
      lines.evaluateAll((all) => all.map((line) => Math.round(line.getBoundingClientRect().left)));
    const top = await topOf(page, "#finale-title");
    const screen = await height(page);
    await jump(page, top - screen * 0.9);
    await expect
      .poll(async () => {
        const [first = 0, second = 0] = await lefts();
        return Math.abs(first - second);
      })
      .toBeGreaterThan(50);
    await jump(page, top - screen * 0.3);
    await expect.poll(async () => new Set(await lefts()).size).toBe(1);
  });

  test("splits the experience title into lines", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("#experience-title > span")).not.toHaveCount(0);
  });

  test("gives the CV as a PDF in the reader's language", async ({ page }) => {
    await page.goto(HOME);
    const link = page.locator("#experience").getByRole("link", { name: "Резюме, PDF" });
    await expect(link).toHaveAttribute("href", "/cv/ru.pdf");
    await expect(link).toHaveAttribute("download", "Данил Заблоцкий, резюме.pdf");
    await page.goto("/en");
    await expect(
      page.locator("#experience").getByRole("link", { name: "CV, PDF" }),
    ).toHaveAttribute("href", "/cv/en.pdf");
  });

  test("holds the person while the rows of the CV pass", async ({ page }) => {
    await page.goto(HOME);
    const top = await topOf(page, "#experience");
    const profile = page.locator(".exp-profile");
    await jump(page, top + 250);
    const held = (await profile.boundingBox())?.y ?? 0;
    await jump(page, top + 450);
    await expect
      .poll(async () => Math.round((await profile.boundingBox())?.y ?? 0))
      .toBe(Math.round(held));
  });
});

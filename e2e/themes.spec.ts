import { readFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { ADDRESSES } from "./pages";

const WORLDS = [
  { address: "/ru", theme: "home", display: "Geologica Variable", font: /^geologica-/ },
  { address: "/ru/pora-na-paru", theme: "pora", display: "Geist Variable", font: /^geist-/ },
  { address: "/ru/flow", theme: "flow", display: "Inter Variable", font: /^inter-/ },
  { address: "/ru/projects", theme: "projects", display: "Nunito Variable", font: /^nunito-/ },
] as const;

const MODES = ["light", "dark"] as const;

/** The page colour a theme file declares for a mode, as the browser reports a colour. */
function pageColor(theme: string, mode: (typeof MODES)[number]): string {
  const css = readFileSync(join(import.meta.dirname, `../src/themes/${theme}.css`), "utf8");
  const pair = /--page: light-dark\((#\w{6}), (#\w{6})\)/.exec(css);
  const hex = pair?.[mode === "light" ? 1 : 2] ?? "";
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

for (const { address, theme, display } of WORLDS) {
  for (const mode of MODES) {
    test(`${address} follows a ${mode} system with its own colours and face`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode });
      await page.goto(address);
      expect(await background(page)).toBe(pageColor(theme, mode));
      expect(
        await page.evaluate(
          () => getComputedStyle(document.querySelector("h1") as Element).fontFamily,
        ),
      ).toContain(display);
    });
  }

  test(`${address} needs no script for its theme`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto(address);
    await expect(page.locator("body")).toHaveCSS("background-color", pageColor(theme, "dark"));
    await context.close();
  });
}

test("a page downloads its own fonts and nobody else's", async ({ page }) => {
  for (const { address, font } of WORLDS) {
    const fonts: string[] = [];
    const listen = (response: { url: () => string }) => {
      const name = response.url().split("/").pop() ?? "";
      if (name.endsWith(".woff2")) fonts.push(name);
    };
    page.on("response", listen);
    await page.goto(address, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    page.off("response", listen);
    expect(fonts.length, address).toBeGreaterThan(0);
    const display = fonts.filter((name) => font.test(name));
    expect(display.length, `${address}: ${fonts.join(", ")}`).toBeGreaterThan(0);
    expect(fonts.every((name) => name.includes("cyrillic") || name.includes("latin"))).toBe(true);
  }
});

test("the default is the system, and a choice beats it and survives a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/ru/flow");
  await expect(page.getByRole("radio", { name: "Система" })).toBeChecked();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");

  await page.getByText("Тёмная", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await background(page)).toBe(pageColor("flow", "dark"));

  await page.reload();
  await expect(page.getByRole("radio", { name: "Тёмная" })).toBeChecked();
  expect(await background(page)).toBe(pageColor("flow", "dark"));

  await page.getByRole("link", { name: "Проекты" }).click();
  await expect(page).toHaveURL(/\/ru\/projects$/);
  await expect.poll(() => background(page)).toBe(pageColor("projects", "dark"));

  await page.getByText("Система", { exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  expect(await background(page)).toBe(pageColor("projects", "light"));
});

test("a chosen mode is on the document before the first paint", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
  });
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/ru");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("the switcher works from the keyboard", async ({ page }) => {
  await page.goto("/ru");
  await page.getByRole("radio", { name: "Система" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Светлая" })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const mode of MODES) {
  for (const address of [...ADDRESSES, "/ru/no-such-page"]) {
    test(`${address} has no violations in the ${mode} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode });
      await page.goto(address);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(
        violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(", ")}`),
      ).toEqual([]);
    });
  }
}

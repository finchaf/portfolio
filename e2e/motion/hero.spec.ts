import { expect, test, type Page } from "@playwright/test";

import { HOME, jump } from "../helpers";

// The first screen: the lens, the source under it, the settings and the row along its top.

test.describe("the home page with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("does not assemble the first screen", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await expect(page.locator(".hero-status").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-copy").first()).toHaveCSS("animation-name", "none");
  });

  test("opens the source at once, without a lens", async ({ page }) => {
    await page.goto(HOME);
    await page.getByRole("radio", { name: "Код" }).check({ force: true });
    await expect
      .poll(() =>
        page
          .locator(".hero")
          .evaluate((hero) => parseFloat(hero.style.getPropertyValue("--lens-r"))),
      )
      .toBeGreaterThan(500);
  });
});

test.describe("the home page in motion", () => {
  const lens = (page: Page, name: string) =>
    page.locator(".hero").evaluate((hero, variable) => {
      return parseFloat(hero.style.getPropertyValue(variable));
    }, name);

  test("moves the lens with the pointer and opens the whole source", async ({ page }) => {
    await page.goto(HOME);
    // It listens from hydration, which on a slow machine comes well after `load`.
    await expect.poll(() => lens(page, "--lens-x")).not.toBeNaN();
    await page.mouse.move(300, 300);
    await page.mouse.move(320, 340);
    await expect.poll(() => lens(page, "--lens-x")).toBeCloseTo(320, -1);
    await expect.poll(() => lens(page, "--lens-y")).toBeCloseTo(340, -1);
    const closed = await lens(page, "--lens-r");
    await page.getByRole("radio", { name: "Код" }).check({ force: true });
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(closed * 2);
    await expect(page.locator("[data-hero-code]")).toContainText("LocalClock");
  });

  test("shuts the lens and the source when the page moves, and brings them back at the top", async ({
    page,
  }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await page.mouse.move(600, 400);
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(100);
    const capsule = page.locator("[data-capsule]");
    const reach = () =>
      capsule.evaluate((node) => parseFloat(node.style.getPropertyValue("--lens-r")));
    await jump(page, 200);
    await expect.poll(() => lens(page, "--lens-r")).toBe(0);
    await expect.poll(reach).toBe(0);
    await expect(page.locator(".hero-ring")).toHaveCSS("opacity", "0");
    await jump(page, 0);
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(100);
    await page.getByRole("radio", { name: "Код" }).check({ force: true });
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(500);
    await jump(page, 5000);
    await expect.poll(reach).toBe(0);
    await jump(page, 0);
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(500);
  });

  test("opens the settings from the switch, and shuts them every way a reader would", async ({
    page,
  }) => {
    await page.goto(HOME);
    const button = page.getByRole("button", { name: "Настройки" });
    const menu = page.locator(".hero-menu");
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");

    await button.click();
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();

    await button.click();
    await page.mouse.click(300, 400);
    await expect(menu).toBeHidden();

    await button.click();
    await expect(menu).toBeVisible();
    await button.click();
    await expect(menu).toBeHidden();

    await button.click();
    await jump(page, 200);
    await expect(menu).toBeHidden();
  });

  test("leaves the settings with the switch while the capsule stays", async ({ page }) => {
    await page.goto(HOME);
    const button = page.getByRole("button", { name: "Настройки" });
    const capsule = await page.locator("[data-capsule]").boundingBox();
    await jump(page, 400);
    await expect.poll(async () => (await button.boundingBox())?.y ?? 0).toBeLessThan(0);
    expect((await page.locator("[data-capsule]").boundingBox())?.y).toBe(capsule?.y);
  });

  test("keeps the settings and the footer on one theme, and remembers it", async ({ page }) => {
    await page.goto(HOME);
    await page.getByRole("button", { name: "Настройки" }).click();
    const menu = page.locator(".hero-menu");
    await menu.getByRole("radio", { name: "Тёмная" }).check({ force: true });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("footer").getByRole("radio", { name: "Тёмная" })).toBeChecked();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Настройки" }).click();
    await expect(menu.getByRole("radio", { name: "Тёмная" })).toBeChecked();
    await menu.getByRole("radio", { name: "Система" }).check({ force: true });
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  });

  test("takes the reader to this page in the other language", async ({ page }) => {
    await page.goto(HOME);
    await page.getByRole("button", { name: "Настройки" }).click();
    const menu = page.locator(".hero-menu");
    await expect(menu.getByRole("link", { name: "Русский" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await menu.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-js");
    await expect(page.locator("h1")).toContainText("Danil");
  });

  test("darkens the settings over the source", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(HOME);
    await page.getByRole("radio", { name: "Код" }).check({ force: true });
    await page.getByRole("button", { name: "Настройки" }).click();
    const menu = page.locator(".hero-menu");
    await expect(menu).toHaveCSS("color-scheme", "dark");
    await expect(menu).toHaveCSS("background-color", "rgb(20, 27, 34)");
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(500);
  });

  test("shuts the lens for the settings, and opens it again after them", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(100);
    await page.getByRole("button", { name: "Настройки" }).click();
    await expect.poll(() => lens(page, "--lens-r")).toBe(0);
    await page.keyboard.press("Escape");
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(100);
  });

  test("lays the code layer block for block over the design, however wide the screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    const box = (selector: string) => page.locator(selector).first().boundingBox();
    for (const [design, code] of [
      ["h1", ".hero-outline"],
      [".hero-status", ".hero-top .hero-twin"],
      [".hero-copy", ".hero-foot > .hero-twin"],
      [".hero-switch .hero-tools", ".hero-switch-twin .hero-control"],
    ] as const) {
      expect(await box(code)).toEqual(await box(design));
    }
  });

  test("shows the source of the capsule and the switch, and hatches the name exactly", async ({
    page,
  }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await expect(page.locator(".capsule-source")).toContainText("PAGE_PATHS.map");
    await expect(page.locator(".capsule-code [data-measure]").first()).toHaveAttribute(
      "data-size",
      /\d+ × \d+/,
    );
    await expect(page.locator(".hero-switch-source")).toContainText("<Segmented");
    const offset = await page
      .locator(".hero-outline > span")
      .first()
      .evaluate((word) => {
        const hatch = word.querySelector(".hero-hatch");
        if (!hatch) return Infinity;
        const middle = (box: DOMRect) => box.top + box.height / 2;
        return Math.abs(
          middle(hatch.getBoundingClientRect()) - middle(word.getBoundingClientRect()),
        );
      });
    expect(offset).toBeLessThan(1);
  });

  for (const [width, viewport] of [
    [2560, 1440],
    [1920, 1080],
    [1440, 900],
    [1440, 833],
    [1440, 831],
    [1455, 650],
    [1280, 720],
    [1280, 601],
    [1280, 599],
  ] as const) {
    test(`keeps the source clear of the name on ${String(width)}×${String(viewport)}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: viewport });
      await page.goto(HOME);
      await expect(page.locator("html")).not.toHaveAttribute("data-intro");
      const clear = await page.evaluate(() => {
        const label = document.querySelector("[data-hero-box]")?.getBoundingClientRect().top ?? 0;
        // The measure of the name stands 1.625rem above its frame.
        const name = label - 26;
        return [".capsule-source", ".hero-switch-source"].map((selector) => {
          const node = document.querySelector(selector);
          if (!node || getComputedStyle(node).display === "none") return 1;
          return name - node.getBoundingClientRect().bottom;
        });
      });
      for (const room of clear) expect(room).toBeGreaterThan(0);
    });
  }

  test("closes the source up on a low screen, and leaves the sizes on a very low one", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1455, height: 650 });
    await page.goto(HOME);
    const lines = page.locator(".capsule-source code");
    await expect(lines.filter({ visible: true })).toHaveCount(3);
    await page.setViewportSize({ width: 1455, height: 580 });
    await expect(page.locator(".capsule-source")).toBeHidden();
    await expect(page.locator(".capsule-code [data-measure]").first()).toBeAttached();
  });

  test("keeps the status, the capsule and the switch in one row, on the content's edge", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    const centre = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      return (box?.y ?? 0) + (box?.height ?? 0) / 2;
    };
    const capsule = await centre("[data-capsule]");
    expect(await centre(".hero-status")).toBeCloseTo(capsule, 0);
    expect(await centre(".hero-switch .hero-tools")).toBeCloseTo(capsule, 0);
    const right = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      return (box?.x ?? 0) + (box?.width ?? 0);
    };
    expect(await right(".hero-switch .hero-tools")).toBeCloseTo(await right(".hero-foot"), 0);
  });

  test("assembles the first screen when a page opens, and only then", async ({ page }) => {
    await page.goto(HOME);
    const root = page.locator("html");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(root).not.toHaveAttribute("data-intro");
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(0);
    await page
      .getByRole("navigation", { name: "Разделы сайта" })
      .getByRole("link", { name: "Флоу" })
      .click();
    await page.waitForURL("**/ru/flow");
    await page
      .getByRole("navigation", { name: "Разделы сайта" })
      .getByRole("link", { name: "Главная" })
      .click();
    await page.waitForURL(`**${HOME}`);
    await expect(root).not.toHaveAttribute("data-intro");
    await page.goto("/ru/flow");
    await expect(root).not.toHaveAttribute("data-intro");
  });
});

test.describe("the first screen's row on a phone", () => {
  for (const [width, locale] of [
    [320, "ru"],
    [360, "ru"],
    [360, "en"],
    [390, "en"],
  ] as const) {
    test(`keeps the status clear of the instrument at ${String(width)}, ${locale}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/${locale}`);
      const edges = await page.evaluate(() => {
        const status = document.querySelector(".hero-status");
        const tools = document.querySelector(".hero-switch .hero-tools");
        return {
          status: status?.getBoundingClientRect().right ?? 0,
          tools: tools?.getBoundingClientRect().left ?? 0,
          screen: document.documentElement.scrollWidth,
        };
      });
      expect(edges.status).toBeLessThanOrEqual(edges.tools);
      expect(edges.screen).toBe(width);
    });
  }
});

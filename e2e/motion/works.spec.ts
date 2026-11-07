import { expect, test } from "@playwright/test";

import { expectNoSideScroll, height, HOME, jump, topOf } from "../helpers";

// The three works on the home page: «Пора на пару», Flow and Projects.

test.describe("the home page in motion", () => {
  test("casts no shadow in the dark, and keeps it in the light", async ({ page }) => {
    const none = "rgba(0, 0, 0, 0)";
    const shadows = () =>
      Promise.all(
        [".chapter-stage", ".capsule-surface"].map((selector) =>
          page
            .locator(selector)
            .first()
            .evaluate((node) => getComputedStyle(node).boxShadow),
        ),
      );
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(HOME);
    for (const shadow of await shadows()) expect(shadow).toContain(none);
    await page.emulateMedia({ colorScheme: "light" });
    for (const shadow of await shadows()) expect(shadow).not.toContain(none);
  });

  test("gives the capsule the theme of the work on the screen, and takes it back", async ({
    page,
  }) => {
    await page.goto(HOME);
    const capsule = page.locator("[data-capsule]");
    await expect(capsule).not.toHaveAttribute("data-tint");
    for (const world of ["pora", "flow"]) {
      await jump(page, await topOf(page, `#work-${world}`));
      await expect(capsule).toHaveAttribute("data-tint", world);
      await expect(capsule.getByRole("link", { name: "Главная" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(capsule.getByRole("link", { name: "Флоу" })).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
    }
    await jump(page, 0);
    await expect(capsule).not.toHaveAttribute("data-tint");
  });

  test("steps through a chapter downward, one stop at a time", async ({ page }) => {
    await page.goto(HOME);
    const second = page.locator("#work-pora .stop").nth(1);
    await expect(second.locator("[data-stop-copy]")).toHaveCSS("opacity", "0");
    const top = await topOf(page, "#work-pora");
    await jump(page, top + 1.1 * (await height(page)));
    await expect(second).toHaveAttribute("data-active");
    await expect(second.locator("[data-stop-copy]")).toHaveCSS("opacity", "1");
  });

  test("flies along Flow's graph and hands over to Projects from the right", async ({ page }) => {
    await page.goto(HOME);
    const titles = page.locator("#work-flow [data-map-title]");
    const stage = page.locator("#work-projects [data-stage]");
    const stageLeft = () => stage.evaluate((node) => node.getBoundingClientRect().left);
    const flow = await topOf(page, "#work-flow");
    const projects = await topOf(page, "#work-projects");
    await jump(page, flow);
    await expect(titles.first()).toHaveCSS("opacity", "1");
    await expect(titles.last()).toHaveCSS("opacity", "0");
    await jump(page, projects - 10);
    await expect(titles.first()).toHaveCSS("opacity", "0");
    await expect(titles.last()).toHaveCSS("opacity", "1");
    expect(await stageLeft()).toBeGreaterThan(1000);
    await jump(page, projects + (await height(page)));
    await expect.poll(stageLeft).toBeCloseTo(0, 0);
    await expectNoSideScroll(page);
  });

  test("flies over the Projects board and names the selection in its status line", async ({
    page,
  }) => {
    await page.goto(HOME);
    const chapter = page.locator("#work-projects");
    await jump(page, (await topOf(page, "#work-projects")) + (await height(page)));
    await chapter.locator("[data-go]").nth(2).click();
    await expect(chapter.locator('[data-sec="latex"]')).toHaveAttribute("data-selected", "");
    await expect(chapter.locator("[data-crumb]").nth(3)).toHaveAttribute("data-active", "");
    await expect(chapter.locator("[data-tick]").nth(2)).toHaveAttribute("data-active", "");
    // A link of a stop the eye has not reached brings the camera to it.
    await chapter.getByRole("link", { name: "Раздел «Темы»" }).focus();
    await expect(chapter.locator('[data-frame="themes"]')).toHaveAttribute("data-selected", "");
    await expect(chapter.locator('[data-sec="latex"]')).not.toHaveAttribute("data-selected");
    await expect(chapter.locator("[data-desk-zoom]")).toHaveText(/^\d+%$/);
  });

  test("goes along Flow's stops by the rail and the arrows", async ({ page }) => {
    await page.goto(HOME);
    await jump(page, await topOf(page, "#work-flow"));
    const scroll = () => page.evaluate(() => window.scrollY);
    const start = await scroll();
    await page.keyboard.press("ArrowRight");
    await expect.poll(scroll).toBeGreaterThan(start + 100);
    const rail = page.locator("#work-flow [data-go]");
    await rail.nth(5).click();
    await expect(page.locator("#work-flow [data-tick]").nth(5)).toHaveAttribute("data-active", "");
  });

  test("lets a reader choose the style of Flow's screens", async ({ page }) => {
    await page.goto(HOME);
    await jump(page, await topOf(page, "#work-flow"));
    await page.locator("#work-flow [data-go]").nth(1).click();
    const tile = page.locator('#work-flow [data-look="f"]');
    await expect(tile).toHaveCSS("opacity", "1");
    await tile.click();
    await expect(tile).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#work-flow [data-look-target]").first()).toHaveAttribute(
      "data-style",
      "f",
    );
    await expect(page.locator("#work-flow [data-look-letter]")).toHaveText("F");
  });

  test("keeps the way to the product's page through a chapter", async ({ page }) => {
    await page.goto(HOME);
    const link = page.locator("#work-pora .chapter-bar").getByRole("link", { name: /Открыть/ });
    const top = await topOf(page, "#work-pora");
    for (const stop of [0, 2, 3]) {
      await jump(page, top + stop * 0.9 * (await height(page)) + 100);
      await expect(link).toBeInViewport();
    }
    await expect(link).toHaveAttribute("href", "/ru/poranaparu");
  });

  test("takes the reader to a stop pressed in the bar of «Пора на пару»", async ({ page }) => {
    await page.goto(HOME);
    const chapter = page.locator("#work-pora");
    await jump(page, (await topOf(page, "#work-pora")) + 10);
    await chapter.locator("[data-go]").nth(3).click();
    await expect(chapter.locator("[data-tick]").nth(3)).toHaveAttribute("data-active", "");
    await expect(chapter.locator("[data-stop]").nth(3)).toHaveAttribute("data-active", "");
  });

  test("carries one lesson through the frames and publishes it past the clash", async ({
    page,
  }) => {
    await page.goto(HOME);
    const chapter = page.locator("#work-pora");
    const fly = chapter.locator("[data-pair-fly]");
    const top = await topOf(page, "#work-pora");
    const screen = await height(page);
    const length = (await chapter.evaluate((node: HTMLElement) => node.offsetHeight)) - 2 * screen;
    // The scene's clock: a rest of 0.7 on each of the six stops, a move of 1 between them.
    const at = (time: number) => top + (time / (0.7 * 6 + 5)) * length;
    const gap = async (hold: string) => {
      const a = await fly.boundingBox();
      const b = await chapter.locator(`[data-pair-hold="${hold}"]`).boundingBox();
      if (!a || !b) return Number.POSITIVE_INFINITY;
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.width - b.width));
    };
    for (const [stop, hold] of [
      [1, "web"],
      [2, "la"],
      [3, "android"],
    ] as const) {
      await jump(page, at(1.7 * stop + 0.35));
      await expect.poll(() => gap(hold)).toBeLessThan(1.5);
    }
    await jump(page, at(1.7 * 4 + 0.08));
    await expect(chapter.getByText(/Конфликт/)).toBeVisible();
    await jump(page, at(1.7 * 4 + 0.62));
    await expect.poll(() => gap("free")).toBeLessThan(1.5);
    await expect(chapter.getByText("Опубликовано во всех приложениях")).toBeVisible();
    await expect(chapter.getByText(/Конфликт/)).toBeHidden();
    // Published, it stays in the editor's week and leaves with it: the frame's own card takes over.
    await jump(page, at(1.7 * 4 + 0.7 + 0.5));
    await expect(fly).toHaveCSS("opacity", "0");
    await expect(chapter).toHaveAttribute("data-pair-landed");
    await expect(chapter.locator('[data-pair-hold="free"] img').first()).toHaveCSS(
      "visibility",
      "visible",
    );
  });
});

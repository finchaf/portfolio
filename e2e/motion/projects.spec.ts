import { expect, test, type Page } from "@playwright/test";

import { height, jump, topOf } from "../helpers";

// The board of projects and the pages of the two projects.

test.describe("the board of projects", () => {
  /** The camera has taken the board once it has written the zoom. */
  const ready = (page: Page) => expect(page.locator("[data-zoom-value]")).toHaveText(/\d+%/);

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("is a list of what lies on it, each frame a link into the project", async ({ page }) => {
      await page.goto("/ru/projects");
      await expect(page.getByRole("heading", { level: 2, name: "portfolio/" })).toBeVisible();
      await expect(page.locator("[data-frame]")).toHaveCount(13);
      await expect(page.locator('[data-frame="gates"]')).toHaveAttribute(
        "href",
        "/ru/projects/portfolio#gates",
      );
      await expect(page.locator('[data-frame="thesis"]')).toHaveAttribute(
        "href",
        "/ru/projects/latex#thesis",
      );
      await expect(page.locator(".pj-board-layers")).toBeHidden();
    });

    test("puts each project's properties under its frames", async ({ page }) => {
      await page.goto("/ru/projects");
      const panels = page.locator(".pj-board-inspector");
      await expect(panels).toHaveCount(2);
      await expect(panels.nth(1)).toBeVisible();
      await expect(panels.nth(1).getByRole("heading", { level: 2 })).toHaveText("LaTeX");
    });
  });

  test("a click selects a frame and leaves the address alone", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    await page.locator('[data-frame="themes"]').click();
    await expect(page.locator('[data-frame="themes"]')).toHaveAttribute("data-selected", "");
    await expect(page.locator('[data-inspect="themes"]')).toBeVisible();
    await expect(page).toHaveURL(/\/ru\/projects$/);
  });

  test("a frame moves under the hand and the panel reads where it went", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    const box = await page.locator('[data-frame="gates"]').boundingBox();
    if (!box) throw new Error("no frame");
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + 40, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator('[data-inspect="gates"] [data-axis="x"]')).not.toHaveText("24");
  });

  test("the wheel hands over to the page at the board's lower edge", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });

  test("the project opens and the way back returns to the board", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    await page.locator(".pj-board-inspector[data-current] [data-open]").click();
    await expect(page).toHaveURL(/\/ru\/projects\/portfolio$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator(".pj-back").click();
    await expect(page).toHaveURL(/\/ru\/projects$/);
    await ready(page);
  });

  test("a click on another project's frame turns the panel to that project", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    await expect(page.locator(".pj-board-inspector[data-current]")).toHaveAttribute(
      "data-project",
      "portfolio",
    );
    await page.locator('[data-frame="verify"]').click();
    await expect(page.locator(".pj-board-inspector[data-current]")).toHaveAttribute(
      "data-project",
      "latex",
    );
    await expect(page.locator('[data-inspect="verify"]')).toBeVisible();
    await expect(page.locator(".pj-board-inspector")).toHaveCount(2);
    await expect(page.locator(".pj-board-inspector:visible")).toHaveCount(1);
  });

  test("the way back from a project opens the board on that project", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    await page.locator('[data-layer="latex"]').click();
    await page.locator(".pj-board-inspector[data-current] [data-open]").click();
    await expect(page).toHaveURL(/\/ru\/projects\/latex$/);
    await page.locator(".pj-back").click();
    await expect(page).toHaveURL(/\/ru\/projects$/);
    await ready(page);
    await expect(page.locator(".pj-board-inspector[data-current]")).toHaveAttribute(
      "data-project",
      "latex",
    );
  });

  test("keeps its shape after the styles of another page have loaded", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    const before = await page.locator('[data-sec="latex"]').boundingBox();
    await page.locator('[data-capsule] nav a[href$="/flow"]').click();
    await expect(page).toHaveURL(/\/ru\/flow$/);
    await page.locator('[data-capsule] nav a[href$="/projects"]').click();
    await expect(page).toHaveURL(/\/ru\/projects$/);
    await ready(page);
    await expect(page.locator('[data-frame="themes"]')).toHaveCSS("position", "absolute");
    await expect.poll(() => page.locator('[data-sec="latex"]').boundingBox()).toEqual(before);
  });

  test("leaves the home page's board as a fresh load draws it", async ({ page }) => {
    await page.goto("/ru/projects");
    await ready(page);
    await page.locator("[data-capsule]").getByRole("link", { name: "Главная" }).click();
    await expect(page).toHaveURL(/\/ru$/);
    const chapter = page.locator("#work-projects");
    await jump(page, (await topOf(page, "#work-projects")) + (await height(page)));
    // The editor's sheet stays loaded here, and its handles, shown by `display`, must not reach the
    // chapter's, which are always laid out and fade in under the pointer.
    await expect(
      chapter.locator(".pj-frame:not([data-selected]) .pj-frame-handles").first(),
    ).toHaveCSS("display", "block");
    await expect
      .poll(async () => {
        const spot = await chapter.evaluate((node) => {
          for (const frame of node.querySelectorAll<HTMLElement>(
            ".pj-frame:not([data-selected])",
          )) {
            const box = frame.getBoundingClientRect();
            const x = box.left + box.width / 2;
            const y = box.top + box.height / 2;
            if (document.elementFromPoint(x, y)?.closest(".pj-frame") === frame) {
              return { key: frame.dataset.frame ?? "", x, y };
            }
          }
          return null;
        });
        if (!spot) return "no frame in reach";
        await page.mouse.move(spot.x, spot.y);
        return chapter
          .locator(`[data-frame="${spot.key}"] .pj-frame-handles`)
          .evaluate(
            (node) => `${getComputedStyle(node).display} ${getComputedStyle(node).opacity}`,
          );
      })
      .toBe("block 1");
  });

  test("keeps typed code as typed, with no joined signs", async ({ page }) => {
    await page.goto("/ru/projects");
    await expect(page.locator('[data-frame="snippets"] .pj-lines')).toHaveCSS(
      "font-variant-ligatures",
      "none",
    );
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 664 } });

    test("a frame is a plain link", async ({ page }) => {
      await page.goto("/ru/projects");
      await page.locator('[data-frame="journal"]').click();
      await expect(page).toHaveURL(/\/ru\/projects\/portfolio#decisions$/);
    });
  });
});

test.describe("the project's page", () => {
  test("the outline and the inspector follow the section in view", async ({ page }) => {
    await page.goto("/ru/projects/portfolio");
    await page.locator("#gates").scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      document.getElementById("gates")?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await expect(page.locator('[data-goto="gates"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator('[data-inspect="gates"]')).toBeVisible();
  });

  test("the sample of themes takes the mode it is given", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/ru/projects/portfolio");
    const sample = page.locator(".pj-themes-sample");
    const before = await sample.evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.locator(".pj-themes-demo").getByRole("button", { name: "Тёмная" }).click();
    await expect
      .poll(() => sample.evaluate((node) => getComputedStyle(node).backgroundColor))
      .not.toBe(before);
    await expect(page.locator(".pj-themes-read")).toContainText(/\d,\d:1/);
  });

  test("the sample of themes wears each theme's skin whole, not the page's", async ({ page }) => {
    await page.goto("/ru/projects/portfolio");
    const action = page.locator(".pj-themes-sample .control-primary");
    const cap = () => action.evaluate((node) => getComputedStyle(node, "::before").backgroundColor);
    // On the Projects page the Projects' button has its cap: the home's has none.
    expect(await cap()).not.toBe("rgba(0, 0, 0, 0)");
    await page.locator(".pj-themes-demo").getByRole("button", { name: "Главная" }).click();
    await expect.poll(cap).toBe("rgba(0, 0, 0, 0)");
  });

  test("a release moves the link and a rollback returns it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ru/projects/portfolio");
    const live = page.locator(".pj-release-folders [data-live] span");
    const before = await live.textContent();
    await page.getByRole("button", { name: "Выкатить новый релиз" }).click();
    await expect(live).not.toHaveText(before ?? "");
    await page.getByRole("button", { name: "Откатить" }).click();
    await expect(live).toHaveText(before ?? "");
  });
});

test.describe("the LaTeX project's page", () => {
  test("types the line of the lecture and shows the last compile", async ({ page }) => {
    await page.goto("/ru/projects/latex");
    const demo = page.locator(".pj-tx");
    const replay = demo.locator(".pj-mini");
    // The finished line is in the HTML, so its last compile shows before the typing starts: wait
    // for the typing to start, then for it to end, or the check reads the page before the play.
    await demo.scrollIntoViewIfNeeded();
    await expect(replay).toBeDisabled();
    await expect(replay).toBeEnabled({ timeout: 20_000 });
    await expect(demo).toHaveAttribute("data-render-at", "2");
    await expect(page.locator(".pj-tx-code")).toContainText("m(E) = 0$.");
    await expect(page.locator('.pj-tx-render[data-render="2"]')).toBeVisible();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("shows the finished line and the last release", async ({ page }) => {
      await page.goto("/ru/projects/latex");
      await expect(page.locator(".pj-tx")).toHaveAttribute("data-render-at", "2");
      await expect(page.locator(".pj-walls-tag")).toHaveText("v2026.06.10");
      await expect(page.locator(".pj-thesis-code")).toBeHidden();
    });
  });

  test("the slider picks a release", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ru/projects/latex");
    const range = page.locator(".pj-walls-range");
    await range.fill("0");
    await expect(page.locator(".pj-walls-tag")).toHaveText("v2026.05.12");
    await expect(page.locator(".pj-walls-pages b")).toHaveText("3");
  });

  test("the lens shows the page's source under the pointer", async ({ page }) => {
    await page.goto("/ru/projects/latex");
    const paper = page.locator(".pj-thesis-paper");
    await paper.scrollIntoViewIfNeeded();
    const box = await paper.boundingBox();
    if (!box) throw new Error("no page");
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6, { steps: 4 });
    await expect
      .poll(() => page.locator(".pj-thesis-code").evaluate((node) => node.style.clipPath))
      .toMatch(/^circle\(/);
    await page.locator(".pj-thesis").getByRole("button", { name: "Поля" }).click();
    await expect(page.locator(".pj-thesis-fields")).toBeVisible();
  });
});

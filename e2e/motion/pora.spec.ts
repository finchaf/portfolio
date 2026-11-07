import { expect, test, type Page } from "@playwright/test";

// «Пора на пару»: the lessons' window, the pictures of its chapters and the viewer over them.

const ADDRESS = "/ru/poranaparu";

/**
 * Opens a lesson's window from its card and gives the window back. The first press may land before
 * the page listens: it is pressed until the window opens.
 */
async function openLesson(page: Page, lesson: string) {
  const window = page.locator(`#pora-window-${lesson}`);
  await expect(async () => {
    await page.locator(`.pora-card[data-lesson="${lesson}"]`).click();
    await expect(window).toBeVisible({ timeout: 500 });
  }).toPass();
  return window;
}

/** A point on the veil: left of the window, whose box keeps 3rem of room on each side. */
const VEIL = { x: 20, y: 360 } as const;

test.describe("the lessons' window", () => {
  test("stays open when a selection is let go over the veil, and a press on the veil shuts it", async ({
    page,
  }) => {
    await page.goto(ADDRESS);
    const window = await openLesson(page, "about");
    const dialog = page.locator(".pora-window");
    const lead = window.locator(".pora-window-lead");
    const box = await lead.boundingBox();
    if (!box) throw new Error("the lead has no box");
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(VEIL.x, VEIL.y, { steps: 8 });
    await page.mouse.up();
    await expect(dialog).not.toHaveAttribute("data-closing");
    await expect(window).toBeVisible();
    await page.mouse.click(VEIL.x, VEIL.y);
    await expect(window).toBeHidden();
  });
});

test.describe("a chapter's pictures", () => {
  test("are AVIF at their real size, and the viewer shows them so", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(ADDRESS);
    const window = await openLesson(page, "web");
    const picture = window.locator("[data-pora-picture]").first();
    const thumbnail = picture.locator("img").filter({ visible: true });
    await expect(thumbnail).toHaveAttribute("src", /\.avif$/);
    // Turbopack would give an AVIF 100 × 100: the site's Image puts the measured size back.
    await expect(thumbnail).toHaveAttribute("width", "2520");
    await expect(thumbnail).toHaveAttribute("height", "1575");
    await picture.click();
    const image = page.locator(".pora-viewer-image");
    await expect(image).toHaveAttribute("src", /\.avif$/);
    await expect(image).toHaveJSProperty("naturalWidth", 2520);
  });

  test("stay open in the viewer when a selection is let go beside the picture", async ({
    page,
  }) => {
    await page.goto(ADDRESS);
    const window = await openLesson(page, "web");
    await window.locator("[data-pora-picture]").first().click();
    const viewer = page.locator(".pora-viewer");
    await expect(viewer.locator(".pora-viewer-count")).toHaveText("1 из 3");
    const box = await viewer.locator(".pora-viewer-caption").boundingBox();
    if (!box) throw new Error("the caption has no box");
    // From the caption to the room left of the picture: the click lands on the viewer itself.
    await page.mouse.move(box.x + 5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(VEIL.x, VEIL.y / 2, { steps: 8 });
    await page.mouse.up();
    await expect(viewer).not.toHaveAttribute("data-leaving");
    await expect(viewer).toBeVisible();
    await page.mouse.click(VEIL.x, VEIL.y / 2);
    await expect(viewer).toBeHidden();
    await expect(window).toBeVisible();
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a chapter's picture does not shrink under a press", async ({ page }) => {
    await page.goto(ADDRESS);
    const window = await openLesson(page, "web");
    const picture = window.locator("[data-pora-picture]").first();
    await picture.hover();
    await page.mouse.down();
    await expect(picture).toHaveCSS("scale", "none");
    await expect(picture).toHaveCSS("translate", "none");
    await page.mouse.up();
  });
});

test.describe("in motion", () => {
  test("a chapter's picture gives way under a press", async ({ page }) => {
    await page.goto(ADDRESS);
    const window = await openLesson(page, "web");
    const picture = window.locator("[data-pora-picture]").first();
    await picture.hover();
    await page.mouse.down();
    await expect(picture).toHaveCSS("scale", "0.98");
    await page.mouse.up();
  });
});

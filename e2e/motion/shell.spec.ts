import { expect, test, type Page } from "@playwright/test";

import { HOME, jump, openWriteSheet, topOf } from "../helpers";

// What every page wears: the capsule, the dot cursor, the footer and the sheet of ways to write.

/** What a test leaves on the page's window to read back: none of it is the site's. */
type Probe = { seen?: Set<string> };

test.describe("the home page in motion", () => {
  test("wears the home skin on the home page and the theme's skin in its chapters", async ({
    page,
  }) => {
    await page.goto(HOME);
    await expect(page.getByRole("link", { name: "Смотреть работы", exact: true })).toHaveCSS(
      "border-top-left-radius",
      "0px",
    );
    await expect(page.locator(".control-primary").first()).toHaveCSS("font-family", /JetBrains/);
    const write = page.locator(".capsule-action");
    await expect(write).toHaveCSS("border-top-left-radius", "0px");
    await jump(page, await topOf(page, "#work-pora"));
    await expect(page.locator("[data-capsule]")).toHaveAttribute("data-tint", "pora");
    // The capsule of «Пора на пару» is the web schedule's sidebar: shadcn's `rounded-md`.
    await expect(write).toHaveCSS("border-top-left-radius", "8px");
    await jump(page, 0);
    await expect(write).toHaveCSS("border-top-left-radius", "0px");
  });

  test("lays the capsule's items on the page, and closes it around them when the page moves", async ({
    page,
  }) => {
    await page.goto(HOME);
    const surface = page.locator(".capsule-surface");
    await expect(surface).toHaveCSS("opacity", "0");
    await jump(page, 400);
    await expect(surface).toHaveCSS("opacity", "1");
    await jump(page, 0);
    await expect(surface).toHaveCSS("opacity", "0");
  });

  test("swaps the arrow for a dot only once a mouse moves", async ({ page }) => {
    await page.goto(HOME);
    const root = page.locator("html");
    const dot = page.locator(".dot-cursor");
    await expect(root).not.toHaveAttribute("data-pointer");
    await expect(page.locator("body")).toHaveCSS("cursor", "auto");
    // The page listens once it has woken up: a move before that is lost, as it is for a reader.
    await expect(async () => {
      await page.mouse.move(299, 300);
      await page.mouse.move(300, 300);
      await expect(root).toHaveAttribute("data-pointer", { timeout: 250 });
    }).toPass();
    await expect(page.locator("body")).toHaveCSS("cursor", "none");
    await expect(dot).toHaveCSS("transform", "matrix(1, 0, 0, 1, 300, 300)");
    await page.locator("[data-capsule]").getByRole("link", { name: "Написать" }).hover();
    await expect(dot).toHaveAttribute("data-over");
  });
});

test.describe("the language", () => {
  test("keeps the scenes and the reader's theme on the other side", async ({ page }) => {
    await page.goto(HOME);
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.reload();
    await page
      .locator("footer")
      .getByRole("link", { name: "English" })
      .evaluate((link: HTMLElement) => {
        link.click();
      });
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("data-js");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".hero-switch")).toBeVisible();
  });
});

test.describe("the shell", () => {
  test("carries the logo, the sections and the way to write in one capsule", async ({ page }) => {
    await page.goto(HOME);
    const capsule = page.locator("[data-capsule]");
    await expect(
      capsule.getByRole("link", { name: "Главная" }).locator("svg").first(),
    ).toBeVisible();
    await expect(capsule.getByRole("link", { name: "Написать" })).toHaveAttribute("href", /t\.me/);
  });

  test("keeps the theme, the language and the contacts in the footer", async ({ page }) => {
    await page.goto(HOME);
    const footer = page.locator("footer");
    await expect(footer.getByRole("radio", { name: "Тёмная" })).toBeAttached();
    await expect(footer.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en");
    await expect(footer.getByRole("link", { name: "Русский" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(footer.getByRole("link", { name: "Telegram" })).toBeAttached();
    // The address is on the screen whole, and the button beside it copies it.
    await expect(footer.getByRole("link", { name: "Почта" })).toContainText("work@finchaf.com");
    await expect(footer.getByRole("button", { name: "Скопировать" })).toBeAttached();
  });
});

test.describe("the sheet out of the capsule, without a script", () => {
  test.use({ javaScriptEnabled: false });

  test("stays a link to the chat, and the footer keeps the address", async ({ page }) => {
    await page.goto(HOME);
    const write = page.locator("[data-capsule] [data-write]");
    await expect(write).toHaveAttribute("href", /^https:\/\/t\.me\//);
    await expect(page.locator(".write-sheet")).toBeHidden();
    await expect(page.locator("footer").getByRole("link", { name: "Почта" })).toHaveAttribute(
      "href",
      /^mailto:/,
    );
  });
});

test.describe("the sheet out of the capsule", () => {
  const write = (page: Page) => page.locator("[data-capsule] [data-write]");

  test("shows both ways at once, and gives the key back with Escape", async ({ page }) => {
    await page.goto(HOME);
    const sheet = page.getByRole("dialog", { name: "Написать" });
    await expect(sheet).toBeHidden();
    await openWriteSheet(page, { by: "key" });
    await expect(sheet).toBeVisible();
    await expect(sheet).toBeFocused();
    await expect(write(page)).toHaveAttribute("aria-expanded", "true");
    await expect(sheet.getByRole("link", { name: "Открыть чат" })).toHaveAttribute(
      "href",
      /^https:\/\/t\.me\//,
    );
    await expect(sheet.getByRole("link", { name: "Написать письмо" })).toHaveAttribute(
      "href",
      /^mailto:/,
    );
    await expect(sheet.getByRole("img", { name: "QR-код чата в Telegram" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(write(page)).toBeFocused();
    await expect(write(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("shuts with a click elsewhere, which still does what it was for", async ({ page }) => {
    await page.goto(HOME);
    await openWriteSheet(page);
    await expect(page.locator(".write-sheet")).toBeVisible();
    await page.locator("[data-capsule] nav").getByRole("link", { name: "Флоу" }).click();
    await expect(page.locator(".write-sheet")).toBeHidden();
    await expect(page).toHaveURL(/\/ru\/flow$/);
  });

  test("shuts when a key leaves it", async ({ page }) => {
    await page.goto(HOME);
    await openWriteSheet(page);
    await page.locator(".write-sheet").getByRole("button", { name: "Скопировать" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(".write-sheet")).toBeHidden();
  });

  test("the button toggles it", async ({ page }) => {
    await page.goto(HOME);
    await openWriteSheet(page);
    await expect(page.locator(".write-sheet")).toBeVisible();
    await write(page).click();
    await expect(page.locator(".write-sheet")).toBeHidden();
  });

  test("is not needed at the last call: every way is open there", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(HOME);
    const call = page.locator("#contact");
    await expect(call.getByRole("link", { name: "Написать в Telegram @finchaf" })).toHaveAttribute(
      "href",
      /^https:\/\/t\.me\//,
    );
    await expect(call.getByRole("link", { name: /work@finchaf\.com/ })).toHaveAttribute(
      "href",
      /^mailto:/,
    );
    await jump(page, await topOf(page, "#contact"));
    await call.getByRole("button", { name: "Скопировать" }).click();
    await expect(call.getByRole("button", { name: "Скопировано" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("work@finchaf.com");
  });

  test("copies the address and says so", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(HOME);
    await openWriteSheet(page);
    const sheet = page.locator(".write-sheet");
    await sheet.getByRole("button", { name: "Скопировать" }).click();
    await expect(sheet.getByRole("button", { name: "Скопировано" })).toBeVisible();
    const address = await page.evaluate(() => navigator.clipboard.readText());
    await expect(sheet.getByRole("link", { name: address })).toHaveAttribute(
      "href",
      `mailto:${address}`,
    );
  });

  test("wears the theme the capsule wears", async ({ page }) => {
    await page.goto(HOME);
    await jump(page, await topOf(page, "#work-pora"));
    await expect(page.locator("[data-capsule]")).toHaveAttribute("data-tint", "pora");
    await openWriteSheet(page);
    const sheet = page.locator(".write-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.locator(".control-button").first()).toHaveCSS(
      "font-family",
      /Geist|ui-sans-serif/,
    );
  });

  test("shuts the lens while it is open", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    const radius = () =>
      page.locator(".hero").evaluate((hero) => parseFloat(hero.style.getPropertyValue("--lens-r")));
    await expect.poll(radius).toBeGreaterThan(100);
    await openWriteSheet(page);
    await expect(page.locator("html")).toHaveAttribute("data-writing");
    await expect.poll(radius).toBe(0);
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).not.toHaveAttribute("data-writing");
    await expect.poll(radius).toBeGreaterThan(100);
  });

  test("on a phone has no code to read, and stands above the capsule, whole", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(HOME);
    await openWriteSheet(page);
    const sheet = page.locator(".write-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.locator(".write-code")).toBeHidden();
    await expect(sheet).toBeInViewport({ ratio: 1 });
    const edges = await page.evaluate(() => ({
      sheet: document.querySelector(".write-sheet")?.getBoundingClientRect().bottom ?? 0,
      capsule: document.querySelector("[data-capsule]")?.getBoundingClientRect().top ?? 0,
    }));
    expect(edges.sheet).toBeLessThanOrEqual(edges.capsule);
  });
});

test.describe("the home page on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("leaves a phone its own pointer", async ({ page }) => {
    await page.goto(HOME);
    // The cursor listens from hydration, in the commit that marks the sheet's trigger: a tap before
    // that would pass for nothing.
    await expect(page.locator("[data-capsule] [data-write]")).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    await page.touchscreen.tap(200, 300);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expect(page.locator("html")).not.toHaveAttribute("data-pointer");
  });

  test("gives the logo the width it draws", async ({ page }) => {
    await page.goto(HOME);
    const link = page
      .getByRole("navigation", { name: "Разделы сайта" })
      .getByRole("link", { name: "Главная" });
    const box = await link.boundingBox();
    const drawing = await link.locator("svg:visible").boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(drawing?.width ?? Infinity);
  });

  test("moves the capsule to the bottom and fits the width", async ({ page }) => {
    await page.goto(HOME);
    const capsule = await page.locator("[data-capsule]").boundingBox();
    expect(capsule?.y).toBeGreaterThan(700);
    expect(capsule?.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await expect(
      page.locator("[data-capsule]").getByRole("link", { name: "Написать" }),
    ).toBeVisible();
  });

  test("fits the capsule's last item on the narrowest phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto(HOME);
    const capsule = await page.locator("[data-capsule]").boundingBox();
    const nav = page.getByRole("navigation", { name: "Разделы сайта" });
    expect(capsule?.width).toBeLessThanOrEqual(360);
    expect(await nav.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
      1,
    );
  });
});

test.describe("the capsule", () => {
  const geometry = (page: Page) =>
    page.evaluate(() => {
      const capsule = document.querySelector("[data-capsule]");
      return {
        width: capsule?.getBoundingClientRect().width,
        cells: [...(capsule?.querySelectorAll("nav a, [data-write]") ?? [])].map((cell) =>
          Math.round(cell.getBoundingClientRect().left * 10),
        ),
      };
    });

  for (const language of ["ru", "en"]) {
    test(`stands the same on every page, ${language}`, async ({ page }) => {
      const seen = [];
      for (const path of [
        "",
        "/poranaparu",
        "/flow",
        "/projects",
        "/projects/portfolio",
        "/projects/latex",
      ]) {
        await page.goto(`/${language}${path}`);
        await expect(page.locator("html")).not.toHaveAttribute("data-intro");
        await page.evaluate(() => document.fonts.ready);
        seen.push(await geometry(page));
      }
      expect(new Set(seen.map((each) => JSON.stringify(each))).size).toBe(1);
    });
  }

  test("does not stir between the board and a project", async ({ page }) => {
    await page.goto("/ru/projects");
    await expect(page.locator("[data-zoom-value]")).toHaveText(/\d+%/);
    await page.evaluate(() => {
      const seen = new Set<string>();
      Object.assign(window, { seen });
      const look = () => {
        const capsule = document.querySelector("[data-capsule]");
        const surface = capsule?.querySelector(".capsule-surface");
        if (capsule && surface) {
          const { opacity, scale } = getComputedStyle(surface);
          seen.add(`${String(capsule.getBoundingClientRect().width)} ${opacity} ${scale}`);
        }
        requestAnimationFrame(look);
      };
      look();
    });
    await page.locator(".pj-board-inspector[data-current] [data-open]").click();
    await expect(page).toHaveURL(/\/ru\/projects\/portfolio$/);
    await page.locator(".pj-back").click();
    await expect(page).toHaveURL(/\/ru\/projects$/);
    const seen = await page.evaluate(() => (window as Window & Probe).seen?.size);
    expect(seen).toBe(1);
  });

  test("plays nothing after the slash has gone", async ({ page }) => {
    await page.goto("/ru");
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await page.evaluate(() => {
      window.scrollTo({ top: 1400, behavior: "instant" });
    });
    await expect(page.locator("html")).toHaveAttribute("data-scrolled");
    await page.locator('[data-capsule] nav a[href$="/flow"]').click();
    await expect(page).toHaveURL(/\/ru\/flow$/);
    await expect(page.locator("html")).not.toHaveAttribute("data-scrolled");
    await expect(page.locator("html")).not.toHaveAttribute("data-page-change");
    const running = await page
      .locator("[data-capsule]")
      .evaluate((node) => node.getAnimations({ subtree: true }).length);
    expect(running).toBe(0);
  });

  test("keeps the logo legible in a chapter that fills the chosen cell", async ({ page }) => {
    await page.goto("/ru");
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await expect(async () => {
      await page.evaluate(() => {
        const chapter = document.querySelector("#work-projects");
        const top = (chapter?.getBoundingClientRect().top ?? 0) + window.scrollY + 500;
        window.scrollTo({ top, behavior: "instant" });
      });
      await expect(page.locator("[data-capsule]")).toHaveAttribute("data-tint", "projects", {
        timeout: 1000,
      });
    }).toPass();
    // The capsule's colours ease in, so the two are compared once they have settled.
    await expect
      .poll(() =>
        page.locator("[data-capsule] nav a[aria-current]").evaluate((node) => {
          const logo = node.querySelector(".fill-ink");
          return logo && getComputedStyle(logo).fill === getComputedStyle(node).color;
        }),
      )
      .toBe(true);
  });

  test("the board keeps the reader's dot, with no hand over it", async ({ page }) => {
    await page.goto("/ru/projects");
    await expect(page.locator("[data-zoom-value]")).toHaveText(/\d+%/);
    await page.mouse.move(640, 640);
    await expect(page.locator("html")).toHaveAttribute("data-pointer");
    await expect(page.locator(".pj-board-canvas")).toHaveCSS("cursor", "none");
  });

  test.describe("on the narrowest phone", () => {
    test.use({ viewport: { width: 320, height: 568 } });

    for (const language of ["ru", "en"]) {
      test(`fits with nothing to scroll, ${language}`, async ({ page }) => {
        await page.goto(`/${language}/projects`);
        const nav = page.locator("[data-capsule] nav");
        const fits = await nav.evaluate((node) => node.scrollWidth <= node.clientWidth);
        expect(fits).toBe(true);
      });
    }
  });
});

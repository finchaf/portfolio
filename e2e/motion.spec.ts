import { expect, test, type Page } from "@playwright/test";

import { ADDRESSES } from "./pages";

// The promise of ADR-0002: the page is in the HTML and never waits for animation.
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const address of ADDRESSES) {
    test(`${address} shows its heading and its links`, async ({ page }) => {
      await page.goto(address);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(4);
    });
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const address of ADDRESSES) {
    test(`${address} shows its heading`, async ({ page }) => {
      await page.goto(address);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

const jump = (page: Page, top: number) =>
  page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: "instant" });
  }, top);

const topOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

const HOME = "/ru";
const CHAPTERS = 8;
const STOPS = 8;
const PANELS = 6;

test.describe("the home page without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows every step, stop and panel, and no dead controls", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-chapter")).toHaveCount(CHAPTERS);
    for (const chapter of await page.locator(".story-chapter").all()) {
      await expect(chapter).toBeVisible();
    }
    await expect(page.locator(".story-ruler")).toBeHidden();
    await expect(page.locator(".stop")).toHaveCount(STOPS);
    for (const stop of await page.locator(".stop").all()) await expect(stop).toBeVisible();
    await expect(page.locator(".flow-panel")).toHaveCount(PANELS);
    await expect(page.locator(".hero-switch")).toBeHidden();
    await expect(page.locator("[data-hero-code]")).toBeHidden();
  });

  test("keeps each work in its theme", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("#work-flow")).toHaveCSS("font-family", /Inter Variable/);
  });
});

test.describe("the home page with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("does not assemble the first screen", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await expect(page.locator(".hero-status").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-copy").first()).toHaveCSS("animation-name", "none");
  });

  test("stays a plain page: nothing is pinned, nothing hidden", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-stage")).toHaveCSS("position", "relative");
    await expect(page.locator(".chapter-stage").first()).toHaveCSS("position", "static");
    await expect(page.locator(".story-quote > span").first()).toHaveCSS("opacity", "1");
    for (const chapter of await page.locator(".story-chapter").all()) {
      await expect(chapter).toBeVisible();
    }
    for (const stop of await page.locator(".stop").all()) await expect(stop).toBeVisible();
    await expect(page.locator(".hero-ring")).toBeHidden();
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
  const height = (page: Page) => page.evaluate(() => window.innerHeight);

  const lens = (page: Page, name: string) =>
    page.locator(".hero").evaluate((hero, variable) => {
      return parseFloat(hero.style.getPropertyValue(variable));
    }, name);

  test("moves the lens with the pointer and opens the whole source", async ({ page }) => {
    await page.goto(HOME);
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
      [".hero-switch fieldset", ".hero-switch-twin .hero-control"],
    ] as const) {
      expect(await box(code)).toEqual(await box(design));
    }
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
    expect(await centre(".hero-switch fieldset")).toBeCloseTo(capsule, 0);
    const right = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      return (box?.x ?? 0) + (box?.width ?? 0);
    };
    expect(await right(".hero-switch fieldset")).toBeCloseTo(await right(".hero-foot"), 0);
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

  test("assembles the first screen when a page opens, and only then", async ({ page }) => {
    await page.goto(HOME);
    const root = page.locator("html");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(root).not.toHaveAttribute("data-intro");
    await expect.poll(() => lens(page, "--lens-r")).toBeGreaterThan(0);
    await page.getByRole("navigation").getByRole("link", { name: "Флоу" }).click();
    await page.waitForURL("**/ru/flow");
    await page.getByRole("navigation").getByRole("link", { name: "Главная" }).click();
    await page.waitForURL(`**${HOME}`);
    await expect(root).not.toHaveAttribute("data-intro");
    await page.goto("/ru/flow");
    await expect(root).not.toHaveAttribute("data-intro");
  });

  test("swaps the arrow for a dot only once a mouse moves", async ({ page }) => {
    await page.goto(HOME);
    const root = page.locator("html");
    const dot = page.locator(".dot-cursor");
    await expect(root).not.toHaveAttribute("data-pointer");
    await expect(page.locator("body")).toHaveCSS("cursor", "auto");
    await page.mouse.move(300, 300);
    await expect(root).toHaveAttribute("data-pointer");
    await expect(page.locator("body")).toHaveCSS("cursor", "none");
    await expect(dot).toHaveCSS("transform", "matrix(1, 0, 0, 1, 300, 300)");
    await page.locator("[data-capsule]").getByRole("link", { name: "Написать" }).hover();
    await expect(dot).toHaveAttribute("data-over");
  });

  test("carries the story sideways with the scroll, and never widens the page", async ({
    page,
  }) => {
    await page.goto(HOME);
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    const viewport = await height(page);
    const last = page.locator(".story-chapter").last();
    const left = () => last.evaluate((node) => node.getBoundingClientRect().left);
    const right = () => last.evaluate((node) => node.getBoundingClientRect().right);
    const mark = page.locator("[data-story-mark][data-active]");
    const start = await left();
    await expect(mark).toHaveText("Школа");
    await jump(page, box.top + box.height - 2 * viewport);
    await expect.poll(right).toBeCloseTo(page.viewportSize()?.width ?? 0, 0);
    expect(await left()).toBeLessThan(start - 5000);
    await expect(mark).toHaveText("Сейчас");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });

  test("brings the story's lines in as they arrive, and keeps them", async ({ page }) => {
    await page.goto(HOME);
    const quote = page.locator(".story-omsk .story-quote > span");
    const bars = page.locator(".story-launch .story-chart");
    await expect(quote).toHaveCSS("opacity", "0");
    await expect(bars).not.toHaveAttribute("data-seen");
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    await jump(page, box.top + box.height - 2 * (await height(page)));
    await expect(quote).toHaveCSS("opacity", "1");
    await expect(bars).toHaveAttribute("data-seen");
    await jump(page, box.top);
    await expect(quote).toHaveCSS("opacity", "1");
  });

  test("meets the first screen on one background, and turns to paper once the story holds", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(HOME);
    const paper = page.locator(".story-paper");
    const top = await topOf(page, "#story");
    await expect(page.locator(".story-stage")).toHaveCSS("background-color", "rgb(238, 241, 244)");
    await expect(page.locator(".hero")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await jump(page, top - 10);
    await expect(paper).toHaveCSS("opacity", "0");
    await jump(page, top + (await height(page)));
    await expect(paper).toHaveCSS("opacity", "1");
    await expect(page.locator(".story-ruler")).toHaveCSS("opacity", "1");
  });

  test("stands the ruler on the bottom edge of a wide screen", async ({ page }) => {
    await page.goto(HOME);
    await jump(page, (await topOf(page, "#story")) + (await height(page)));
    await expect(page.locator(".story-ruler")).toHaveCSS("opacity", "1");
    const ruler = await page.locator(".story-ruler").boundingBox();
    expect((ruler?.y ?? 0) + (ruler?.height ?? 0)).toBeCloseTo(await height(page), 0);
  });

  test("lets the grain run over the whole page and take no pointer", async ({ page }) => {
    await page.goto(HOME);
    const grain = page.locator(".home-grain");
    await expect(grain).toHaveCSS("position", "fixed");
    await expect(grain).toHaveCSS("pointer-events", "none");
    await expect(grain).toHaveCSS("animation-name", "home-grain");
  });

  test("draws the ruler again as the ticks pass the needle", async ({ page }) => {
    await page.goto(HOME);
    const picture = () =>
      page.locator("[data-story-canvas]").evaluate((node: HTMLCanvasElement) => node.toDataURL());
    const top = await topOf(page, "#story");
    await jump(page, top + (await height(page)));
    await expect.poll(picture).not.toBe("data:,");
    const first = await picture();
    await jump(page, top + 3 * (await height(page)));
    await expect.poll(picture).not.toBe(first);
  });

  for (const [width, viewport] of [
    [1280, 720],
    [1440, 900],
    [1470, 679],
    [1900, 1266],
    [2560, 1440],
  ] as const) {
    for (const locale of ["ru", "en"]) {
      test(`fits every chapter on ${String(width)}×${String(viewport)}, ${locale}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: viewport });
        await page.goto(`/${locale}`);
        // Offsets, not boxes: a line that drifts or a print that lies at an angle is not out of place.
        // A chapter keeps clear of the capsule above it and the ruler below.
        const misfits = await page.locator("#story").evaluate((story) => {
          const ruler = story.querySelector<HTMLElement>(".story-ruler")?.offsetHeight ?? 0;
          const floor = window.innerHeight - ruler;
          return [...story.querySelectorAll<HTMLElement>(".story-col")].flatMap((column) =>
            [...column.querySelectorAll<HTMLElement>(":scope > *")].flatMap((child) => {
              const tooWide =
                child.offsetWidth > column.offsetWidth ||
                [...child.querySelectorAll<HTMLElement>(".story-date")].some(
                  (date) => date.scrollWidth > column.clientWidth,
                );
              const tooHigh = child.offsetTop < 72;
              const tooLow = child.offsetTop + child.offsetHeight > floor;
              return tooWide || tooHigh || tooLow ? [child.textContent.slice(0, 32)] : [];
            }),
          );
        });
        expect(misfits).toEqual([]);
      });
    }
  }

  test("keeps the night dark in a light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(HOME);
    await expect(page.locator(".story-night")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator(".story-night")).toHaveCSS("background-color", "rgb(20, 27, 34)");
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
      await expect(page.locator("html")).toHaveAttribute("data-scene", world);
    }
    await jump(page, 0);
    await expect(capsule).not.toHaveAttribute("data-tint");
    await expect(page.locator("html")).not.toHaveAttribute("data-scene");
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

  test("slides Flow sideways and hands over to Projects from the right", async ({ page }) => {
    await page.goto(HOME);
    const track = page.locator("[data-track]");
    const left = () => track.evaluate((node) => node.getBoundingClientRect().left);
    const stage = page.locator("#work-projects [data-stage]");
    const stageLeft = () => stage.evaluate((node) => node.getBoundingClientRect().left);
    const flow = await topOf(page, "#work-flow");
    const projects = await topOf(page, "#work-projects");
    await jump(page, flow);
    const start = await left();
    await jump(page, projects - 10);
    await expect.poll(left).toBeLessThan(start - 1000);
    expect(await stageLeft()).toBeGreaterThan(1000);
    await jump(page, projects + (await height(page)));
    await expect.poll(stageLeft).toBeCloseTo(0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });

  test("keeps the way to the product's page through a chapter", async ({ page }) => {
    await page.goto(HOME);
    const link = page.locator("#work-pora .chapter-bar").getByRole("link", { name: /Открыть/ });
    const top = await topOf(page, "#work-pora");
    for (const stop of [0, 2, 3]) {
      await jump(page, top + stop * 0.9 * (await height(page)) + 100);
      await expect(link).toBeInViewport();
    }
    await expect(link).toHaveAttribute("href", "/ru/pora-na-paru");
  });

  test("brings a stop to the keyboard and runs the week's rule", async ({ page }) => {
    await page.goto(HOME);
    const lesson = page.getByRole("button", { name: "Перенести пару: Код" });
    await lesson.focus();
    await expect(lesson.locator("xpath=ancestor::li[@data-stop]")).toHaveAttribute("data-active");
    const status = page.locator("#work-pora").getByText(/Конфликт/);
    for (let press = 0; press < 20 && !(await status.isVisible()); press += 1) {
      await lesson.click();
    }
    await expect(status).toBeVisible();
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
    await expect(footer.getByRole("link", { name: "Telegram" })).toBeAttached();
  });
});

test.describe("the home page on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("leaves a phone its own pointer", async ({ page }) => {
    await page.goto(HOME);
    await page.touchscreen.tap(200, 300);
    await expect(page.locator("html")).not.toHaveAttribute("data-pointer");
  });

  test("gives the logo the width it draws", async ({ page }) => {
    await page.goto(HOME);
    const link = page.getByRole("navigation").getByRole("link", { name: "Главная" });
    const box = await link.boundingBox();
    const drawing = await link.locator("svg:visible").boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(drawing?.width ?? Infinity);
  });

  test("keeps the story a column that comes up as it is read", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-stage")).toHaveCSS("position", "relative");
    await expect(page.locator(".story-ruler")).toHaveCSS("position", "sticky");
    const quote = page.locator(".story-launch .story-quote > span");
    await expect(quote).toHaveCSS("opacity", "0");
    await jump(page, await topOf(page, ".story-launch"));
    await expect(quote).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-story-mark][data-active]")).toHaveText("1 сентября 2025");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
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
    const nav = page.getByRole("navigation");
    expect(capsule?.width).toBeLessThanOrEqual(360);
    expect(await nav.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
      1,
    );
  });
});

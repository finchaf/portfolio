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
const CHAPTERS = 9;
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
    await expect(page.locator(".story-menu")).toHaveCount(47);
    await expect(page.locator(".story-photo img").first()).toHaveAttribute("loading", "lazy");
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
    await expect(page.locator(".story-quote > span > span")).toHaveCount(0);
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
    await expect(write).toHaveCSS("border-top-left-radius", "999px");
    await jump(page, 0);
    await expect(write).toHaveCSS("border-top-left-radius", "0px");
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

  test("deals the frames of the file out of one stack, with one picture for all", async ({
    page,
  }) => {
    const pictures: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("menus")) pictures.push(response.url());
    });
    await page.goto(HOME);
    const last = page.locator('[data-menu="47"]');
    const first = page.locator('[data-menu="1"]');
    const left = (node: typeof last) => node.evaluate((frame) => frame.getBoundingClientRect().top);
    expect(Math.abs((await left(last)) - (await left(first)))).toBeLessThan(2);
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    await jump(page, box.top + box.height - 2 * (await height(page)));
    await expect.poll(async () => (await left(last)) - (await left(first))).toBeGreaterThan(200);
    expect(new Set(pictures).size).toBe(1);
  });

  test("asks for the pictures only when the story is near", async ({ page }) => {
    const photos: string[] = [];
    page.on("response", (response) => {
      if (response.url().endsWith(".webp")) photos.push(response.url());
    });
    await page.goto(HOME);
    await page.waitForLoadState("networkidle");
    // A browser takes what is close on its own; the far end of the ribbon must wait.
    expect(photos.filter((url) => /sunset|plane|msu/.test(url))).toEqual([]);
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    await jump(page, box.top + box.height - 2 * (await height(page)));
    await expect.poll(() => photos.some((url) => url.includes("sunset"))).toBe(true);
  });

  test("moves the large lines one by one, and they read straight where they meet", async ({
    page,
  }) => {
    await page.goto(HOME);
    const lines = page.locator(".story-rent .story-quote [data-reveal] > span");
    await expect.poll(() => lines.count()).toBeGreaterThan(1);
    // Where the eye finds a line: a computed transform says nothing about an inline box.
    const lefts = () =>
      lines.evaluateAll((all) => all.map((line) => line.getBoundingClientRect().left));
    const apart = async () => {
      const [first = 0, second = 0] = await lefts();
      return Math.abs(first - second);
    };
    await expect.poll(apart).toBeGreaterThan(40);
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      span:
        node.getBoundingClientRect().height -
        (2 + parseFloat(node.style.getPropertyValue("--hold"))) * window.innerHeight,
    }));
    const distance = await page
      .locator("[data-story-track]")
      .evaluate((node) => node.scrollWidth - window.innerWidth);
    const middle = await page.locator(".story-rent .story-quote").evaluate((node) => {
      const place = node.getBoundingClientRect();
      return place.left + place.width / 2 - window.innerWidth / 2;
    });
    await jump(page, box.top + (box.span * middle) / distance);
    await expect.poll(apart).toBeLessThan(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });

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

  test("deals the opening's photographs out of one pile", async ({ page }) => {
    await page.goto(HOME);
    // Centres, since the photographs differ in width; each also keeps its own depth around the pile.
    const spread = () =>
      page.locator("[data-scrap]").evaluateAll((all) => {
        const centres = all.map((scrap) => {
          const { left, width } = scrap.getBoundingClientRect();
          return left + width / 2;
        });
        return Math.max(...centres) - Math.min(...centres);
      });
    await expect(page.locator("[data-scrap]")).toHaveCount(9);
    await expect.poll(spread).toBeLessThan(320);
    await jump(page, (await topOf(page, "#story")) + 0.2 * (await height(page)));
    await expect.poll(spread).toBeGreaterThan(700);
  });

  test("keeps the opening's pile together until the story is nearly there", async ({ page }) => {
    await page.goto(HOME);
    const top = await topOf(page, "#story");
    const offset = () =>
      page
        .locator("[data-scrap]")
        .first()
        .evaluate((scrap) => new DOMMatrix(getComputedStyle(scrap).transform).m41);
    const pile = await offset();
    await jump(page, top - 0.7 * (await height(page)));
    await expect.poll(offset).toBeCloseTo(pile, 0);
  });

  test("clears the screen over the run of photographs, and gives it back", async ({ page }) => {
    await page.goto(HOME);
    const root = page.locator("html");
    const capsule = page.locator("[data-capsule]");
    const canvas = page.locator("[data-story-canvas]");
    const { top, span } = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      span:
        node.getBoundingClientRect().height -
        (2 + parseFloat(node.style.getPropertyValue("--hold"))) * window.innerHeight,
    }));
    const distance = await page
      .locator("[data-story-track]")
      .evaluate((node) => node.scrollWidth - window.innerWidth);
    const run = await page.locator("[data-bare-run]").evaluate((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, width: box.width };
    });
    const at = (x: number) => top + (span * (run.left + x)) / distance;
    await jump(page, at(run.width / 2 - 720));
    await expect(root).toHaveAttribute("data-bare");
    await expect(capsule).toHaveCSS("opacity", "0");
    await expect(canvas).toHaveCSS("opacity", "0");
    await page.keyboard.press("Tab");
    await expect(capsule).toHaveCSS("opacity", "1");
    await page.locator("body").evaluate(() => {
      (document.activeElement as HTMLElement).blur();
    });
    await jump(page, at(run.width + 400));
    await expect(root).not.toHaveAttribute("data-bare");
    await expect(capsule).toHaveCSS("opacity", "1");
    await jump(page, at(run.width / 2 - 720));
    await expect(root).toHaveAttribute("data-bare");
    await jump(page, at(-1200));
    await expect(root).not.toHaveAttribute("data-bare");
  });

  test("casts no shadow in the dark, and keeps it in the light", async ({ page }) => {
    const none = "rgba(0, 0, 0, 0)";
    const shadows = () =>
      page.evaluate(() =>
        [".chapter-stage", ".capsule-surface"].map(
          (selector) => getComputedStyle(document.querySelector(selector) as Element).boxShadow,
        ),
      );
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(HOME);
    for (const shadow of await shadows()) expect(shadow).toContain(none);
    await page.emulateMedia({ colorScheme: "light" });
    for (const shadow of await shadows()) expect(shadow).not.toContain(none);
  });

  test("counts the launch's numbers up to what the HTML says", async ({ page }) => {
    await page.goto(HOME);
    const number = page.locator(".story-funnel [data-count='632']");
    await expect(number).toHaveText("0");
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    await jump(page, box.top + box.height - 2 * (await height(page)));
    await expect(number).toHaveText("632");
  });

  test("grows one trunk from the left and branches off it, every line the same weight", async ({
    page,
  }) => {
    await page.goto(HOME);
    const drawn = (line: string) =>
      page.locator(`[data-line="${line}"]`).evaluate((node) => {
        const path = node as SVGPathElement;
        return 1 - parseFloat(getComputedStyle(path).strokeDashoffset) / path.getTotalLength();
      });
    const { end, hold } = await page.locator("#story").evaluate((node) => {
      const hold = parseFloat(node.style.getPropertyValue("--hold")) * window.innerHeight;
      const top = node.getBoundingClientRect().top + window.scrollY;
      return { end: top + node.getBoundingClientRect().height - 2 * window.innerHeight, hold };
    });
    await jump(page, end - hold - 40);
    await expect.poll(() => drawn("trunk")).toBeLessThan(0.02);
    await expect(page.locator('[data-branch="first"]')).toHaveCSS("opacity", "0");
    await jump(page, end - hold * 0.75);
    await expect.poll(() => drawn("trunk")).toBeGreaterThan(0.2);
    expect(await drawn("next")).toBeLessThan(0.05);
    await jump(page, end);
    for (const line of ["trunk", "first", "masters", "next"]) {
      await expect.poll(() => drawn(line)).toBeGreaterThan(0.99);
    }
    await expect(page.locator('[data-branch="first"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-branch="first"] code')).toHaveText(/^[a-z]+$/);
    const weights = await page
      .locator("[data-line]")
      .evaluateAll((all) => all.map((path) => getComputedStyle(path).strokeWidth));
    expect(new Set(weights).size).toBe(1);
  });

  test("brings the last chapter's lines to rest straight", async ({ page }) => {
    await page.goto(HOME);
    const lefts = () =>
      page
        .locator(".story-now .story-quote [data-reveal] > span")
        .evaluateAll((all) => all.map((line) => Math.round(line.getBoundingClientRect().left)));
    await expect.poll(async () => (await lefts()).length).toBeGreaterThan(1);
    const box = await page.locator("#story").evaluate((node) => ({
      top: node.getBoundingClientRect().top + window.scrollY,
      height: node.getBoundingClientRect().height,
    }));
    await jump(page, box.top + box.height - 2 * (await height(page)));
    await expect.poll(async () => new Set(await lefts()).size).toBe(1);
  });

  test("keeps lines going opposite ways inside their column", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-rent .story-col")).toHaveCSS("overflow-x", "clip");
    await expect(page.locator("#experience-title > span")).not.toHaveCount(0);
  });

  test("lays the photographs on the page with nothing around them", async ({ page }) => {
    await page.goto(HOME);
    const print = page.locator(".story-print").first();
    await expect(print).toHaveCSS("box-shadow", "none");
    await expect(print).toHaveCSS("padding-top", "0px");
    await expect(print).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
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

  test("keeps the grain to the story, arriving with the paper and taking no pointer", async ({
    page,
  }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-grain")).toHaveCount(1);
    const grain = page.locator("#story .story-grain");
    await expect(grain).toHaveCSS("opacity", "0");
    await expect(grain).toHaveCSS("pointer-events", "none");
    const animation = await grain.evaluate(
      (node) => getComputedStyle(node, "::before").animationName,
    );
    expect(animation).toBe("story-grain");
    await jump(page, (await topOf(page, "#story")) + (await height(page)));
    await expect(grain).toHaveCSS("opacity", "1");
  });

  test("gives the white hairlines of the layers a ground in the light only", async ({ page }) => {
    await page.goto(HOME);
    const layers = page.locator(".story-build .story-col-middle .story-image");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(layers).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(layers).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test("lays one print of the notes over the corner of the other", async ({ page }) => {
    await page.goto(HOME);
    const parts = await page
      .locator(".story-stack > .story-photo")
      .evaluateAll((nodes: HTMLElement[]) =>
        nodes.map((node) => ({
          left: node.offsetLeft,
          top: node.offsetTop,
          right: node.offsetLeft + node.offsetWidth,
          bottom: node.offsetTop + node.offsetHeight,
        })),
      );
    expect(parts).toHaveLength(2);
    const [under, over] = parts;
    expect(over?.left).toBeLessThan(under?.right ?? 0);
    expect(over?.top).toBeLessThan(under?.bottom ?? 0);
    expect(over?.right).toBeGreaterThan(under?.right ?? 0);
    expect(over?.bottom).toBeGreaterThan(under?.bottom ?? 0);
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
              // A range measures the text: a line that drifts is moved, not wider.
              const textWidth = (node: Element) => {
                const range = document.createRange();
                range.selectNodeContents(node);
                return range.getBoundingClientRect().width;
              };
              const tooWide =
                child.offsetWidth > column.offsetWidth ||
                [...child.querySelectorAll(".story-date > span")].some(
                  (line) => textWidth(line) > column.clientWidth,
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

  test("shows the end of the story before the works rise over it", async ({ page }) => {
    await page.goto(HOME);
    const bottom = await page
      .locator("[data-branch-list]")
      .evaluate((node) => node.getBoundingClientRect().bottom + window.scrollY);
    const works = await topOf(page, "#work-pora");
    expect(bottom).toBeLessThanOrEqual(works + 1);
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

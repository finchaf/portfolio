import { expect, test, type Page } from "@playwright/test";

import { expectNoSideScroll, height, HOME, jump, openWriteSheet, topOf } from "../helpers";

// The story: the ribbon, its photographs and lines, the ruler and the fork.

test.describe("the fork's score without a running scene", () => {
  test.use({ javaScriptEnabled: false });

  test("stands finished in the HTML", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-score-still")).toBeVisible();
    await expect(page.locator(".story-score-still rect").first()).toBeAttached();
    await expect(page.locator("[data-score-canvas]")).toBeHidden();
  });
});

test.describe("the home page in motion", () => {
  /**
   * Where the story stands on the page: its top, the scroll that brings its last chapter in, the
   * hold before the ribbon moves, the scroll that carries it, and how far it goes sideways.
   */
  const storyGeometry = (page: Page) =>
    page.locator("#story").evaluate((story: HTMLElement) => {
      const box = story.getBoundingClientRect();
      const top = box.top + window.scrollY;
      const end = top + box.height - 2 * window.innerHeight;
      const hold = parseFloat(story.style.getPropertyValue("--hold")) * window.innerHeight;
      const track = story.querySelector("[data-story-track]");
      return {
        top,
        end,
        hold,
        span: end - top - hold,
        distance: (track?.scrollWidth ?? 0) - window.innerWidth,
      };
    });

  /** The scroll at which the ribbon has moved `x` pixels to the left. */
  const scrollForTrackX = (story: Awaited<ReturnType<typeof storyGeometry>>, x: number) =>
    story.top + (story.span * x) / story.distance;

  /** Brings the story's last chapter in, and gives back where the story stands. */
  const storyEnd = async (page: Page) => {
    const story = await storyGeometry(page);
    await jump(page, story.end);
    return story;
  };

  test("carries the story sideways with the scroll, and never widens the page", async ({
    page,
  }) => {
    await page.goto(HOME);
    const last = page.locator(".story-chapter").last();
    const left = () => last.evaluate((node) => node.getBoundingClientRect().left);
    const right = () => last.evaluate((node) => node.getBoundingClientRect().right);
    const mark = page.locator("[data-story-mark][data-active]");
    const start = await left();
    await expect(mark).toHaveText("Школа");
    await storyEnd(page);
    await expect.poll(right).toBeCloseTo(page.viewportSize()?.width ?? 0, 0);
    expect(await left()).toBeLessThan(start - 5000);
    await expect(mark).toHaveText("Сейчас");
    await expectNoSideScroll(page);
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
    const top = (node: typeof last) => node.evaluate((frame) => frame.getBoundingClientRect().top);
    expect(Math.abs((await top(last)) - (await top(first)))).toBeLessThan(2);
    await storyEnd(page);
    await expect.poll(async () => (await top(last)) - (await top(first))).toBeGreaterThan(200);
    expect(new Set(pictures).size).toBe(1);
  });

  test("asks for the pictures only when the story is near", async ({ page }) => {
    const photos: string[] = [];
    page.on("response", (response) => {
      if (/\.(?:avif|webp)$/.test(response.url())) photos.push(response.url());
    });
    await page.goto(HOME);
    await page.waitForLoadState("networkidle");
    // A browser takes what is close on its own; the far end of the ribbon must wait.
    expect(photos.filter((url) => /moscow-window|plane|msu/.test(url))).toEqual([]);
    await storyEnd(page);
    await expect.poll(() => photos.some((url) => url.includes("moscow-window"))).toBe(true);
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
    const story = await storyGeometry(page);
    const middle = await page.locator(".story-rent .story-quote").evaluate((node) => {
      const place = node.getBoundingClientRect();
      return place.left + place.width / 2 - window.innerWidth / 2;
    });
    await jump(page, scrollForTrackX(story, middle));
    await expect.poll(apart).toBeLessThan(12);
    await expectNoSideScroll(page);
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
    await expect(page.locator("[data-scrap]")).toHaveCount(5);
    await expect.poll(spread).toBeLessThan(320);
    await jump(page, (await topOf(page, "#story")) + 0.2 * (await height(page)));
    await expect.poll(spread).toBeGreaterThan(500);
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
    const story = await storyGeometry(page);
    const run = await page.locator("[data-bare-run]").evaluate((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, width: box.width };
    });
    const at = (x: number) => scrollForTrackX(story, run.left + x);
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

  test("counts the launch's numbers up to what the HTML says", async ({ page }) => {
    await page.goto(HOME);
    const number = page.locator(".story-funnel [data-count='632']");
    await expect(number).toHaveText("0");
    await storyEnd(page);
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
    const { end, hold } = await storyGeometry(page);
    await jump(page, end - hold - 40);
    await expect.poll(() => drawn("trunk")).toBeLessThan(0.02);
    await expect(page.locator('[data-branch="open"]')).toHaveCSS("opacity", "0");
    await jump(page, end - hold * 0.75);
    await expect.poll(() => drawn("trunk")).toBeGreaterThan(0.2);
    expect(await drawn("next")).toBeLessThan(0.05);
    await jump(page, end);
    for (const line of ["trunk", "open", "masters", "next"]) {
      await expect.poll(() => drawn(line)).toBeGreaterThan(0.99);
    }
    await expect(page.locator('[data-branch="open"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-branch="open"] code')).toHaveText(/^[a-z]+$/);
    const weights = await page
      .locator(".story-line")
      .evaluateAll((all) => all.map((path) => getComputedStyle(path).strokeWidth));
    expect(new Set(weights).size).toBe(1);
  });

  test("ends the story on a dashed line, with the way to write at its end", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator('[data-shape="open"]')).toHaveCSS("stroke-dasharray", /^9/);
    await storyEnd(page);
    await expect(page.locator('[data-node="tip-open"]')).toHaveAttribute("visibility", "visible");
    const write = page.locator('[data-branch="open"] [data-write]');
    const sizes = await write.evaluate((node) => ({
      button: node.getBoundingClientRect().width,
      words: node.parentElement?.getBoundingClientRect().width ?? 0,
    }));
    expect(sizes.button).toBeLessThan(sizes.words / 2);
    await openWriteSheet(page, { trigger: write });
    await expect(page.locator(".write-sheet")).toBeVisible();
  });

  test("brings the pen to the way to write when the keyboard reaches it", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator("#story")).toHaveAttribute("data-live", "");
    const write = page.locator('[data-branch="open"] [data-write]');
    await expect(write).not.toBeInViewport();
    const { end, hold } = await storyGeometry(page);
    // A key first, so that the focus that follows is the keyboard's.
    await page.keyboard.press("Tab");
    await write.focus();
    const scroll = () => page.evaluate(() => window.scrollY);
    await expect.poll(scroll).toBeGreaterThan(end - hold);
    expect(await scroll()).toBeLessThan(end);
    await expect(page.locator('[data-branch="open"]')).toHaveCSS("opacity", "1");
    await expect(write).toBeInViewport();
  });

  test("brings the last chapter's lines to rest straight", async ({ page }) => {
    await page.goto(HOME);
    const lefts = () =>
      page
        .locator(".story-now .story-quote [data-reveal] > span")
        .evaluateAll((all) => all.map((line) => Math.round(line.getBoundingClientRect().left)));
    await expect.poll(async () => (await lefts()).length).toBeGreaterThan(1);
    await storyEnd(page);
    await expect.poll(async () => new Set(await lefts()).size).toBe(1);
  });

  test("keeps lines going opposite ways inside their column", async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator(".story-rent .story-col")).toHaveCSS("clip-path", /^inset/);
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
    const story = await storyEnd(page);
    await expect(quote).toHaveCSS("opacity", "1");
    await expect(bars).toHaveAttribute("data-seen");
    await jump(page, story.top);
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

  test("stands the fork still while its score combs out, and lets the lines be plucked", async ({
    page,
  }) => {
    await page.goto(HOME);
    const stay = page.locator("[data-stay]");
    const canvas = page.locator("[data-score-canvas]");
    const story = await storyGeometry(page);
    // Where the fork stands on the ribbon, and how far the ribbon moves while it fills the screen.
    const fork = await page
      .locator("#story .story-fork")
      .first()
      .evaluate((chapter: HTMLElement) => {
        const track = document.querySelector("#story [data-story-track]");
        return {
          left: chapter.getBoundingClientRect().left - (track?.getBoundingClientRect().left ?? 0),
          room: chapter.offsetWidth - window.innerWidth,
        };
      });
    const along = (share: number) => scrollForTrackX(story, fork.left + fork.room * share);
    // Plus zero: a stay a fraction of a pixel left of the edge rounds to minus zero.
    const left = () => stay.evaluate((node) => Math.round(node.getBoundingClientRect().left) + 0);
    const picture = () => canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL());

    await jump(page, along(0.1));
    await expect.poll(left).toBe(0);
    const early = await picture();
    await jump(page, along(0.8));
    await expect.poll(left).toBe(0);
    await expect.poll(picture).not.toBe(early);

    const settled = await picture();
    const box = await canvas.boundingBox();
    await page.mouse.move((box?.x ?? 0) + 200, (box?.y ?? 0) + 200);
    await page.mouse.move((box?.x ?? 0) + 240, (box?.y ?? 0) + 220);
    await expect.poll(picture).not.toBe(settled);
  });

  test("lays the launch's print across the band's edge, clear of its sheet", async ({ page }) => {
    await page.goto(HOME);
    const edges = await page.locator(".story-launch").evaluate((chapter) => {
      const right = (selector: string) => chapter.querySelector(selector)?.getBoundingClientRect();
      const caption = document.createRange();
      caption.selectNodeContents(chapter.querySelector(".story-caption") ?? chapter);
      return {
        print: right(".story-photo")?.right ?? 0,
        caption: caption.getBoundingClientRect().right,
        band: right(".story-spot")?.left ?? 0,
        sheet: right(".story-sheet")?.left ?? 0,
      };
    });
    expect(edges.print - edges.band).toBeGreaterThan(30);
    expect(edges.print).toBeLessThan(edges.sheet);
    expect(edges.caption).toBeLessThan(edges.band);
  });

  test("hangs the layers on the page with no ground, in either mode", async ({ page }) => {
    await page.goto(HOME);
    const layers = page.locator(".story-pair .story-image").first();
    for (const colorScheme of ["dark", "light"] as const) {
      await page.emulateMedia({ colorScheme });
      await expect(layers).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
  });

  test("lays the window of the icon over the corner of the layers", async ({ page }) => {
    await page.goto(HOME);
    const parts = await page
      .locator(".story-pair > .story-photo")
      .evaluateAll((nodes: HTMLElement[]) =>
        nodes.map((node) => ({
          left: node.offsetLeft,
          top: node.offsetTop,
          right: node.offsetLeft + node.offsetWidth,
          bottom: node.offsetTop + node.offsetHeight,
        })),
      );
    expect(parts).toHaveLength(2);
    const [layers, icon] = parts;
    expect(icon?.left).toBeLessThan(layers?.right ?? 0);
    expect(icon?.top).toBeLessThan(layers?.bottom ?? 0);
    expect(icon?.right).toBeGreaterThan(layers?.right ?? 0);
    expect(icon?.bottom).toBeGreaterThan(layers?.bottom ?? 0);
    const window = page.locator(".story-pair > .story-photo").last();
    await expect(window.locator(".story-image")).toHaveCSS("border-radius", "0px");
    await expect(window.locator(".story-print")).toHaveCSS("box-shadow", "none");
  });

  test("lays the hall on the sill of the view", async ({ page }) => {
    await page.goto(HOME);
    const parts = await page
      .locator(".story-moscow .story-stack > .story-photo")
      .evaluateAll((nodes: HTMLElement[]) =>
        nodes.map((node) => ({
          left: node.offsetLeft,
          top: node.offsetTop,
          height: node.offsetHeight,
          right: node.offsetLeft + node.offsetWidth,
        })),
      );
    expect(parts).toHaveLength(2);
    const [view, hall] = parts;
    expect(hall?.left).toBeLessThan(view?.right ?? 0);
    expect(hall?.right).toBeGreaterThan(view?.right ?? 0);
    // The museum stands at the middle of the view: the hall stays below it.
    expect(hall?.top).toBeGreaterThan((view?.top ?? 0) + (view?.height ?? 0) / 2);
  });

  test("lays one print of the notes over the corner of the other", async ({ page }) => {
    await page.goto(HOME);
    const parts = await page
      .locator(".story-university .story-stack > .story-photo")
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
});

test.describe("the story's ruler on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps its own colours over the bands, and leaves the photographs alone", async ({
    page,
  }) => {
    await page.goto(HOME);
    const marks = page.locator("[data-story-marks]");
    await jump(page, await topOf(page, ".story-launch .story-sheet"));
    await expect(page.locator("[data-story-mark][data-active]")).toBeAttached();
    await expect(marks).not.toHaveCSS("color", "rgb(255, 255, 255)");
    await jump(page, await topOf(page, "[data-bare-run]"));
    await expect(page.locator("html")).toHaveAttribute("data-bare");
    await expect(page.locator(".story-ruler")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });
});

test.describe("the home page on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

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
});

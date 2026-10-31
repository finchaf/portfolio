import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CHAPTERS, LAUNCH_DOWNLOADS, MENUS, SPANS, SPRITE } from "./story-data";

function launchSummary(locale: string): string {
  const path = join(process.cwd(), "messages", locale, "home.json");
  const catalog = JSON.parse(readFileSync(path, "utf8")) as {
    story: { launch: { chartSummary: string } };
  };
  return catalog.story.launch.chartSummary;
}

describe("the launch's numbers", () => {
  const [first, second, third] = LAUNCH_DOWNLOADS;

  it.each(["ru", "en"])("say in %s what the chart draws", (locale) => {
    const summary = launchSummary(locale);
    expect(summary).toContain(String(first + second + third));
    expect(summary).toContain(String(second));
  });

  it("peak on the second day", () => {
    expect(Math.max(...LAUNCH_DOWNLOADS)).toBe(second);
  });
});

describe("the file of menus", () => {
  it("holds every frame once, and the picture has a cell for each", () => {
    const menus = MENUS.map(({ menu }) => menu).sort((a, b) => a - b);
    expect(menus).toEqual(Array.from({ length: 47 }, (_, index) => index + 1));
    expect(SPRITE.columns * SPRITE.rows).toBeGreaterThanOrEqual(menus.length);
  });

  it("lays the frames inside the field", () => {
    for (const { left, top } of MENUS) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThan(1);
      expect(top).toBeLessThan(1);
    }
  });

  it("starts them all from the first frame, which lies on top", () => {
    expect(MENUS.at(-1)).toMatchObject({ menu: 1, fromX: 0, fromY: -0 });
  });
});

describe("the ribbon", () => {
  it("has a width for every chapter and the opening", () => {
    expect(Object.keys(SPANS).sort()).toEqual(["open", ...CHAPTERS].sort());
  });
});

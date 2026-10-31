import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANVAS, CANVAS_ORIGIN, CHAPTERS, LAUNCH_DOWNLOADS, SPANS } from "./story-data";

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

describe("the camera over the Figma file", () => {
  it("starts with the first frame in the middle of the view", () => {
    const [x, y] = CANVAS_ORIGIN;
    const { frame, close } = CANVAS;
    expect(x + (frame.left + frame.width / 2 - x) * close).toBeCloseTo(0.5, 5);
    expect(y + (frame.top + frame.height / 2 - y) * close).toBeCloseTo(0.5, 5);
  });
});

describe("the ribbon", () => {
  it("has a width for every chapter and the opening", () => {
    expect(Object.keys(SPANS).sort()).toEqual(["open", ...CHAPTERS].sort());
  });
});

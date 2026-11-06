import { expect, test } from "@playwright/test";

import { PAGE_PATHS } from "../../src/lib/pages";
import { ADDRESSES } from "../pages";

// The promise of ADR-0004 at every address: the page is in the HTML and never waits for animation.

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const address of ADDRESSES) {
    test(`${address} shows its heading and its links`, async ({ page }) => {
      await page.goto(address);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("[data-capsule] nav").getByRole("link")).toHaveCount(
        PAGE_PATHS.length,
      );
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

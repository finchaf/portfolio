import { expect, test } from "@playwright/test";

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

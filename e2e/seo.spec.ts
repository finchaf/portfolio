import { expect, test } from "@playwright/test";

import { SITE_ORIGIN } from "../src/lib/site";
import { ADDRESSES } from "./pages";

for (const address of ADDRESSES) {
  test(`${address} is findable`, async ({ page }) => {
    await page.goto(address);
    const locale = address.split("/")[1] ?? "";
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    expect(await page.title()).not.toBe("");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE_ORIGIN}${address}`,
    );

    const path = address.replace(/^\/(ru|en)/, "");
    for (const [language, target] of [
      ["ru", `/ru${path}`],
      ["en", `/en${path}`],
      ["x-default", ""],
    ] as const) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${language}"]`),
        language,
      ).toHaveAttribute("href", `${SITE_ORIGIN}${target}`);
    }
  });
}

test("the sitemap lists every page in both languages, and robots.txt names it", async ({
  request,
}) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(listed.toSorted()).toEqual(
    ADDRESSES.map((address) => `${SITE_ORIGIN}${address}`).toSorted(),
  );
  expect(await (await request.get("/robots.txt")).text()).toContain(`${SITE_ORIGIN}/sitemap.xml`);
});

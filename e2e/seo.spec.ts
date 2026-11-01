import { expect, test } from "@playwright/test";

import { LOCALES } from "../src/i18n/locales";
import { PAGES } from "../src/lib/pages";
import { SHARE_IMAGE, shareImagePath } from "../src/lib/share-images";
import { SITE_ICONS, SITE_ORIGIN } from "../src/lib/site";
import { ADDRESSES } from "./pages";

/** The picture every link had until each page got its own: posts that hold it must not break. */
const FIRST_PICTURE = "/og.png";

for (const address of ADDRESSES) {
  test(`${address} is findable`, async ({ page }) => {
    await page.goto(address);
    const locale = address.split("/")[1] ?? "";
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    expect(await page.title()).not.toBe("");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(`^${SITE_ORIGIN}/og/${locale}/\\w+\\.png\\?v=[0-9a-f]{8}$`),
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${SITE_ORIGIN}${address}`,
    );
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

for (const address of ["/ru", "/ru/no-such-page"]) {
  test(`${address} names its icons`, async ({ page }) => {
    await page.goto(address);
    for (const { url } of SITE_ICONS.icon) {
      await expect(page.locator(`link[rel="icon"][href="${url}"]`)).toHaveCount(1);
    }
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      SITE_ICONS.apple,
    );
  });
}

test("every icon is served", async ({ request }) => {
  const files = [...SITE_ICONS.icon.map(({ url }) => url), SITE_ICONS.apple];
  for (const file of files) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect((await response.body()).length, file).toBeGreaterThan(0);
  }
});

// Only a real answer shows this: a file a server cannot name a type for reaches no platform.
test("every link picture is served as a picture", async ({ request }) => {
  const pictures = LOCALES.flatMap((locale) =>
    Object.values(PAGES).map((card) => shareImagePath(locale, card)),
  );
  for (const picture of [...pictures, FIRST_PICTURE]) {
    const response = await request.get(picture);
    expect(response.status(), picture).toBe(200);
    expect(response.headers()["content-type"], picture).toBe(SHARE_IMAGE.type);
  }
});

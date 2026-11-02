import { expect, test } from "@playwright/test";

import { PAGE_PATHS } from "../src/lib/pages";
import { ADDRESSES } from "./pages";

const DIRECT = { maxRedirects: 0 };

// What Caddy answers, as a reader and a crawler meet it.
for (const [language, target] of [
  ["ru-RU,ru;q=0.9", "/ru"],
  ["en-US,en;q=0.9", "/en"],
  ["de-DE", "/en"],
  ["", "/ru"],
] as const) {
  test(`/ with Accept-Language "${language}" goes to ${target}`, async ({ request }) => {
    const response = await request.get("/", {
      ...DIRECT,
      headers: { "Accept-Language": language },
    });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe(target);
    expect(response.headers().vary).toContain("Accept-Language");
  });
}

test("the redirect keeps the query string", async ({ request }) => {
  const response = await request.get("/?r=mark", {
    ...DIRECT,
    headers: { "Accept-Language": "ru" },
  });
  expect(response.headers().location).toBe("/ru?r=mark");
});

for (const path of PAGE_PATHS.filter(Boolean)) {
  for (const [language, target] of [
    ["ru-RU,ru;q=0.9", `/ru${path}`],
    ["en-US,en;q=0.9", `/en${path}`],
    ["", `/ru${path}`],
  ] as const) {
    test(`${path} with Accept-Language "${language}" goes to ${target}`, async ({ request }) => {
      const response = await request.get(path, {
        ...DIRECT,
        headers: { "Accept-Language": language },
      });
      expect(response.status()).toBe(302);
      expect(response.headers().location).toBe(target);
      expect(response.headers().vary).toContain("Accept-Language");
    });
  }
}

test("a page without a language keeps the query string", async ({ request }) => {
  const response = await request.get("/flow?r=mark", {
    ...DIRECT,
    headers: { "Accept-Language": "en" },
  });
  expect(response.headers().location).toBe("/en/flow?r=mark");
});

for (const locale of ["ru", "en"]) {
  test(`/${locale}/pora-na-paru moved for good, and keeps its query`, async ({ request }) => {
    const response = await request.get(`/${locale}/pora-na-paru?r=mark`, DIRECT);
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/${locale}/poranaparu?r=mark`);
    expect((await request.get(`/${locale}/pora-na-paru`)).status()).toBe(200);
  });
}

test("a trailing slash answers with the address without it", async ({ request }) => {
  const response = await request.get("/ru/flow/", DIRECT);
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/ru/flow");
});

test("an unknown address is a 404 with the site's page, out of search", async ({ page }) => {
  const response = await page.goto("/ru/no-such-page");
  expect(response?.status()).toBe(404);
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers().server).toBeUndefined();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

test("HTML is revalidated, hashed files are kept for a year, and both arrive compressed", async ({
  page,
  request,
}) => {
  const html = await request.get("/ru", { headers: { "Accept-Encoding": "br" } });
  expect(html.headers()["cache-control"]).toContain("must-revalidate");
  expect(html.headers()["content-encoding"]).toBe("br");

  await page.goto("/ru");
  const script = await page.locator('script[src^="/_next/static/"]').first().getAttribute("src");
  const asset = await request.get(script ?? "", { headers: { "Accept-Encoding": "gzip" } });
  expect(asset.headers()["cache-control"]).toContain("immutable");
  expect(asset.headers()["content-encoding"]).toBe("gzip");
});

for (const address of ADDRESSES) {
  test(`${address} answers with its policy and breaks none of it`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
    });
    page.on("pageerror", (error) => violations.push(error.message));

    const response = await page.goto(address);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response?.headers().server).toBeUndefined();
    await page.waitForLoadState("networkidle");
    expect(violations).toEqual([]);
  });
}

test("the header moves between pages without a reload and marks the current one", async ({
  page,
}) => {
  await page.goto("/ru");
  await page.evaluate(() => {
    (window as unknown as { sameDocument: boolean }).sameDocument = true;
  });

  const header = page.locator("[data-capsule]");
  await header.getByRole("link", { name: "Флоу" }).click();
  await expect(page).toHaveURL(/\/ru\/flow$/);
  await expect(page.getByRole("heading", { level: 1, name: "Флоу" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Флоу" })).toHaveAttribute("aria-current", "page");
  await expect(header.getByRole("link", { name: "Главная" })).not.toHaveAttribute("aria-current");

  const sameDocument = await page.evaluate(
    () => (window as unknown as { sameDocument?: boolean }).sameDocument,
  );
  expect(sameDocument).toBe(true);
});

test("the language link keeps the page", async ({ page }) => {
  await page.goto("/ru/projects");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/projects$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
});

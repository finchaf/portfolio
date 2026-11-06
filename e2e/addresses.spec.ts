import { expect, test } from "@playwright/test";

import { PAGE_PATHS } from "../src/lib/pages";
import { ADDRESSES } from "./pages";

const DIRECT = { maxRedirects: 0 };

/** What a test leaves on the page's window to read back: none of it is the site's. */
type Probe = { sameDocument?: boolean };

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

test("the 404 speaks the language its address asks for, and leads to every page", async ({
  page,
}) => {
  await page.goto("/en/no-such-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const ways = page.getByRole("navigation", { name: "Sections of the site" }).getByRole("link");
  await expect(ways).toHaveCount(4);
  await expect(ways.first()).toHaveAttribute("href", "/en");
  await page.goto("/ru/no-such-page");
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeHidden();
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

/** What a page may say or miss and still pass: each entry with the reason it is there. */
const EXPECTED: readonly RegExp[] = [];

for (const address of ADDRESSES) {
  test(`${address} answers with its policy and breaks none of it`, async ({ page, baseURL }) => {
    // A broken policy, any other error in the console, a script that throws, and a file of the site
    // answered with an error. A request that never ends is not counted: an aborted prefetch is one.
    const origin = new URL(address, baseURL).origin;
    const violations: string[] = [];
    const record = (text: string) => {
      if (!EXPECTED.some((expected) => expected.test(text))) violations.push(text);
    };
    page.on("console", (message) => {
      if (message.type() === "error" || /Content Security Policy/i.test(message.text())) {
        record(message.text());
      }
    });
    page.on("pageerror", (error) => {
      record(error.message);
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === origin) {
        record(`${String(response.status())} ${response.url()}`);
      }
    });

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
    (window as Window & Probe).sameDocument = true;
  });

  const header = page.locator("[data-capsule]");
  await header.getByRole("link", { name: "Флоу" }).click();
  await expect(page).toHaveURL(/\/ru\/flow$/);
  await expect(page.getByRole("heading", { level: 1, name: "Флоу" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Флоу" })).toHaveAttribute("aria-current", "page");
  await expect(header.getByRole("link", { name: "Главная" })).not.toHaveAttribute("aria-current");

  const sameDocument = await page.evaluate(() => (window as Window & Probe).sameDocument);
  expect(sameDocument).toBe(true);
});

test("the language link keeps the page", async ({ page }) => {
  await page.goto("/ru/projects");
  // The board fills the screen and holds the footer under itself until the reader gets there.
  await page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/projects$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
});

for (const locale of ["ru", "en"]) {
  test(`the CV in ${locale} is a PDF, as a reader downloads it`, async ({ request }) => {
    const response = await request.get(`/cv/${locale}.pdf`, DIRECT);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });
}

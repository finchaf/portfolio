import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { SHELL } from "@/i18n/shell-catalog";

/** The params of the address the boundary renders at, as `useParams` gives them. */
const params = vi.hoisted((): { current: { locale?: string } } => ({ current: {} }));

vi.mock("next/navigation", () => ({ useParams: () => params.current }));

const { default: GlobalError } = await import("./global-error");

/** The document the boundary puts in place of the layout, at an address with `locale`. */
function render(locale?: string) {
  params.current = locale === undefined ? {} : { locale };
  return renderToStaticMarkup(createElement(GlobalError, { reset: () => undefined }));
}

describe("the error of the whole site", () => {
  it.each(["ru", "en"] as const)("speaks the language of a page in %s", (locale) => {
    const html = render(locale);
    expect(html).toContain(`<html lang="${locale}"`);
    expect(html).toContain(`<title>${SHELL[locale].error.title}</title>`);
    expect(html).toContain(SHELL[locale].error.retry);
    expect(html).toContain('id="content"');
  });

  it("falls back to the default language where the address names none", () => {
    expect(render()).toContain(`<html lang="${DEFAULT_LOCALE}"`);
    expect(render("de")).toContain(SHELL[DEFAULT_LOCALE].error.title);
  });
});

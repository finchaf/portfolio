import { describe, expect, it } from "vitest";

import { SITE_ORIGIN } from "../lib/site";
import { alternates } from "./alternates";

describe("alternates", () => {
  it("names the page in its language as canonical", () => {
    expect(alternates("en", "/flow").canonical).toBe(`${SITE_ORIGIN}/en/flow`);
  });

  it("lists every language and the bare address", () => {
    expect(alternates("ru", "").languages).toEqual({
      ru: `${SITE_ORIGIN}/ru`,
      en: `${SITE_ORIGIN}/en`,
      "x-default": SITE_ORIGIN,
    });
  });
});

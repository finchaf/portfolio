#!/usr/bin/env python3
"""Check that the build produced exactly the pages it is meant to, and what a link to each shows.

`next build` is happy with a page that quietly stopped being exported, and with one nobody meant
to publish. This compares the HTML in out/ with `pages` in expected-build.json, and checks that a
page has its compressed copies, which Caddy serves from disk.

A platform reads a link from the raw HTML, without a script, so the link preview is checked there:
every tag, in the first 32 KB, the texts within what the platforms show, and the picture's file.

    python3 scripts/check_build.py        (after `pnpm build`; the Build gate runs both)

Exit 0 when there is no finding, 1 otherwise; every finding is printed.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "out"
ORIGIN = "https://finchaf.com"

ERROR_PAGES = {"404.html", "_not-found.html"}
OPEN_GRAPH_LOCALE = {"ru": "ru_RU", "en": "en_US"}

# The first bytes the fussiest reader looks at: Slack's range.
HEAD_LIMIT = 32 * 1024
PICTURE_LIMIT = 300 * 1024
PICTURE_SIZE = (1200, 630)
ALT_LIMIT = 420

# Characters, the lowest common limit: Discord's 70 bytes and the strip X lays over a picture for a
# title, what LinkedIn and Telegram leave of a description. Cyrillic is wider, so it gets fewer.
TITLE_LIMIT = {"ru": 35, "en": 40}
DESCRIPTION_LIMIT = {"ru": 125, "en": 150}

REQUIRED = (
    "og:title", "og:description", "og:url", "og:type", "og:site_name", "og:locale",
    "og:locale:alternate", "og:image", "og:image:width", "og:image:height", "og:image:type",
    "og:image:alt", "twitter:card", "twitter:image:alt",
)
PICTURE = re.compile(rf"^{re.escape(ORIGIN)}/og/(ru|en)/([a-z]+)\.png\?v=([0-9a-f]{{8}})$")


class Head(HTMLParser):
    """The language, the canonical address and the `<meta>` tags of a page."""

    def __init__(self) -> None:
        super().__init__()
        self.lang = ""
        self.canonical = ""
        self.tags: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name: value or "" for name, value in attrs}
        if tag == "html":
            self.lang = values.get("lang", "")
        elif tag == "link" and values.get("rel") == "canonical":
            self.canonical = values.get("href", "")
        elif tag == "meta" and "content" in values:
            name = values.get("property") or values.get("name") or ""
            self.tags.setdefault(name, values["content"])


def read_head(page: str) -> Head:
    head = Head()
    head.feed((OUT / page).read_bytes()[:HEAD_LIMIT].decode("utf8", "ignore"))
    return head


def check_picture(page: str, locale: str, tags: dict[str, str]) -> tuple[list[str], str]:
    """Findings about a page's picture, and its file's hash for comparing pages."""
    address = tags.get("og:image", "")
    match = PICTURE.match(address)
    if not match:
        return [f"{page}: og:image is not a versioned picture of the site: {address}"], ""
    if match[1] != locale:
        return [f"{page}: og:image is in another language: {address}"], ""
    file = OUT / "og" / match[1] / f"{match[2]}.png"
    if not file.exists():
        return [f"{page}: no such picture: {file.relative_to(OUT)}"], ""
    data = file.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    findings = []
    if data[1:4] != b"PNG":
        findings.append(f"{page}: the picture is not a PNG")
    size = (int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big"))
    if size != PICTURE_SIZE:
        findings.append(f"{page}: the picture is {size}, not {PICTURE_SIZE}")
    if (tags.get("og:image:width"), tags.get("og:image:height")) != tuple(map(str, size)):
        findings.append(f"{page}: og:image:width and height are not the file's")
    if tags.get("og:image:type") != "image/png":
        findings.append(f"{page}: og:image:type is not image/png")
    if len(data) > PICTURE_LIMIT:
        findings.append(f"{page}: the picture weighs {len(data)} bytes")
    if digest[:8] != match[3]:
        findings.append(f"{page}: ?v= is not the file's hash: run `pnpm og`")
    return findings, digest


def check_preview(page: str, seen: dict[str, str]) -> list[str]:
    """What a link to one page shows. `seen` maps a language and a picture's hash to its page."""
    head = read_head(page)
    tags = head.tags
    locale = page.split("/")[0].removesuffix(".html")
    author = json.loads((REPO / "messages" / locale / "home.json").read_text(encoding="utf8"))
    findings = [f"{page}: no {tag} in the first {HEAD_LIMIT} bytes" for tag in REQUIRED
                if not tags.get(tag, "").strip()]
    if findings:
        return findings

    if head.lang != locale:
        findings.append(f"{page}: <html lang> is {head.lang}")
    if tags["og:url"] != head.canonical or not head.canonical.startswith(f"{ORIGIN}/"):
        findings.append(f"{page}: og:url {tags['og:url']} is not canonical {head.canonical}")
    if tags["og:locale"] != OPEN_GRAPH_LOCALE[locale]:
        findings.append(f"{page}: og:locale is {tags['og:locale']}")
    if tags["og:type"] != "website":
        findings.append(f"{page}: og:type is {tags['og:type']}")
    if tags["twitter:card"] != "summary_large_image":
        findings.append(f"{page}: twitter:card is {tags['twitter:card']}")
    if len(tags["og:title"]) > TITLE_LIMIT[locale]:
        findings.append(f"{page}: og:title is {len(tags['og:title'])} characters long")
    if len(tags["og:description"]) > DESCRIPTION_LIMIT[locale]:
        findings.append(f"{page}: og:description is {len(tags['og:description'])} characters long")
    if page.count("/") and author["hero"]["name"] in tags["og:title"]:
        findings.append(f"{page}: the author's name takes up og:title")
    for tag in ("og:image:alt", "twitter:image:alt"):
        if tags[tag] == tags["og:title"] or len(tags[tag]) > ALT_LIMIT:
            findings.append(f"{page}: {tag} must describe the picture, in {ALT_LIMIT} characters")

    picture_findings, digest = check_picture(page, locale, tags)
    findings += picture_findings
    if digest:
        other = seen.setdefault(f"{locale}/{digest}", page)
        if other != page:
            findings.append(f"{page}: shares its picture with {other}")
    return findings


def check_error_page(page: str) -> list[str]:
    """A missing page is out of search and says nothing about any other page."""
    head = read_head(page)
    findings = []
    if "noindex" not in head.tags.get("robots", ""):
        findings.append(f"{page}: no noindex")
    if head.canonical or "og:url" in head.tags:
        findings.append(f"{page}: it speaks for an address it is not")
    return findings


def main() -> int:
    if not OUT.exists():
        print("no build in out/: run `pnpm build`")
        return 1
    expected = set(json.loads((REPO / "expected-build.json").read_text(encoding="utf8"))["pages"])
    built = {path.relative_to(OUT).as_posix() for path in OUT.rglob("*.html")}

    findings = [f"missing from the build: {page}" for page in sorted(expected - built)]
    findings += [f"built but not expected: {page}" for page in sorted(built - expected)]
    for page in sorted(expected & built):
        findings += [
            f"no {suffix} copy: {page}" for suffix in (".br", ".gz")
            if not (OUT / f"{page}{suffix}").exists()
        ]

    seen: dict[str, str] = {}
    for page in sorted(expected & built):
        findings += check_error_page(page) if page in ERROR_PAGES else check_preview(page, seen)

    print("\n".join(findings) if findings else f"{len(built)} pages, as expected")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

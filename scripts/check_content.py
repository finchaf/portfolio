#!/usr/bin/env python3
"""Check the site's text: every string exists in both languages.

A key added in Russian and forgotten in English shows the key's name to an English reader, and
nothing in a build says so: the types come from the Russian catalog alone.

    python3 scripts/check_content.py

1. `messages/ru/` and `messages/en/` hold the same files, the vault's notes among them.
2. A catalog has exactly the keys of its twin; a difference is named by its dotted path.
3. Keys are camelCase and every value is non-empty text.
4. A value and its twin name the same arguments and rich-text tags: `{date}` or `<c>` lost in one
   language is a formatting error, or the wrong text, on the page that uses it.

Exit 0 when there is no finding, 1 otherwise; every finding is printed.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Iterator

REPO = Path(__file__).resolve().parent.parent
MESSAGES = REPO / "messages"
KEY = re.compile(r"^[a-z][a-zA-Z0-9]*$")
ARGUMENT = re.compile(r"\{(\w+)[,}]")
TAG = re.compile(r"</?(\w+)>")


def leaves(value: object, path: str = "") -> Iterator[tuple[str, object]]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield from leaves(child, f"{path}.{key}" if path else key)
    else:
        yield path, value


def names(value: object) -> tuple[set[str], set[str]]:
    text = value if isinstance(value, str) else ""
    return set(ARGUMENT.findall(text)), set(TAG.findall(text))


def main() -> int:
    findings: list[str] = []
    russian = {path.name for path in (MESSAGES / "ru").glob("*.json")}
    english = {path.name for path in (MESSAGES / "en").glob("*.json")}
    findings += [f"{name}: only in one language" for name in sorted(russian ^ english)]

    notes = {
        locale: {path.name for path in (MESSAGES / locale / "vault").glob("*.md")}
        for locale in ("ru", "en")
    }
    findings += [f"vault/{name}: only in one language" for name in sorted(notes["ru"] ^ notes["en"])]

    for name in sorted(russian & english):
        catalogs = {
            locale: dict(leaves(json.loads((MESSAGES / locale / name).read_text(encoding="utf8"))))
            for locale in ("ru", "en")
        }
        for key in sorted(set(catalogs["ru"]) ^ set(catalogs["en"])):
            findings.append(f"{name}: {key} is only in one language")
        for locale, catalog in catalogs.items():
            for key, value in catalog.items():
                if not all(KEY.match(part) for part in key.split(".")):
                    findings.append(f"{locale}/{name}: {key} is not camelCase")
                if not isinstance(value, str) or not value.strip():
                    findings.append(f"{locale}/{name}: {key} is not text")
        for key in sorted(set(catalogs["ru"]) & set(catalogs["en"])):
            if names(catalogs["ru"][key]) != names(catalogs["en"][key]):
                findings.append(f"{name}: {key} has other arguments or tags in one language")

    print("\n".join(findings))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

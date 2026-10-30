#!/usr/bin/env python3
"""Check how much JavaScript each page makes a reader download before it works.

It grows a few kilobytes at a time, each one reasonable, and no review catches the sum. This adds
up the gzipped size of the scripts each page's HTML names and holds it to `firstLoadJsBudgetKb` in
expected-build.json. Heavy code loaded later, by a dynamic import, is not in this sum, which is the
point of loading it later.

    python3 scripts/check_bundle.py       (after the build; the Bundle gate)

Exit 0 when every page fits, 1 otherwise. Sizes are gzip level 9.
"""

from __future__ import annotations

import gzip
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "out"
SCRIPT = re.compile(r'<script\b[^>]*\bsrc="(/_next/[^"?]+)')


def first_load_kb(page: Path) -> float:
    html = page.read_text(encoding="utf8")
    sources = set(SCRIPT.findall(html))
    return sum(len(gzip.compress((OUT / source[1:]).read_bytes(), 9)) for source in sources) / 1024


def main() -> int:
    settings = json.loads((REPO / "expected-build.json").read_text(encoding="utf8"))
    budget = settings["firstLoadJsBudgetKb"]
    failed = False
    for name in settings["pages"]:
        size = first_load_kb(OUT / name)
        over = size > budget
        failed = failed or over
        print(f"{'OVER' if over else 'ok':4}  {size:6.1f} KB  {name}")
    print(f"budget: {budget} KB")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

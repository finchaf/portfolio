#!/usr/bin/env python3
"""Check that the build produced exactly the pages it is meant to.

`next build` is happy with a page that quietly stopped being exported, and with one nobody meant
to publish. This compares the HTML in out/ with `pages` in expected-build.json, and checks that a
page has its compressed copies, which Caddy serves from disk.

    python3 scripts/check_build.py        (after `pnpm build`; the Build gate runs both)

Exit 0 when there is no finding, 1 otherwise; every finding is printed.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "out"


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

    print("\n".join(findings) if findings else f"{len(built)} pages, as expected")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

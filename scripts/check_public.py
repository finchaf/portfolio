#!/usr/bin/env python3
"""Keep this repository fit to be public: nothing here depends on the private part, or names it.

    python3 scripts/check_public.py

1. No tracked file links into docs/private.
2. On a machine with the private part, no tracked file and no commit of the branch holds a word
   from docs/private/forbidden-words.txt, one lower-case word or phrase per line. The list is
   private by nature, so CI, which has no such file, runs only the first rule.
3. A word that is also in docs/private/allowed-in-messages.txt may stand in messages/, the strings
   of the site itself, and nowhere else: a commit message or a code file with it still fails.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
WORDS = REPO / "docs/private/forbidden-words.txt"
ALLOWED_IN_STRINGS = REPO / "docs/private/allowed-in-messages.txt"
STRINGS = "messages/"
LINK_INTO_PRIVATE = re.compile(r"\]\([^)]*private/[^)]*\)")
# This gate quotes the path it looks for, and CLAUDE.md explains the folder without linking it.
SELF = "scripts/check_public.py"


def git(*args: str) -> str:
    return subprocess.run(("git", *args), cwd=REPO, check=True, capture_output=True,
                          text=True).stdout


def tracked() -> dict[str, str]:
    texts = {}
    for name in git("ls-files", "--cached", "--others", "--exclude-standard").splitlines():
        path = REPO / name
        if name == SELF or not path.is_file():
            continue
        try:
            texts[name] = path.read_text(encoding="utf8")
        except UnicodeDecodeError:
            continue
    return texts


def word_list(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [line.strip().lower() for line in path.read_text(encoding="utf8").splitlines()
            if line.strip() and not line.startswith("#")]


def main() -> int:
    findings = []
    texts = tracked()
    for name, text in texts.items():
        if LINK_INTO_PRIVATE.search(text):
            findings.append(f"{name}: links into the private part")

    if WORDS.exists():
        allowed = word_list(ALLOWED_IN_STRINGS)
        history = git("log", "--format=%H%n%B", "--all")
        for word in word_list(WORDS):
            findings += [f"{name}: holds a forbidden word" for name, text in texts.items()
                         if word in text.lower()
                         and not (word in allowed and name.startswith(STRINGS))]
            if word in history.lower():
                findings.append("a commit message holds a forbidden word")
    else:
        print("no private word list here: only the links were checked")

    for finding in sorted(set(findings)):
        print(finding)
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

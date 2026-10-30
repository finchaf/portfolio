#!/usr/bin/env python3
"""Check the knowledge base the way a linter checks code: prose rots silently, a script does not.

    python3 scripts/check_docs.py

Every rule compares the prose with something that exists. Each finding is printed; exit 0 when
there are none, 1 otherwise. The private part in docs/private is another repository's business.

1. Links in docs/, CLAUDE.md and README.md resolve, anchors included, the way GitHub makes them.
2. Every document in docs/ is reached by links from docs/README.md.
3. After the title and an ADR's or a spec's metadata comes a `>` lede.
4. A document has more Cyrillic letters than Latin ones outside code: the base is Russian.
5. Documents in 05-features/ and 07-roadmap/, READMEs of 07 aside, declare `**Статус:**`.
6. The ADR journal is coherent: numbered without a gap, titled by its number, with a status from
   the vocabulary and a date, and its index lists exactly the records with their statuses.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
DECISIONS = DOCS / "01-architecture/decisions"
STATUS_WORDS = ("реализовано", "спецификация", "отложено", "отменено")
ADR_STATUSES = ("предложен", "принят", "отклонён", "заменён")

FENCE = re.compile(r"^(```|~~~).*?^\1[ \t]*$", re.S | re.M)
INLINE_CODE = re.compile(r"(`+)(.+?)\1", re.S)
LINK = re.compile(r"!?\[(?:[^\]\\]|\\.)*\]\(\s*([^)\s]+)(?:\s+\"[^\"]*\")?\s*\)")
HEADING = re.compile(r"^#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$", re.M)


def documents() -> list[Path]:
    return sorted(p for p in DOCS.rglob("*.md") if "private" not in p.relative_to(DOCS).parts)


def prose(text: str) -> str:
    return INLINE_CODE.sub("", FENCE.sub("", text))


def anchors(text: str) -> set[str]:
    seen: dict[str, int] = {}
    result = set()
    for title in HEADING.findall(FENCE.sub("", text)):
        plain = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", title).replace("`", "")
        slug = re.sub(r"[^\w\- ]", "", plain.lower()).replace(" ", "-")
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        result.add(f"{slug}-{count}" if count else slug)
    return result


def links_of(path: Path) -> list[str]:
    return LINK.findall(INLINE_CODE.sub("", FENCE.sub("", path.read_text(encoding="utf8"))))


def resolve(path: Path, target: str) -> tuple[Path, str] | None:
    if re.match(r"[a-z][a-z0-9+.-]*:", target):
        return None
    file, _, anchor = target.partition("#")
    return ((path.parent / unquote(file)).resolve() if file else path, unquote(anchor))


def check_links(findings: list[str]) -> None:
    for path in [*documents(), REPO / "CLAUDE.md", REPO / "README.md"]:
        for target in links_of(path):
            resolved = resolve(path, target)
            if resolved is None:
                continue
            file, anchor = resolved
            name = path.relative_to(REPO)
            if not file.exists():
                findings.append(f"{name}: no such file: {target}")
            elif anchor and file.suffix == ".md":
                if anchor not in anchors(file.read_text(encoding="utf8")):
                    findings.append(f"{name}: no such heading: {target}")


def check_orphans(findings: list[str]) -> None:
    reached, queue = set(), [DOCS / "README.md"]
    while queue:
        path = queue.pop()
        if path in reached:
            continue
        reached.add(path)
        for target in links_of(path):
            resolved = resolve(path, target)
            if resolved and resolved[0].suffix == ".md" and resolved[0].is_relative_to(DOCS):
                queue.append(resolved[0])
    for path in documents():
        if path not in reached:
            findings.append(f"{path.relative_to(REPO)}: nothing leads to it")


def check_shape(findings: list[str]) -> None:
    for path in documents():
        name = path.relative_to(REPO)
        text = path.read_text(encoding="utf8")
        lines = [line for line in text.splitlines()[1:] if line.strip()]
        first = next((line for line in lines if not line.startswith(("- **", "**Статус"))), "")
        if not first.startswith(">"):
            findings.append(f"{name}: no `>` lede after the title")
        body = prose(text)
        if len(re.findall(r"[а-яё]", body, re.I)) <= len(re.findall(r"[a-z]", body, re.I)):
            findings.append(f"{name}: more Latin than Cyrillic")
        section = path.relative_to(DOCS).parts[0]
        declares = section == "05-features" or (section == "07-roadmap" and path.name != "README.md")
        status = re.search(r"^\*\*Статус:\*\* (\S+)", text, re.M)
        if declares and (status is None or status.group(1) not in STATUS_WORDS):
            findings.append(f"{name}: no `**Статус:**` from the vocabulary")


def check_journal(findings: list[str]) -> None:
    index = (DECISIONS / "README.md").read_text(encoding="utf8")
    records = sorted(p for p in DECISIONS.glob("*.md") if p.name != "README.md")
    listed = dict(re.findall(r"^\| \[(\d{4})\]\([^)]+\) \|.*\| (\S+) \|$", index, re.M))
    for number, path in enumerate(records, start=1):
        code = f"{number:04d}"
        text = path.read_text(encoding="utf8")
        name = path.relative_to(REPO)
        if not path.name.startswith(f"{code}-"):
            findings.append(f"{name}: expected number {code}")
        if not text.startswith(f"# ADR-{code}: "):
            findings.append(f"{name}: the title does not carry {code}")
        status = re.search(r"^- \*\*Статус:\*\* (\S+)", text, re.M)
        if status is None or status.group(1) not in ADR_STATUSES:
            findings.append(f"{name}: no status from the vocabulary")
        if not re.search(r"^- \*\*Дата:\*\* \d{4}-\d{2}-\d{2}$", text, re.M):
            findings.append(f"{name}: no date")
        if status and listed.get(code) != status.group(1):
            findings.append(f"{name}: the index says {listed.get(code)}")
    if len(listed) != len(records):
        findings.append("decisions/README.md: the index and the records differ")


def main() -> int:
    findings: list[str] = []
    check_links(findings)
    check_orphans(findings)
    check_shape(findings)
    check_journal(findings)
    print("\n".join(findings))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

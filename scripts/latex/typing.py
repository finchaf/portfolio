#!/usr/bin/env python3
"""Types one line of a lecture with the snippets it was typed with, and typesets what the PDF shows.

The line is from lecture 17 of the calculus notes, 19.11.2023, in the public repository
`finchaf/university`. The keys are the triggers of the LuaSnip snippets in the owner's Neovim
config; each step records the buffer after it, so the page only plays the record back. At every
compile the buffer is typeset by LuaLaTeX in CMU Serif with Computer Modern maths, as in the notes,
and turned into outlines by dvisvgm, which take the colour of the text around them.

    python3 scripts/latex/typing.py   ->  src/features/projects/latex-typing.json

Needs TeX Live with LuaLaTeX, `cm-unicode`, `amsfonts` and `dvisvgm` (`tlmgr install cm-unicode
dvisvgm`). Run it by hand when the line or the snippets change; the result is committed.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/features/projects/latex-typing.json"

# What the hands do. `type` puts text in, `snip` is a trigger and the text it turns into (`|` is
# where the cursor lands), `jump` is `jk`, which leaves the snippet: the cursor goes past `to`.
# `compile` marks a save: the PDF is typeset from the buffer as it stands.
STEPS = [
    ("type", "Если "),
    ("snip", "mm", "$|$"),
    ("type", "E "),
    ("snip", "sbb", "\\subset |"),
    ("type", "\\R"),
    ("snip", '"n', "^{n} |"),
    ("jump", "$"),
    ("compile",),
    ("type", " и "),
    ("snip", "mm", "$|$"),
    ("snip", "faa", "\\forall |"),
    ("snip", ";e", "\\epsilon |"),
    ("type", "> 0 \\ "),
    ("snip", "exx", "\\exists |"),
    ("type", "B = B"),
    ("snip", ";", "_{|} "),
    ("snip", ";e", "\\epsilon |"),
    ("jump", "} "),
    ("type", ": \\ E "),
    ("snip", "sbb", "\\subset |"),
    ("type", "B"),
    ("jump", "$"),
    ("compile",),
    ("type", " и "),
    ("snip", "mm", "$|$"),
    ("type", "m"),
    ("snip", "(", "(|)"),
    ("type", "B"),
    ("jump", ")"),
    ("type", " < "),
    ("snip", ";e", "\\epsilon |"),
    ("snip", ">>", "\\implies |"),
    ("type", "m"),
    ("snip", "(", "(|)"),
    ("type", "E"),
    ("jump", ")"),
    ("type", " = 0"),
    ("jump", "$"),
    ("type", "."),
    ("compile",),
]

PREAMBLE = r"""\documentclass[12pt]{article}
\usepackage{fontspec}
\setmainfont{CMU Serif}
\usepackage{amsmath,amssymb}
\newcommand\R{\ensuremath{\mathbb{R}}}
\setlength{\textwidth}{10.2cm}
\pagestyle{empty}
\begin{document}
\noindent """

DVISVGM = shutil.which("dvisvgm") or str(Path.home() / "texlive/bin/universal-darwin/dvisvgm")


def typeset(source: str, folder: Path, index: int, glyphs: dict[str, str]) -> dict:
    """The page as glyph outlines placed by `use`, and the rules TeX drew as rectangles."""
    tex = folder / f"line{index}.tex"
    tex.write_text(PREAMBLE + source + "\n\\end{document}\n", encoding="utf-8")
    subprocess.run(
        ["lualatex", "--output-format=dvi", "-interaction=nonstopmode", tex.name],
        cwd=folder,
        check=True,
        capture_output=True,
    )
    svg = folder / f"line{index}.svg"
    subprocess.run(
        [str(DVISVGM), "--no-fonts", "--exact-bbox", "-O", f"line{index}.dvi", "-o", svg.name],
        cwd=folder,
        check=True,
        capture_output=True,
    )
    text = svg.read_text(encoding="utf-8")
    # One font of one size gets the same id in every file, so the outlines are shared by the pages.
    for name, path in re.findall(r"<path id='([^']+)' d='([^']+)'/>", text):
        if glyphs.setdefault(name, path) != path:
            raise SystemExit(f"glyph {name} differs between compiles")
    marks = [
        [name, round(float(x), 2), round(float(y), 2)]
        for x, y, name in re.findall(r"<use x='([^']+)' y='([^']+)' xlink:href='#([^']+)'/>", text)
    ]
    rules = [
        [round(float(value), 2) for value in rect]
        for rect in re.findall(
            r"<rect x='([^']+)' y='([^']+)' height='([^']+)' width='([^']+)'/>", text
        )
    ]
    if "<use" in text.replace("<use x=", "") or ("<rect" in text and not rules):
        raise SystemExit("an element of the outline was not read")
    view = re.search(r"viewBox='([^']+)'", text)
    return {"viewBox": view.group(1) if view else "", "marks": marks, "rules": rules}


def main() -> None:
    buffer, cursor = "", 0
    record = []
    renders: list[dict] = []
    glyphs: dict[str, str] = {}
    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp)
        for step in STEPS:
            kind = step[0]
            if kind == "type":
                buffer = buffer[:cursor] + step[1] + buffer[cursor:]
                cursor += len(step[1])
                record.append({"kind": "type", "keys": step[1], "buffer": buffer, "cursor": cursor})
            elif kind == "snip":
                expansion = step[2]
                at = expansion.index("|")
                text = expansion.replace("|", "")
                buffer = buffer[:cursor] + text + buffer[cursor:]
                start = cursor
                cursor += at
                record.append(
                    {
                        "kind": "snip",
                        "keys": step[1],
                        "buffer": buffer,
                        "cursor": cursor,
                        "from": start,
                        "to": start + len(text),
                    }
                )
            elif kind == "jump":
                found = buffer.index(step[1], cursor)
                cursor = found + len(step[1])
                record.append({"kind": "jump", "keys": "jk", "buffer": buffer, "cursor": cursor})
            else:
                renders.append(typeset(buffer, folder, len(renders), glyphs))
                record[-1]["render"] = len(renders) - 1

    keys = sum(len(each["keys"]) for each in record)
    OUT.write_text(
        json.dumps(
            {
                "line": buffer,
                "keys": keys,
                "steps": record,
                "glyphs": glyphs,
                "renders": renders,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"{keys} keys for {len(buffer)} characters, {len(renders)} renders -> {OUT.relative_to(ROOT)}")


main()

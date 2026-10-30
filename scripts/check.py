#!/usr/bin/env python3
"""Every gate of this repository, in one run, with a table at the end.

    python3 scripts/check.py                  every gate, before every commit
    python3 scripts/check.py --fast           without the build and the browser, mid-work
    python3 scripts/check.py --group static   one group, as a CI job runs it

Exit 0 when every gate that ran is green, 1 otherwise. It never stops at the first failure; a gate
that needs another is skipped, and marked so, when that one failed. `GATES` is the runnable list;
docs/06-quality/ci-and-tooling.md says what each gate is for, and the two change together.
Standard library only.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import NamedTuple

REPO = Path(__file__).resolve().parent.parent

PYTHON = "python3"


class Gate(NamedTuple):
    name: str
    group: str
    # Each command must pass; `python3` stands for this interpreter.
    commands: tuple[tuple[str, ...], ...]
    needs: str | None = None


GATES = (
    Gate("Docs", "docs", ((PYTHON, "scripts/check_docs.py"),)),
    Gate("Public", "docs", ((PYTHON, "scripts/check_public.py"),)),
    Gate("Types", "static", (("pnpm", "typecheck"),)),
    Gate("Lint", "static", (("pnpm", "lint"),)),
    Gate("Format", "static", (("pnpm", "exec", "prettier", "--check", "."),)),
    Gate("Content", "static", ((PYTHON, "scripts/check_content.py"),)),
    Gate("Unit", "static", (("pnpm", "test"),)),
    Gate("Build", "build", (("pnpm", "build"), (PYTHON, "scripts/check_build.py"))),
    Gate("Bundle", "build", ((PYTHON, "scripts/check_bundle.py"),), needs="Build"),
    Gate("Addresses", "browser", (("pnpm", "e2e", "e2e/addresses.spec.ts"),), needs="Build"),
    Gate("SEO", "browser", (("pnpm", "e2e", "e2e/seo.spec.ts"),), needs="Build"),
    Gate("A11y", "browser", (("pnpm", "e2e", "e2e/a11y.spec.ts"),), needs="Build"),
    Gate("Motion", "browser", (("pnpm", "e2e", "e2e/motion.spec.ts"),), needs="Build"),
    Gate("Themes", "browser", (("pnpm", "e2e", "e2e/themes.spec.ts"),), needs="Build"),
)
GROUPS = tuple(dict.fromkeys(gate.group for gate in GATES))
# What --fast leaves out: the minutes of a full run are the build and the browser.
SLOW_GROUPS = ("build", "browser")


def tooling_problem() -> str | None:
    """Why the site's gates cannot run on this machine, or None when they can."""
    if shutil.which("pnpm") is None:
        return "pnpm is not installed: `brew install pnpm`, then `pnpm install`"
    if not (REPO / "node_modules" / ".modules.yaml").exists():
        return "the dependencies are not installed: `pnpm install`"
    return None


def run(gate: Gate) -> bool:
    for command in gate.commands:
        program = [sys.executable, *command[1:]] if command[0] == PYTHON else list(command)
        print(f"── {gate.name}: {' '.join(command)}", flush=True)
        if subprocess.run(program, cwd=REPO, check=False).returncode != 0:
            return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--fast", action="store_true", help="skip the build and the browser")
    parser.add_argument("--group", action="append", choices=GROUPS, help="only this group")
    options = parser.parse_args()

    groups = options.group or [g for g in GROUPS if not (options.fast and g in SLOW_GROUPS)]
    problem = tooling_problem()
    results: list[tuple[str, str, float]] = []
    passed: dict[str, bool] = {}
    for gate in GATES:
        if gate.group not in groups:
            continue
        started = time.monotonic()
        if gate.needs is not None and passed.get(gate.needs) is False:
            outcome = f"skipped, {gate.needs} failed"
        elif problem and any(command[0] == "pnpm" for command in gate.commands):
            print(f"── {gate.name}: {problem}\n", flush=True)
            outcome = "FAILED"
        else:
            outcome = "ok" if run(gate) else "FAILED"
            print()
        passed[gate.name] = outcome == "ok"
        results.append((gate.name, outcome, time.monotonic() - started))

    width = max(len(name) for name, _, _ in results)
    for name, outcome, seconds in results:
        print(f"{name.ljust(width)}  {outcome}  {seconds:.1f} s")
    return 0 if all(outcome == "ok" for _, outcome, _ in results) else 1


if __name__ == "__main__":
    sys.exit(main())

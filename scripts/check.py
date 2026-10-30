#!/usr/bin/env python3
"""Every gate of this repository, in one run, with a table at the end.

    python3 scripts/check.py                  every gate, before every commit
    python3 scripts/check.py --fast           without the build and the browser, mid-work
    python3 scripts/check.py --group static   one group, as a CI job runs it

Exit 0 when every gate that ran is green, 1 otherwise. It never stops at the first failure.
`GATES` is the runnable list; docs/06-quality/ci-and-tooling.md says what each gate is for, and
the two change together. Standard library only.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import NamedTuple

REPO = Path(__file__).resolve().parent.parent


class Gate(NamedTuple):
    name: str
    group: str
    command: tuple[str, ...]


GATES = (
    Gate("Docs", "static", (sys.executable, "scripts/check_docs.py")),
    Gate("Public", "static", (sys.executable, "scripts/check_public.py")),
)
SLOW_GROUPS = ("build", "browser")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--fast", action="store_true", help="skip the build and the browser")
    parser.add_argument("--group", action="append", help="only this group; may repeat")
    args = parser.parse_args()

    gates = [
        gate for gate in GATES
        if (not args.group or gate.group in args.group)
        and not (args.fast and gate.group in SLOW_GROUPS)
    ]
    results = []
    for gate in gates:
        print(f"── {gate.name}", flush=True)
        started = time.monotonic()
        passed = subprocess.run(gate.command, cwd=REPO, check=False).returncode == 0
        results.append((gate.name, passed, time.monotonic() - started))

    print()
    for name, passed, seconds in results:
        print(f"{'✓' if passed else '✖'} {name:<12} {seconds:5.1f}s")
    return 0 if all(passed for _, passed, _ in results) else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Serve the built site behind the Caddy production runs, on this machine.

    python3 scripts/serve.py                  http://127.0.0.1:8090, until Ctrl-C
    python3 scripts/serve.py --port 8091      another port

`pnpm preview` and the browser gates run it, so what they see is what the server gives: its
redirects, headers, cache rules and compression. It needs the build in out/ and Docker, which is
Colima on the owner's machine: `colima start`. The image is pinned by the same digest as
production's, in poranaparu/backend, deploy/compose.prod.yaml.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
IMAGE = "caddy:2.11.4-alpine@sha256:6aeddd44c3078b0f9a35206472a11420648a79c184603ef95957d0a20044cb2b"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--port", type=int, default=8090)
    port = parser.parse_args().port

    if not (REPO / "out" / "ru.html").exists():
        print("no build in out/: run `pnpm build` first", file=sys.stderr)
        return 1
    if shutil.which("docker") is None:
        print("Docker is not installed", file=sys.stderr)
        return 1

    name = f"portfolio-preview-{port}"
    # A run killed before it could clean up must not hold the port.
    subprocess.run(("docker", "rm", "-f", name), capture_output=True, check=False)
    os.execvp("docker", (
        "docker", "run", "--rm", "--name", name,
        "--publish", f"127.0.0.1:{port}:8080",
        "--volume", f"{REPO / 'deploy' / 'Caddyfile.test'}:/etc/caddy/Caddyfile:ro",
        "--volume", f"{REPO / 'out'}:/srv/portfolio/current:ro",
        IMAGE,
    ))


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Put the site on the server: a release of its own, then one atomic switch (ADR-0005).

    python3 scripts/deploy.py             the gates, the build, the upload, the switch, the checks
    python3 scripts/deploy.py --status    what is live and which releases are kept
    python3 scripts/deploy.py --rollback  back to the release that was live before this one

It releases a clean main that GitHub also has. Everything it touches on the server is under `ROOT`:
Caddy and the containers belong to the product and never hear of it. A release's modified time says
when it last went live, so the newest is `current` and the next one is what --rollback goes to.
The checks read every answer from outside, over HTTPS, and compare the headers with
deploy/Caddyfile.test: the server's copy of that block lives in poranaparu/backend.
Standard library only.
"""

from __future__ import annotations

import argparse
import http.client
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from email.message import Message
from pathlib import Path
from typing import NamedTuple, NoReturn, Optional

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "out"
HOST = "poranaparu-prod"
ROOT = "/opt/poranaparu/portfolio"
SITE = "https://finchaf.com"
# Every other name of the site: each answers with a redirect to `SITE`.
OTHER_NAMES = ("https://www.finchaf.com", "https://finchaf.ru", "https://www.finchaf.ru")
KEEP = 3
RELEASE = re.compile(r"^[0-9a-f]{12}$")
POLICIES = ("Content-Security-Policy", "Referrer-Policy", "Permissions-Policy")
# A certificate just issued or a dropped connection is not a bad release.
ATTEMPTS = 3
PAUSE_SECONDS = 5


class Answer(NamedTuple):
    status: int
    headers: Message
    body: bytes


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args: object, **_kwargs: object) -> None:
        return None


OPENER = urllib.request.build_opener(NoRedirects)


def say(message: str) -> None:
    print(f"deploy: {message}", flush=True)


def die(message: str) -> NoReturn:
    print(f"deploy: {message}", file=sys.stderr, flush=True)
    raise SystemExit(1)


def git(*args: str) -> str:
    return subprocess.run(
        ("git", *args), cwd=REPO, capture_output=True, text=True, check=True
    ).stdout.strip()


def remote(command: str) -> str:
    result = subprocess.run(("ssh", HOST, command), capture_output=True, text=True, check=False)
    if result.returncode != 0:
        die(f"on the server: {command}\n{result.stderr.strip()}")
    return result.stdout


def require_clean_main() -> None:
    if git("rev-parse", "--abbrev-ref", "HEAD") != "main":
        die("not on main: a release is what main holds")
    if git("status", "--porcelain"):
        die("the tree has changes: commit or stash them first")
    git("fetch", "--quiet", "origin", "main")
    if git("rev-parse", "HEAD") != git("rev-parse", "origin/main"):
        die("main and origin/main differ: the server runs what GitHub has")


def require_server() -> None:
    state = remote(f"test -d {ROOT}/releases && echo ready || echo missing").strip()
    if state != "ready":
        die(f"no {ROOT}/releases: docs/01-architecture/infrastructure.md, «Первый запуск»")


def releases() -> list[str]:
    """The releases on the server, the one live most recently first."""
    return [name for name in remote(f"ls -1t {ROOT}/releases").split() if RELEASE.match(name)]


def live() -> Optional[str]:
    target = remote(f"readlink {ROOT}/current || true").strip()
    return target.rsplit("/", 1)[-1] or None


def upload(release: str, current: Optional[str]) -> None:
    """Copy out/ into a release of its own, whole or not at all.

    Files with the content of the live release become hard links to it. Only the content counts:
    every build gives a file a new time, and modes are set on the server, so neither is sent and
    rsync compares checksums.
    """
    incoming = f"{ROOT}/releases/.incoming"
    remote(f"rm -rf {incoming} && chmod 755 {ROOT} {ROOT}/releases")
    command = ["rsync", "-rl", "--checksum"]
    if current:
        command.append(f"--link-dest={ROOT}/releases/{current}/")
    subprocess.run((*command, f"{OUT}/", f"{HOST}:{incoming}/"), check=True)
    # Caddy's root has dropped the right to read past the modes, so only «others» lets it in.
    remote(f"chmod -R a+rX,go-w {incoming} && mv -T {incoming} {ROOT}/releases/{release}")


def switch(release: str) -> None:
    """Point `current` at a release: `mv` is one rename, where `ln -f` deletes first."""
    remote(
        f"cd {ROOT} && touch releases/{release} && ln -sfn releases/{release} current.next"
        " && mv -T current.next current"
    )


def prune() -> None:
    for release in releases()[KEEP:]:
        remote(f"rm -rf {ROOT}/releases/{release}")


def fetch(url: str, **headers: str) -> Answer:
    named = {name.replace("_", "-"): value for name, value in headers.items()}
    request = urllib.request.Request(url, headers={"User-Agent": "portfolio-deploy", **named})
    try:
        with OPENER.open(request, timeout=15) as response:
            return Answer(response.status, response.headers, response.read())
    except urllib.error.HTTPError as error:
        return Answer(error.code, error.headers, error.read())


def policies() -> dict[str, str]:
    text = (REPO / "deploy" / "Caddyfile.test").read_text(encoding="utf8")
    return {name: re.findall(rf'^\s*{name} "(.+)"$', text, re.M)[0] for name in POLICIES}


def header_problems(address: str, answer: Answer, expected: dict[str, str]) -> list[str]:
    found = [
        f"{address}: {name} differs from deploy/Caddyfile.test"
        for name, value in expected.items()
        if answer.headers.get(name) != value
    ]
    if "max-age=31536000" not in (answer.headers.get("Strict-Transport-Security") or ""):
        found.append(f"{address}: no Strict-Transport-Security")
    if answer.headers.get("X-Content-Type-Options") != "nosniff":
        found.append(f"{address}: no X-Content-Type-Options")
    if answer.headers.get("Server"):
        found.append(f"{address}: names its server")
    return found


def page_problems(page: str, answer: Answer, status: int, expected: dict[str, str]) -> list[str]:
    found = header_problems(page, answer, expected)
    if answer.status != status:
        found.append(f"{page}: {answer.status}, not {status}")
    return found


def redirect_problems(address: str, answer: Answer, status: int, location: str) -> list[str]:
    if answer.status == status and answer.headers.get("Location") == location:
        return []
    return [f"{address}: {answer.status} to {answer.headers.get('Location')}, not {location}"]


def site_problems(built: bool) -> list[str]:
    """What the live site gets wrong; with `built`, its pages must also be the bytes of out/."""
    expected = policies()
    found: list[str] = []
    pages = json.loads((REPO / "expected-build.json").read_text(encoding="utf8"))["pages"]

    for page in pages:
        if page.startswith(("_", "404")):
            continue
        address = "/" + page.removesuffix(".html")
        answer = fetch(SITE + address)
        found += page_problems(address, answer, 200, expected)
        if built and answer.body != (OUT / page).read_bytes():
            found.append(f"{address}: not this build")

    missing = fetch(f"{SITE}/ru/no-such-page")
    found += page_problems("the 404", missing, 404, expected)
    if built and missing.body != (OUT / "404.html").read_bytes():
        found.append("the 404: not this build")

    for language, target in (("ru-RU,ru;q=0.9", "/ru"), ("en-US,en", "/en"), ("de-DE", "/en")):
        found += redirect_problems(
            f"/ for {language}", fetch(f"{SITE}/", Accept_Language=language), 302, target
        )
    found += redirect_problems("/ with no language", fetch(f"{SITE}/"), 302, "/ru")
    found += redirect_problems("/ru/flow/", fetch(f"{SITE}/ru/flow/"), 308, "/ru/flow")

    script = re.search(rb'src="(/_next/static/[^"]+)"', fetch(f"{SITE}/ru").body)
    if script:
        asset = fetch(SITE + script.group(1).decode(), Accept_Encoding="br")
        if "immutable" not in (asset.headers.get("Cache-Control") or ""):
            found.append(f"{script.group(1).decode()}: not kept for a year")
        if asset.headers.get("Content-Encoding") != "br":
            found.append(f"{script.group(1).decode()}: not compressed")
    else:
        found.append("/ru: names no script")

    for name in OTHER_NAMES:
        found += redirect_problems(
            name, fetch(f"{name}/ru/flow?r=deploy"), 301, f"{SITE}/ru/flow?r=deploy"
        )
    found += redirect_problems("plain HTTP", fetch("http://finchaf.com/ru"), 308, f"{SITE}/ru")
    return found


def verified(built: bool) -> bool:
    found: list[str] = []
    for attempt in range(ATTEMPTS):
        if attempt:
            time.sleep(PAUSE_SECONDS)
        try:
            found = site_problems(built)
        except (OSError, http.client.HTTPException) as error:
            found = [f"no answer: {error}"]
        if not found:
            return True
    print("\n".join(f"  {problem}" for problem in found), file=sys.stderr)
    return False


def deploy() -> int:
    require_clean_main()
    require_server()
    release = git("rev-parse", "--short=12", "HEAD")
    previous = live()
    if previous == release:
        say(f"{release} is live already")
        return 0

    if subprocess.run((sys.executable, "scripts/check.py"), cwd=REPO, check=False).returncode != 0:
        die("the gates are red: nothing was sent")
    if git("status", "--porcelain"):
        die("the gates changed the tree: nothing was sent")

    if release in releases():
        say(f"{release} is on the server already")
    else:
        say(f"uploading {release}")
        upload(release, previous)
    switch(release)
    say(f"switched {previous or 'nothing'} → {release}, checking {SITE}")

    if verified(built=True):
        prune()
        say(f"{release} is live: {SITE}")
        return 0
    if previous is None:
        die(f"{release} failed its checks and there is no release to go back to; it stays linked")
    switch(previous)
    # Kept, it would be next in line for --rollback.
    remote(f"rm -rf {ROOT}/releases/{release}")
    die(f"{release} failed its checks and is gone; {previous} is live again")


def rollback() -> int:
    require_server()
    current = live()
    earlier = [release for release in releases() if release != current]
    if not earlier:
        die("no earlier release on the server")
    switch(earlier[0])
    say(f"rolled back {current} → {earlier[0]}, checking {SITE}")
    if not verified(built=False):
        die(f"{earlier[0]} is live, but it failed its checks")
    say(f"{earlier[0]} is live: {SITE}")
    return 0


def status() -> int:
    require_server()
    current = live()
    for release in releases():
        mark = "live" if release == current else "    "
        result = subprocess.run(
            ("git", "log", "-1", "--format=%cs %s", release),
            cwd=REPO,
            capture_output=True,
            text=True,
            check=False,
        )
        print(f"{mark} {release} {result.stdout.strip()}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--status", action="store_true", help="what is live, what is kept")
    action.add_argument("--rollback", action="store_true", help="back to the release before")
    options = parser.parse_args()
    if options.status:
        return status()
    if options.rollback:
        return rollback()
    return deploy()


if __name__ == "__main__":
    sys.exit(main())

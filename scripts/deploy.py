#!/usr/bin/env python3
"""Put the site on the server: a release of its own, then one atomic switch (ADR-0005).

    python3 scripts/deploy.py             the gates, the build, the upload, the switch, the checks
    python3 scripts/deploy.py --status    what is live and which releases are kept
    python3 scripts/deploy.py --rollback  back to the release that was live before this one
    python3 scripts/deploy.py --tag-only <commit> <YYYY-MM-DD>   the tag of a past release

It releases a clean main that GitHub also has. Everything it touches on the server is under `ROOT`:
Caddy and the containers belong to the product and never hear of it. A release's modified time says
when it last went live, so the newest is `current` and the next one is what --rollback goes to.
The checks read every answer from outside, over HTTPS, and compare the headers with
deploy/Caddyfile.test: the server's copy of that block lives in poranaparu/backend.
A release that passed gets a signed tag named by its day in Moscow, `YYYY.MM.DD`, then `.2`, `.3`,
and a GitHub release that lists the commits since the tag before. That step never touches the
server, and when it fails, --tag-only finishes it.
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
from datetime import date, datetime
from email.message import Message
from pathlib import Path
from typing import NamedTuple, NoReturn
from zoneinfo import ZoneInfo

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "out"
HOST = "poranaparu-prod"
ROOT = "/opt/poranaparu/portfolio"
SITE = "https://finchaf.com"
PLAIN = SITE.replace("https://", "http://", 1)
# Every other name of the site: each answers with a redirect to `SITE`.
OTHER_NAMES = ("https://www.finchaf.com", "https://finchaf.ru", "https://www.finchaf.ru")
KEEP = 3
RELEASE = re.compile(r"^[0-9a-f]{12}$")
POLICIES = ("Content-Security-Policy", "Referrer-Policy", "Permissions-Policy")
# A certificate just issued or a dropped connection is not a bad release.
ATTEMPTS = 3
PAUSE_SECONDS = 5
# A release's tag is the day it went live, in the owner's time.
ZONE = "Europe/Moscow"
TAG = re.compile(r"^\d{4}\.\d{2}\.\d{2}(\.\d+)?$")
TAGS = "[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]*"
SUBJECT = re.compile(r"^(\w+)(?:\(([^)]*)\))?!?: (.+)$")
# The sections of a release's notes, by the types of its commits; any other type goes to Other.
SECTIONS = (
    ("Features", ("feat",)),
    ("Fixes", ("fix",)),
    ("Performance", ("perf",)),
    ("Refactoring", ("refactor",)),
    ("Docs", ("docs",)),
    ("Tests", ("test",)),
    ("Tooling", ("ci", "build", "chore")),
)


class Answer(NamedTuple):
    status: int
    headers: Message
    body: bytes


class Inputs(NamedTuple):
    """What the checks compare the live site with, read before anything on the server changes."""

    policies: dict[str, str]
    # Each page's address, with the bytes it must answer with when the build is checked.
    pages: dict[str, bytes | None]
    missing: bytes | None


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args: object, **_kwargs: object) -> None:
        return None


OPENER = urllib.request.build_opener(NoRedirects)


def say(message: str) -> None:
    print(f"deploy: {message}", flush=True)


def warn(message: str) -> None:
    print(f"deploy: {message}", file=sys.stderr, flush=True)


def die(message: str) -> NoReturn:
    warn(message)
    raise SystemExit(1)


class Failed(Exception):
    """A command that ended with an error, and what it said."""


def run(*command: str) -> str:
    try:
        result = subprocess.run(command, cwd=REPO, capture_output=True, text=True, check=False)
    except OSError as error:
        raise Failed(f"{command[0]}: {error.strerror}") from None
    if result.returncode != 0:
        raise Failed(f"{' '.join(command)}\n{result.stderr.strip()}")
    return result.stdout.strip()


def git(*args: str) -> str:
    try:
        return run("git", *args)
    except Failed as error:
        die(str(error))


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


def live() -> str | None:
    target = remote(f"readlink {ROOT}/current || true").strip()
    return target.rsplit("/", 1)[-1] or None


def upload(release: str, current: str | None) -> None:
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
    if subprocess.run((*command, f"{OUT}/", f"{HOST}:{incoming}/"), check=False).returncode != 0:
        die("rsync failed: the release was not sent, the live one is untouched")
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
    found: dict[str, str] = {}
    for name in POLICIES:
        values = re.findall(rf'^\s*{name} "(.+)"$', text, re.M)
        if not values:
            die(f'deploy/Caddyfile.test has no line {name} "...": nothing to check the site with')
        found[name] = values[0]
    return found


def read_inputs(built: bool) -> Inputs:
    """Everything the checks need, so a broken file stops the run before the switch."""
    expected = policies()
    try:
        names = json.loads((REPO / "expected-build.json").read_text(encoding="utf8"))["pages"]
        pages = {
            "/" + page.removesuffix(".html"): (OUT / page).read_bytes() if built else None
            for page in names
            if not page.startswith(("_", "404"))
        }
        missing = (OUT / "404.html").read_bytes() if built else None
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        die(f"cannot read what the checks compare with: {error!r}")
    return Inputs(expected, pages, missing)


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


def site_problems(inputs: Inputs) -> list[str]:
    """What the live site gets wrong; with the bytes of a build, its pages must also be them."""
    expected = inputs.policies
    found: list[str] = []

    for address, body in inputs.pages.items():
        answer = fetch(SITE + address)
        found += page_problems(address, answer, 200, expected)
        if body is not None and answer.body != body:
            found.append(f"{address}: not this build")

    missing = fetch(f"{SITE}/ru/no-such-page")
    found += page_problems("the 404", missing, 404, expected)
    if inputs.missing is not None and missing.body != inputs.missing:
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
    found += redirect_problems("plain HTTP", fetch(f"{PLAIN}/ru"), 308, f"{SITE}/ru")
    return found


def verified(inputs: Inputs) -> bool:
    found: list[str] = []
    for attempt in range(ATTEMPTS):
        if attempt:
            time.sleep(PAUSE_SECONDS)
        try:
            found = site_problems(inputs)
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
    inputs = read_inputs(built=True)

    if release in releases():
        say(f"{release} is on the server already")
    else:
        say(f"uploading {release}")
        upload(release, previous)

    try:
        switch(release)
        say(f"switched {previous or 'nothing'} → {release}, checking {SITE}")
        good = verified(inputs)
    except BaseException:
        # An error or Ctrl-C before the checks passed: the release was never seen working.
        warn(f"stopped before {release} passed its checks")
        back_out(release, previous)
        if previous:
            warn(f"{release} is gone, {previous} is live again")
        raise
    if good:
        prune()
        say(f"{release} is live: {SITE}")
        publish()
        return 0
    back_out(release, previous)
    if previous is None:
        die(f"{release} failed its checks")
    die(f"{release} failed its checks and is gone; {previous} is live again")


def back_out(release: str, previous: str | None) -> None:
    """Bring `previous` back and drop `release`: kept, it would be next in line for --rollback."""
    if previous is None:
        warn(f"there is no release to go back to: {release} stays linked")
        return
    switch(previous)
    remote(f"rm -rf {ROOT}/releases/{release}")


def rollback() -> int:
    require_server()
    current = live()
    earlier = [release for release in releases() if release != current]
    if not earlier:
        die("no earlier release on the server")
    inputs = read_inputs(built=False)
    switch(earlier[0])
    say(f"rolled back {current} → {earlier[0]}, checking {SITE}")
    try:
        good = verified(inputs)
    except BaseException:
        # Going forward again would bring back the release this run is leaving.
        warn(f"stopped before {earlier[0]} passed its checks: it is live, unchecked")
        raise
    if not good:
        die(f"{earlier[0]} is live, but it failed its checks")
    say(f"{earlier[0]} is live: {SITE}")
    return 0


def notes(commit: str) -> str:
    """The subjects of the commits since the tag before `commit`, or since the root, by type."""
    try:
        since = run("git", "describe", "--abbrev=0", f"--match={TAGS}", f"{commit}^")
        span = f"{since}..{commit}"
    except Failed:
        span = commit
    lines: dict[str, list[str]] = {title: [] for title, _ in SECTIONS}
    lines["Other"] = []
    for subject in run("git", "log", "--reverse", "--no-merges", "--format=%s", span).splitlines():
        match = SUBJECT.match(subject)
        kind, scope, text = match.groups() if match else ("", None, subject)
        title = next((title for title, kinds in SECTIONS if kind in kinds), "Other")
        lines[title].append(f"- {scope}: {text}" if scope else f"- {text}")
    return "\n\n".join(
        f"## {title}\n\n" + "\n".join(items) for title, items in lines.items() if items
    )


def tag(commit: str, day: date) -> str:
    """Tag `commit` and give it a release on GitHub; a step done already is skipped."""
    run("git", "fetch", "--quiet", "origin", "refs/tags/*:refs/tags/*")
    own = [name for name in run("git", "tag", "--points-at", commit).split() if TAG.match(name)]
    text = notes(commit)
    if own:
        name = own[0]
        say(f"{commit[:12]} carries {name} already")
    else:
        stem = day.strftime("%Y.%m.%d")
        taken = set(run("git", "tag", "--list", f"{stem}*").split())
        name = stem
        number = 2
        while name in taken:
            name = f"{stem}.{number}"
            number += 1
        # The notes' headings start with #, which the default cleanup would take for comments.
        message = f"{name}\n\n{text}"
        run("git", "tag", "--sign", "--cleanup=whitespace", "--message", message, name, commit)
    run("git", "push", "--quiet", "origin", f"refs/tags/{name}")
    try:
        run("gh", "release", "view", name, "--json", "tagName")
    except Failed:
        run("gh", "release", "create", name, "--verify-tag", "--title", name, "--notes", text)
    return name


def publish() -> None:
    """The tag of the release just checked: whatever goes wrong here, the release stays live."""
    commit = "HEAD"
    day = "<YYYY-MM-DD>"
    try:
        commit = run("git", "rev-parse", "--short=12", "HEAD")
        today = datetime.now(ZoneInfo(ZONE)).date()
        day = today.isoformat()
        say(f"tagged {tag(commit, today)}")
    except Exception as error:
        warn(f"{commit} is live, but its tag is not done:\n{error}")
        warn(f"finish it with: python3 scripts/deploy.py --tag-only {commit} {day}")


def tag_only(commit: str, day: str) -> int:
    """Tag a release that went live before this step existed, or whose tag failed."""
    try:
        when = date.fromisoformat(day)
    except ValueError:
        die(f"{day} is not a day: YYYY-MM-DD")
    if when > datetime.now(ZoneInfo(ZONE)).date():
        die(f"{day} has not come yet")
    full = git("rev-parse", "--verify", f"{commit}^{{commit}}")
    git("fetch", "--quiet", "origin", "main")
    ancestor = ("git", "merge-base", "--is-ancestor", full, "origin/main")
    if subprocess.run(ancestor, cwd=REPO, check=False).returncode != 0:
        die(f"{commit} is not on origin/main: only main is released")
    try:
        say(f"tagged {tag(full, when)}")
    except Failed as error:
        die(str(error))
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
    action.add_argument(
        "--tag-only",
        nargs=2,
        metavar=("COMMIT", "DAY"),
        help="tag a past release: its commit and the day it went live, YYYY-MM-DD",
    )
    options = parser.parse_args()
    if options.status:
        return status()
    if options.rollback:
        return rollback()
    if options.tag_only:
        return tag_only(*options.tag_only)
    return deploy()


if __name__ == "__main__":
    sys.exit(main())

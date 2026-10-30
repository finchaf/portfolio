---
name: si
description: Land the in-flight work — commit, push, open the PR, watch CI, fast-forward main, clean up
argument-hint: [уточнения — необязательно]
disable-model-invocation: true
context: fork
agent: shipper
---

# Ship the in-flight work

**assess → commit → push → PR → CI → land on `main` → clean up → report.**

Adjustments, and what the caller knows that this context does not:

$ARGUMENTS

Invoking this skill authorises the pipeline. **Never land a red PR**: fix it or hand it back.
This run has no question tool: anything that needs the owner, a red check whose fix is not
mechanical, a conflict that is not «keep both» — stop with the work where §0 can resume it, and end
the report with what you saw.

## 0. Assess

```
git status -sb
BR=$(git branch --show-current); echo "$BR"
git log --oneline main..HEAD
gh pr list --head "$BR" --state all --json number,state,url
```

| State                            | Start at                                  |
| -------------------------------- | ----------------------------------------- |
| On `main` with changes           | **Stop.** Move the work to a branch first |
| Dirty tree                       | 1                                         |
| Commits not on `origin/<branch>` | 2                                         |
| Pushed, no PR                    | 3                                         |
| PR open                          | 4                                         |
| PR merged                        | 6                                         |

## 1. Commit

Only when the tree is dirty. `python3 scripts/check.py` first; never write the gates out by hand.
Atomic Conventional Commits, as `/nt` §7: message through a file, the `Co-Authored-By` line, signed.
Check `git log --format='%h %G? %s' main..HEAD`: every line must read `G`.

**Public repository:** read `git diff main...HEAD --stat` and the messages as a stranger would.
Anything private → stop.

## 2. Push

```
git push -u origin "$BR"
```

After a rewrite add `--force-with-lease`. Over SSH: the `gh` token has no `workflow` scope, so HTTPS
would refuse a change to `.github/workflows/`.

## 3. Open the PR

Reuse an open one. Otherwise, title in Conventional-Commit style, in English:

```
gh pr create --base main --head "$BR" --title "type(scope): summary" --body "$(cat <<'EOF'
## What
- …
## Why
- …
## Verification
- the gates, and what was looked at in the browser
## Docs
- what was updated, or "n/a"

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 4. CI

```
gh pr checks "$BR" --watch
```

A timed-out watch is not a red check: read the state again. Commit messages red → rewrite the
message and push with `--force-with-lease`. Anything else red → reproduce with the gates, fix, commit,
push, watch again.

## 5. Land on `main`

⚠️ **Not `gh pr merge`.** GitHub's rebase merge rewrites commits and drops their signatures, and the
ruleset requires signed commits. `main` moves by fast-forward: the commits CI saw land as they are.

```
git fetch origin main
git merge-base --is-ancestor origin/main HEAD || echo behind
```

Behind → `git rebase origin/main`, the gates again, `git push --force-with-lease`, back to 4: a
rebase makes new commits, and CI has to see them.

Up to date and green:

```
git push origin "$BR":main
gh pr view "$BR" --json state,mergedAt
```

GitHub marks the PR merged by itself. A refusal from the ruleset is reported, never worked around.
«Commits must have verified signatures» with a local `G` means the key is not in the account as a
signing key (`docs/06-quality/ci-and-tooling.md`, «Коммиты»): that is the owner's to fix.

## 6. Clean up

```
git switch main
git pull --ff-only origin main
git branch -d "$BR"
git push origin --delete "$BR"
git status -sb
```

`-d` must succeed: the fast-forward keeps the SHAs. «Remote ref does not exist» means GitHub already
deleted the branch.

**The private part:** `git -C docs/private status -sb`. Commits there not on GitHub →
`git -C docs/private push`. Uncommitted work there is the owner's to mention, not to sweep in.

## 7. Report

Short, in Russian: commits, PR number and URL, each check's result, the SHA on `main`, the branch
deleted, the private part's state, the local state. Once the site is deployed, name that the change
is not live until `python3 scripts/deploy.py`. Last line: «следующую задачу — в новой сессии».

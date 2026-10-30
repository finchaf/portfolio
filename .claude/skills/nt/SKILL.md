---
name: nt
description: Start a task — ramp up, branch, ask what needs deciding, build, sync the docs, run the gates, commit atomically, stop before the push
argument-hint: [суть задачи]
disable-model-invocation: true
---

# Start a new task

**take the plan's item → ramp up → branch → ask → build → docs → gates → commit → stop → report.**

The owner hands over a task and expects a branch whose commits they can read and judge: nothing
pushed, nothing merged, no surprises. Talk to the owner in **Russian**. Code, identifiers, commit
messages and PR text stay **English**, docs stay **Russian**.

The task is below. If it holds several tasks, enumerate them and account for each at the end.

$ARGUMENTS

⚠️ **One task, one session.** Every call rereads the whole history, so the next task starts in a new
session. If this session has already worked another task, say so before the ramp-up.

## 0. Take the item

The plan is `docs/07-roadmap/README.md`; there is no tracker (ADR-0007). Find the item the task
belongs to and name it. No item → add one to its stage in the same branch. A task that continues
an existing branch → switch to it instead of cutting a second one.

## 1. Ramp up

Nothing here is optional, and none of it comes from memory.

```
git log --since='2 days ago' --stat
git log --oneline -25
git status --porcelain
gh pr list --state open
```

- **The knowledge base decides.** Read `CLAUDE.md`, `docs/README.md`, the ADR journal and the
  documents the task lives in:

  | Task                              | Read                                       |
  | --------------------------------- | ------------------------------------------ |
  | Any decision                      | `docs/01-architecture/decisions/README.md` |
  | A page or an address              | `docs/05-features/README.md`               |
  | A file, a folder                  | `docs/02-project-structure/repository.md`  |
  | An animation, an effect           | `docs/04-design-system/motion.md`          |
  | An image, a video                 | `docs/03-data/media.md`                    |
  | A gate, CI, a budget              | `docs/06-quality/ci-and-tooling.md`        |
  | The server, Caddy, a domain       | `docs/01-architecture/infrastructure.md`   |
  | A text, a case, what may be shown | `docs/private/README.md`                   |

- **The code:** find the nearest existing code and read it in full. New work mirrors what shipped.
- **Verify progress from the repository**, never from a document or a memory. A `**Статус:**` line
  says whether a spec describes code that exists.

## 2. Branch — never work on `main`

```
git switch -c <type>/<short-kebab-slug>
```

The type is the Conventional-Commit type the work will carry; the slug names the task.

## 3. Ask what needs the owner's decision

Batch the questions right after the ramp-up, with concrete options and a recommendation first. Ask
about visual choices, wording, scope, money, anything expensive to redo. Do not ask what the docs
or the code already settle: decide, and name the decision in the report. Large or ambiguous task →
sketch the plan in a few lines first.

## 4. Build to the bar

- Everything in `CLAUDE.md`, «Hard rules». **This repository is public:** write every file, commit
  and comment for strangers to read.
- **The site stays static**, and the first screen never waits for animation.
- **Every effect** passes the list in `docs/04-design-system/motion.md`.
- **No text in code:** strings in `messages/`, long texts in `content/`, both languages.
- Generated files are never edited by hand.
- Smallest correct change wins. Match the surrounding code's idiom and comment density.

## 5. Sync the docs

The knowledge base must describe the shipped code. Move a spec's status line when its code lands.
Tick the plan's item. A changed decision is a **new** ADR, or a dated `## Дополнение` for a finding
after the fact; an accepted ADR is never rewritten. A new gate goes into `scripts/check.py` and
`docs/06-quality/ci-and-tooling.md` in one change.

Content decisions go to `docs/private`, committed there separately. Nothing from it is copied,
quoted or linked here.

## 6. Run the gates

`python3 scripts/check.py`; `--fast` mid-work, never at the end. Never write the gate commands out
by hand. Report each gate's real result, and name anything skipped. A failure that is not this
branch's doing is proved on a clean `main`, not asserted.

**If the UI changed, look at it:** the build, not `next dev`, at phone width and at desktop width,
with `prefers-reduced-motion`. Anything about feel needs a real phone: say so instead of claiming it.

## 7. Commit atomically, then stop

- One logical change per commit: `<type>(<scope>): <subject>`, imperative, at most 72 characters,
  lower case after the colon, no period. Body lines at most 100 characters.
- ⚠️ Write the message to a file in the session's scratchpad and commit with `-F`: bodies carry
  backticks and `$`, and `-m` mangles them.
- Every commit ends with the `Co-Authored-By` line of whichever model is running.
- **Signed.** Check with `git log --format='%h %G? %s' main..HEAD`: every line reads `G`. Never pass
  `-c commit.gpgsign=false`. A blocked commit means the key fell out of the agent:
  `ssh-add --apple-use-keychain ~/.ssh/id_ed25519_github`.
- **Do not push, open a PR or merge.** The owner reads the branch first; pushing is `/si`'s.

## 8. Report

Short, in Russian: what was done per task, key decisions, commits with SHA, on which branch, **not
pushed**, docs updated, the gates' table, what is left. Then the next step: review, `/ar` for a
heavier pass, `/si` to land it. End with «следующую задачу — в новой сессии».

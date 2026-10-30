---
name: ar
description: Audit and refactor everything not yet in main — correctness, naming, motion, accessibility, budgets, public safety, docs drift
argument-hint: [что именно проверить — необязательно]
disable-model-invocation: true
context: fork
agent: auditor
---

# Audit and refactor the in-flight work

**scope → audit → report → refactor → sync the docs → run the gates → close out.**

What to narrow to, and what the caller knows that this context does not:

$ARGUMENTS

This run has no question tool: the «Decide» items close the report, each with its options and a
recommendation, and the caller asks the owner.

## 1. Scope

Exactly the in-flight change set, never untouched code: `git log --oneline main..HEAD`,
`git diff --stat main...HEAD`, `git status --porcelain`, `git diff`. Read each changed file **in
full**. Read the plan's item in `docs/07-roadmap/README.md`, and work it did not ask for is named.

## 2. Dimensions

Anchor each finding to `file:line` and a concrete reason.

- **Correctness:** logic, edge cases, hydration mismatches, effects that are never cleaned up.
- **Static build:** anything needing a server, a route that stopped being static (ADR-0002).
- **Motion:** every effect against the list in `docs/04-design-system/motion.md`; one owner per
  element, tokens instead of numbers, content visible without JavaScript.
- **Accessibility:** keyboard, focus, contrast, `prefers-reduced-motion`, names of controls.
- **Performance:** budgets in `docs/06-quality/ci-and-tooling.md`, heavy code behind dynamic imports,
  layout-triggering animation, media without known sizes.
- **Languages:** no text in code, both languages complete.
- **Comments:** every comment against the code beneath it. A stale comment is a defect.
- **Naming and structure:** `docs/02-project-structure/repository.md`.
- **Completeness:** TODOs, stubs, dead code, duplication, anything the change made unreachable.
- **Public safety:** nothing private in files, comments or commit messages. Other people's code,
  shaders, images or fonts without clear rights are a **Fix now**.
- **Docs drift, both ways:** the code against its spec, and a sentence about the code that was never
  true. A status line that lies counts.

## 3. Report first

Group by dimension, most severe first. **Fix now:** clear and high-confidence. **Decide:** judgement
calls. Say what came back clean: an audit that lists only findings reads as one that only looked
where it found them.

## 4. Refactor

Apply **Fix now**, matching the surrounding code. No scope creep into untouched code. Atomic commits,
signed, message through a file, as `/nt` §7. Never on `main`. A message describes its whole diff.

## 5. Sync the docs

Reconcile every changed area with its document. A changed decision is a new ADR or a dated
«Дополнение»; an accepted ADR is never rewritten.

## 6. Run the gates

`python3 scripts/check.py`, and report each result. If the UI changed, look at the build: a refactor
that «cannot have changed anything visible» is the one worth looking at.

## 7. Close out

Short, in Russian: scope, what was fixed, what came back clean, what awaits a decision, docs, gates.
Leave the branch green. Do not push.

# Portfolio

[![Gates](https://github.com/zibliclub/portfolio/actions/workflows/gates.yml/badge.svg)](https://github.com/zibliclub/portfolio/actions/workflows/gates.yml)

Personal site of Danil Zablotsky, design engineer. It will live at
[finchaf.com](https://finchaf.com).

This repository is public on purpose: the way a site is built is part of the work. It starts where
the work started, with decisions. The site's code comes next, and the
[plan](docs/07-roadmap/README.md) shows what is done.

## Decisions

The reasoning is written down before the code, in [`docs/`](docs/README.md), in Russian. The short
version:

| Question | Answer | Why |
| --- | --- | --- |
| How does it run? | Static export of Next.js, served as plain files by Caddy | Everything rich happens in the browser, so a server would add risk and no ability. [ADR-0002](docs/01-architecture/decisions/0002-static-export-on-caddy.md) |
| What is it built with? | Next.js, React, TypeScript, Tailwind CSS, next-intl, MDX | Full control, in Russian and English. [ADR-0003](docs/01-architecture/decisions/0003-stack-as-in-the-web.md) |
| How does it move? | CSS, Motion, GSAP and three.js, each with its own zone | The cheapest tool that can do the job, loaded only where needed. [ADR-0004](docs/01-architecture/decisions/0004-motion-stack.md) |
| How does it ship? | From a laptop, by switching a symlink | No downtime, instant rollback, no server key in CI. [ADR-0005](docs/01-architecture/decisions/0005-atomic-deploy-from-laptop.md) |
| How is quality held? | One command runs every gate, in CI too | Budgets and accessibility are checked, not hoped for. [ADR-0007](docs/01-architecture/decisions/0007-process-and-gates.md) |

## Working here

```
git config core.hooksPath .githooks
python3 scripts/check.py
```

Commits are signed, atomic [Conventional Commits](https://www.conventionalcommits.org/). `main` is
linear and moves only by fast-forward after CI, so the commits on it are the ones CI checked. The
[`.claude/`](.claude) folder holds the process for [Claude Code](https://claude.com/claude-code):
`/nt` starts a task, `/ar` audits it, `/si` lands it, `/rf` studies an effect on another site and
rewrites it from scratch.

## License

The code is [MIT](LICENSE). That covers code only: the texts, documents, case studies, images, video,
the logo and the visual design are © Danil Zablotsky, all rights reserved. Learn from it freely, and
please make your portfolio your own. GSAP is a dependency under its own
[license](https://gsap.com/standard-license), not MIT.

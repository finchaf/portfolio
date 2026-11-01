---
title: Resume
heading: Resume
command: `continue`
when: A limit, a closed session, a sleeping laptop, an error
---

A long stage could break anywhere. So before each step it wrote `doing` to [[state|state.json]], after the step it wrote `done` and what came out, and committed straight away.

Any step could be repeated without harm: it first checked whether it was already done and finished it rather than duplicating it. Scripts looked nodes up by name and created only what was missing.

`continue` read the state, compared it with the file and went on from the first unfinished step. If the stage was waiting for me, it said what for and did nothing else.

You can try it here: reload the page mid-run, then type `continue`.

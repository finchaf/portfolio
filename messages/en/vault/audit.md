---
title: Audit
heading: Audit
---

What a machine could check was not checked by eye. 89 of the 234 rules carried the #script mark. Scripts ran until their output was empty, then every frame was viewed up close.

| Script             | What it caught                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `audit.js`         | Elements jammed against an edge, stray opacity, clipped shadows, fills without variables |
| `layout-audit.js`  | Frame geometry: margins, steps, sizes                                                    |
| `check-screens.py` | The map: every feature in the spec is one tap away                                       |
| `typo-scan.js`     | Hanging prepositions and single-word lines                                               |

A note that could be measured got a script check. The rest went to the [[critic|critic]].

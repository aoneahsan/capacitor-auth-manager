---
name: aoneahsan-cccs-debugging
description: 'Use at the first sign of any bug, test failure, missing-permission or missing-index error, 403/401, silent no-op, or unexpected behaviour — before proposing or writing any fix. Also when a previous fix did not work, or a green build contradicts a real-world failure.'
metadata:
  source: superpowers:systematic-debugging (obra, MIT), adapted with the owner's live-probe patterns from rules/data-fetch-budget.md, fileshub-api.md, services-integrations.md
---

# Debugging

## Overview

Random fixes waste time and create new bugs; a symptom patch hides the real defect. Find the root cause
first, prove it with evidence, then fix at the source. In a multi-component system, add instrumentation at
each boundary and let the evidence say where it breaks — never guess.

**The standard:** no fix without a root-cause investigation first. A fix you can't tie to a reproduced cause
is a guess.

## When to use

- Any bug, test failure, crash, build failure, or unexpected behavior.
- `missing or insufficient permissions`, `requires an index`, a 403/401, or a silent no-op.
- A previous fix didn't hold, or you don't fully understand the issue.
- A green typecheck/lint/build coexists with a real failure (the trap below).

**Especially under pressure** — "just one quick fix" and "fix it NOW" are exactly when guessing costs most.

## The four phases (complete each before the next)

1. **Root cause** — read the full error/stack; reproduce consistently; check recent changes (`git diff`);
   in a multi-layer system, instrument each boundary once to locate the failing layer; trace the bad value
   back to its source.
2. **Pattern** — find similar working code in the same repo; read any reference implementation completely.
3. **Hypothesis** — state the specific cause and the single change that should fix it, and why.
4. **Fix at the source** — implement the minimal fix, then verify against the original symptom (see
   `aoneahsan-cccs-verification`).

## The traps that fake success (owner-proven — memorize)

| Trap | Reality |
|---|---|
| Green build / typecheck / lint | Proves nothing for runtime, rules, or fire-and-forget calls — see below |
| A `(200, 0)` probe | A query returning **zero** rows passes a rules check vacuously — **seed data, then re-probe** |
| Fire-and-forget integration "looks done" | `void send(...)` swallows a 403; only a **live call** proves it — grep for the pattern, don't assume |
| Testing a user flow as an admin | Admin bypasses the rules gate; the bug is invisible — test as a **non-admin** |
| "The origin list is broken" (every origin 403s) | An extra identity header (e.g. `X-App-Id`) may be the rejected factor — **probe with `Origin` only** |

## Live-probe method

The owner's projects debug rules/permissions/integration failures by **probing the live system**, not by
reading the rule: issue the exact request twice (as the app sends it, and with one variable changed) and
compare status codes — 403 vs 200 is the whole test. Full patterns + the Firestore/FilesHub specifics:
`references/root-cause-and-probes.md`.

## Common mistakes

| Mistake | Instead |
|---|---|
| Proposing a fix before reproducing | Reproduce first; no repro → gather more data, don't guess |
| Fixing the symptom (where the error surfaced) | Trace to the source and fix there |
| Trusting a green build as "it works" | Exercise the real flow / make the live call |
| Reading a rule to decide if a query is allowed | Probe it live as a non-admin: 403 vs 200 |

## Going deeper

- `references/root-cause-and-probes.md` — the 4 phases in full, boundary instrumentation, and the owner's
  Firestore/FilesHub live-probe recipes (seed-then-probe, `Origin`-only, non-admin, fire-and-forget).

## Related skills

`aoneahsan-cccs-verification` (prove the fix before claiming it) · `aoneahsan-cccs-fix-reported-issues`
(the reported-issues queue) · `aoneahsan-cccs-firestore` / `aoneahsan-cccs-fileshub` (the rules/permission
specifics these probes target).

<!-- Living registries (link, never copy): ~/.claude/rules/data-fetch-budget.md, fileshub-api.md, services-integrations.md when present. -->

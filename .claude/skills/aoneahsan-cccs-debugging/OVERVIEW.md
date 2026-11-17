# Overview — `aoneahsan-cccs-debugging`

## Purpose

Stops the waste of random fixes. A symptom patch masks the real defect and often spawns a new one; a fix
tied to a reproduced root cause holds. It also captures the owner's hard-won traps where a green build or a
passing probe lies — bugs that static gates cannot catch and that only running the app as a real user
reveals.

## What this skill does

- Enforces root-cause investigation before any fix (the four phases: root cause → pattern → hypothesis →
  source fix).
- Instruments each boundary in a multi-component system so evidence, not a guess, names the failing layer.
- Carries the owner's fake-success traps: green-build-proves-nothing, vacuous `(200,0)` probe,
  fire-and-forget swallowed 403, admin-masks-rules-bug, `X-App-Id`-poisons-the-probe.
- Prescribes the live-probe method — issue the real request twice, change one variable, compare 403 vs 200.

## When it gets invoked

- Any bug, test failure, crash, or unexpected behavior; a 403/401, missing-permission, or requires-an-index error.
- "why isn't this working" / "it worked before" / "the fix didn't hold".
- A green build coexisting with a real failure.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any; the probe recipes target Firestore rules and FilesHub, but the method is general. |
| Stack override | The four phases are stack-independent; probe against the project's chosen backend. |

## Sources

| Source | Record |
|---|---|
| superpowers:systematic-debugging (obra, MIT) | folded 2026-07-23 |
| owner rules (data-fetch-budget, fileshub-api, services-integrations) | live-probe + fake-success traps distilled (pointers, not copies) |

## Related skills

- `aoneahsan-cccs-verification` — proves the fix with fresh evidence before any "done".
- `aoneahsan-cccs-fix-reported-issues` — root-causes entries in the reported-issues queue.
- `aoneahsan-cccs-firestore` / `aoneahsan-cccs-fileshub` — the rules/permission surfaces these probes target.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/data-fetch-budget.md`, `fileshub-api.md`,
  `services-integrations.md`.
- **Last reviewed:** 2026-07-23

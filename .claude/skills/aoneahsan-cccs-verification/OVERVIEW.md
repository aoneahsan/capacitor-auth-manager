# Overview — `aoneahsan-cccs-verification`

## Purpose

Keeps "done" honest. A completion claim without fresh evidence is dishonesty, not efficiency — and the owner
has explicitly lost trust to false completions ("I don't believe you"). This skill makes evidence precede
every success claim and folds in the owner's rule that "tests pass" is not "requirements met."

## What this skill does

- Enforces the gate: identify the proving command → run it fresh this turn → read the full output → verify →
  only then claim, with the evidence attached.
- Names the owner's one-shot gates (`typecheck`/`lint`/`build`, zero warnings) and the run-to-verify grant
  for exercising a change for real.
- Requires a line-by-line re-read of the original request and a Completed / Remaining / Not-done / Verification report.
- Carries the red-flag list and the rationalization table that catch the moment before a false claim.

## When it gets invoked

- About to say done/fixed/works/passing/ready — or any synonym or implication of success.
- Before commit, push, deploy, PR, tracker completion, or handing back to the owner.
- After a subagent reports success (verify independently).

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any — the gate is universal; substitute the project's real gate commands. |
| Stack override | Use the chosen stack's build/test commands; the discipline is unchanged. |

## Sources

| Source | Record |
|---|---|
| superpowers:verification-before-completion (obra, MIT) | folded 2026-07-23 |
| owner rules (dev-workflow: gates, run-to-verify, Task-Completion-Verification) | merged (pointers, not copies) |

## Related skills

- `aoneahsan-cccs-debugging` — root-cause a failure before verifying its fix.
- `aoneahsan-cccs-git-workflow` — verification is the step before the one commit.
- `aoneahsan-cccs-code-review` — an independent second check on the same work.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/dev-workflow.md`.
- **Last reviewed:** 2026-07-23

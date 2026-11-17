# Overview — `aoneahsan-cccs-task-planning`

## Purpose

Turns an approved design into a plan an implementer with no prior context can execute, and makes multi-session
work resumable. The plan carries exact paths and complete content; the tracker carries execution state so a
later session resumes instead of re-planning. It maps the superpowers plan/execute discipline onto the owner's
Fable-plans / Opus-executes split and drops the TDD step scaffolding that conflicts with the no-automated-tests
rule.

## What this skill does

- Structures a plan into bite-sized, independently verifiable tasks with exact paths, complete content, and
  declared interfaces between tasks.
- Puts global constraints (version floors, data-fetch limit, banned packages, copy rules) at the top, inherited
  by every task.
- Replaces "write the failing test" steps with the owner's gate cycle (typecheck/lint/build + run-to-verify).
- Scaffolds and maintains the resumable `docs/features/<slug>/00-tracker.json` as the single source of resume
  truth; marks human-only sub-tasks `awaitingUser`/`blocked`.
- Executes by resuming the first pending sub-task, checkpointing at task boundaries, never re-planning.

## When it gets invoked

- "plan this" / "write the implementation plan" / an approved design ready to build.
- Any task touching 3+ files or spanning 2+ sessions.
- "continue / resume this feature" — read the tracker.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any. |
| Stack override | Steps use the project's chosen stack's gate commands and idioms. |

## Sources

| Source | Record |
|---|---|
| superpowers:writing-plans + executing-plans (obra, MIT) | folded 2026-07-23; TDD-first step scaffolding removed |
| owner rules (feature-trackers, model-workflow, dev-workflow, no-automated-tests) | anchored (pointers, not copies) |

## Related skills

- `aoneahsan-cccs-brainstorming` — the approved design that feeds the plan.
- `aoneahsan-cccs-documentation` — the tracker schema and fixed doc paths.
- `aoneahsan-cccs-subagent-orchestration` — dispatching plan tasks to agents with disjoint scopes.
- `aoneahsan-cccs-verification` — the gate at the end of each step.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/feature-trackers.md`, `dev-workflow.md`.
- **Last reviewed:** 2026-07-23

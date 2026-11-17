---
name: aoneahsan-cccs-task-planning
description: 'Use when a task spans multiple sessions, has independently resumable phases, carries architecture or recovery risk, or when an approved design needs turning into an implementation plan — and when resuming such work. Covers exact-path plans, when a tracker is warranted, preserving owner decisions, and verification checkpoints.'
metadata:
  source: superpowers:writing-plans + executing-plans (obra, MIT), adapted to the owner's plan/tracker conventions and the no-automated-tests rule (TDD step scaffolding removed)
---

# Task Planning

## Overview

Write a plan an implementer with zero prior context can execute: exact file paths, concrete changes per step,
the interfaces between tasks, and a gate cycle at meaningful boundaries. The plan lives in
`~/.claude/plans/`; multi-session execution state lives in a resumable tracker. Use the configured
planning/review model to plan and the configured execution model to implement; an explicit owner model choice
always wins.

**The standard:** a plan has no placeholders; a task expected to outlive the current session or containing
independently resumable phases has `docs/features/<slug>/00-tracker.json`; on re-entry read it and resume the
first pending sub-task.

## When to use

- An approved design (from `aoneahsan-cccs-brainstorming`) needs an implementation plan.
- A task will span 2+ sessions, contains multiple independently resumable phases, or has high recovery risk.
- Resuming multi-session work — read the tracker first.

**Not for:** a single-file bugfix, a typo/rename, or a one-shot change (no tracker needed).

## Writing the plan

- **Meaningful, independently verifiable steps:** make the change → run the relevant gate → record the
  checkpoint. Do not fragment a coherent edit into artificial 2-minute tasks.
- **Exact paths always**; complete content in every step (real code, not "add error handling"). No `TBD`,
  no "similar to Task N", no reference to a symbol no task defines.
- **Interfaces between tasks:** each task states what it consumes from earlier tasks and what it produces
  (names + types), because the implementer sees only its own task.
- **Bounded context packet:** name exact instruction/decision/tracker sections, target + shared pattern files,
  excluded broad trees, current-phase skills, and later-phase skills deferred. Never write "read everything
  relevant." Adjacent implementation batches reuse one continuing heavy agent by default.
- **Global constraints up front:** version floors, the data-fetch limit, banned packages, naming/copy rules —
  copied verbatim from the design; every task inherits them.
- **Gate cycle, not test-first.** The owner writes no automated tests unless asked, so a step's verification
  is `typecheck`/`lint`/`build` (+ run-to-verify when the change can be exercised) — never a "write the
  failing test" step. Add tests only when the design explicitly calls for them.
- **Self-review** the finished plan against the design: coverage (every requirement has a task), placeholder
  scan, and type/name consistency across tasks. Fix inline.

## The tracker is the execution state

Scaffold `docs/features/<slug>/00-tracker.json` before implementation begins and include it in the task's
single final commit (schema:
`aoneahsan-cccs-documentation/references/formats.md`): phases, sub-tasks, statuses, `userDecisions`,
`runHistory`, resume instructions. Human-only sub-tasks are `awaitingUser` + `blocked` and also listed in
`docs/MANUAL-TASKS.md`. The long design/spec belongs in the plan file or `00-overview.md`, not scattered.

## Executing

1. Read the plan + tracker; find the first `pending`/`in_progress` sub-task. **Never re-plan from zero.**
2. Review critically — if a step is a blocker, ambiguous, or contradicts the constraints, stop and ask
   (`aoneahsan-cccs-ask-the-owner`); don't force through.
3. Execute each step, run its gate, mark it complete, append a `runHistory` row. Checkpoint for review at
   meaningful task boundaries. Commit once after the whole prompt is complete
   (`aoneahsan-cccs-git-workflow`), unless the owner explicitly requests a different split.

## Common mistakes

| Mistake | Instead |
|---|---|
| "Add appropriate error handling" / "write tests for the above" | Show the exact code; no vague or TDD-scaffold steps |
| Re-planning from scratch on re-entry | Read the tracker, resume the first pending sub-task |
| A symbol used in Task 7 but defined nowhere | Every task declares what it produces (names + types) |
| Long spec scattered across chat/CLAUDE.md | It lives in the plan file / `00-overview.md` |

## Going deeper

- `references/plan-structure.md` — the plan header, per-task shape (Files / Interfaces / gated steps), and
  the self-review checklist.

## Related skills

`aoneahsan-cccs-brainstorming` (produces the approved design) · `aoneahsan-cccs-documentation` (the tracker
schema + fixed paths) · `aoneahsan-cccs-subagent-orchestration` (dispatching tasks to agents in disjoint
scopes) · `aoneahsan-cccs-verification` (the per-step gate).

<!-- Living registries (link, never copy): ~/.claude/rules/feature-trackers.md, dev-workflow.md when present. -->

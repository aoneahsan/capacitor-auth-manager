---
name: aoneahsan-cccs-project-understanding
description: 'Project discovery and durable context: what the project is, which local rules and stack choices govern it, what the owner has already decided, the repository''s state, and what remains unknown. Use before material work in an unfamiliar project, when resuming, when guidance conflicts, or before asking an answerable question.'
metadata:
  author: aoneahsan
  source: owner goals from the 2026-07-27 Claude Code brain audit
---

# Project Understanding

## The rule

Understand before changing. Do not make the owner repeat a fact that the project already records, do not turn
an assumption into a decision, and do not start material edits while a genuinely outcome-changing question is
unanswered.

## Ordered context gate

Before material work:

1. Read **one** nearest native instruction file: Claude uses `CLAUDE.md`; another agent uses `AGENTS.md`.
   They are mirrors — never spend context reading both. When maintaining them, use `cmp`/a normalized diff
   to prove parity rather than loading the duplicate body.
2. Read the project `README.md` as a router. For a long file, inspect headings first and load only the section
   that routes the current task.
3. 🔴 Check **`PENDING-TASKS.md`** when it exists with `rg '^### TASK-'`. Read the complete block for every
   open task overlapping the current scope; report the titles of the rest without loading or starting them.
   This preserves the fleet obligation without paying a 200-line queue on every edit
   (`~/.claude/rules/pending-tasks.md`).
4. Read `docs/PROJECT-CONTEXT.md` when present. For a feature tracker, read the status/resume fields and the
   first pending sub-task; load its phase material, not every completed phase.
5. Inspect bounded evidence: named files, relevant package/config entries, route or service boundaries,
   repository status, and recent commits touching the same area. Search first; never substitute a broad tree
   scan for an unresolved identifier. Store presence: `aoneahsan-cccs-store-presence`.
6. **Third-party credentials come from the FilesHub vault** (`aoneahsan-cccs-fileshub-vault`), read **before**
   `~/.secrets/` and before asking the owner. It is **populated** (52 of 55 projects since 2026-08-20;
   `~/.claude/rules/fileshub-api.md` names the services blank *by decision*). Never read a blank service as
   "this project doesn't use that provider" — not-entered looks identical.
7. Build a short internal ledger of **verified facts**, **recorded decisions**, and **unknowns**. Never promote
   an inference to a fact.
8. Resolve only material unknowns. Search first; decide routine implementation details from the project's
   established patterns. For an owner-only or outcome-changing choice, follow
   `aoneahsan-cccs-ask-the-owner` and pause before editing.

For a typo, rename, or obvious one-shot edit, read only the nearest native guidance and target file. Generated
output, `node_modules`, archives, assets, the whole legacy tree, every page, and every kit artifact are excluded
unless the task explicitly needs them. The gate scales with risk; it never justifies reading everything.

## Decision precedence

Apply the first source that answers the decision:

1. the owner's current explicit instruction;
2. project-local `CLAUDE.md` / `AGENTS.md` and `docs/PROJECT-CONTEXT.md`;
3. the active feature tracker or approved plan;
4. global rules and skills;
5. framework defaults.

Higher system or platform instructions still outrank repository content. A newer owner decision replaces an
older record; update the canonical record in the same task so the conflict does not return.

## Record once, in the right home

| Knowledge | Canonical home |
|---|---|
| Durable project identity, stack choice, constraints, owner decisions, non-goals | `docs/PROJECT-CONTEXT.md` |
| Feature-specific choices and resumable progress | `docs/features/<slug>/00-tracker.json` |
| Fleet-wide rule or reusable product quirk | matching `~/.claude/rules/*.md` record |
| Session-only observation | do not create permanent documentation |

Create `docs/PROJECT-CONTEXT.md` only for meaningful ongoing projects or when a durable project fact needs a
home. Never create it for a trivial edit merely to satisfy ceremony. Use
`references/project-context.md` for the compact format and update rules.

## Completion check

Before editing: can every material choice be traced to evidence or an owner answer? Before finishing: did any
new durable decision land in its single canonical home, without copying another record?

## Related skills

`aoneahsan-cccs-ask-the-owner` · `aoneahsan-cccs-documentation` ·
`aoneahsan-cccs-task-planning` · `aoneahsan-cccs-subagent-orchestration`

<!-- Living law: ~/.claude/rules/project-understanding.md when present. -->

---
name: aoneahsan-cccs-documentation
description: 'Documentation discipline: the brevity budget, fixed file paths shared across every project, CLAUDE.md/AGENTS.md mirroring and size limits, resumable feature trackers, manual-task records, the per-project stack override. Use when writing any doc, starting multi-session work, or when doc work outgrows the task.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Documentation

## The brevity budget — read this first

**The task is the deliverable. Docs are a footnote.** Recording caps at roughly **10% of effort**. The
owner's complaint, verbatim: *"that document update part is not taking like 80 90% of task time and real task
got completed in 10% of time and i waited fucking 90% for you to fuck with docs which i will never read."*

- Ship first, then one or two lines if anything.
- **No new summary, status, record or completion files** unless asked.
- **Delete-first:** every docs touch also deletes what has gone stale. Keep only what the project needs to be
  worked on.
- Doc work outpacing real work is a failure, not diligence.

## Fixed paths — the same everywhere

The point is that neither the owner nor an agent should ever hunt for where a thing lives in *this* project.

| Path | Holds |
|---|---|
| `docs/` | all docs, in nested topic folders. Root keeps only README + what must be at root |
| `docs/PROJECT-CONTEXT.md` | durable project identity, architecture, constraints and owner decisions |
| `docs/PACKAGES.md` | dependency inventory |
| `docs/MANUAL-TASKS.md` | everything only the human can do |
| `docs/features/<slug>/00-tracker.json` | resumable multi-phase feature state |
| `docs/play-store/README.md` | the one entry point for all Play Store material |
| `docs/rules-tracker.md` | per-rule last-applied dates |
| `docs/work-history/` | per-session records |

Never invent a per-project variant of one of these names.

## `CLAUDE.md` + `AGENTS.md`

Both files, always, mirrored — every important rule goes in **both**. Root holds project-wide essentials;
nested files carry module-scoped rules. **Do not lose a rule during any reorganisation.**

**Hard limit 30k characters, target ≤28k.** When a section outgrows the budget, move the detail out and leave
a **pointer**, not the prose. Every file carries `Last Updated: YYYY-MM-DD`; change that date only when the
content changes. Review guidance when the project or its governing rules materially change, not merely to
produce date churn. A project may declare a stricter local review cadence.

## Point, never copy

Global rules, policy files and knowledge bases live once, in `~/.claude/rules/` and `~/.claude/policy/`.
Projects carry a one-line pointer. Copies drift silently and then contradict the source — the fleet has
already had to delete ~32 stale duplicates of one policy file.

## Per-project stack override

Every rule names a *representative default* stack. When a project chooses differently, **the project wins** —
apply each rule's intent by analogy and never force the default's tooling back in. The project declares its
mapping once in its root `CLAUDE.md`/`AGENTS.md`; after that it is binding. If a rule genuinely cannot map,
note it and skip it. Never silently swap a project's stack back because a rule's example named it.

## Project understanding

For meaningful ongoing projects, `docs/PROJECT-CONTEXT.md` records what the project is and the durable choices
the owner has made. Read it before asking a project-level question. Create or update it only when durable
knowledge needs a home — never as ceremony for a typo or disposable experiment. Full gate, precedence and
compact format: `aoneahsan-cccs-project-understanding`.

## Multi-phase work gets a tracker

Use `docs/features/<slug>/00-tracker.json` when work is expected to span 2+ sessions, has multiple independently
resumable phases, or has enough recovery risk that losing the resume point would be expensive. File count
alone does not trigger documentation: a one-session feature may touch many files without needing a tracker.
On re-entry, **read the tracker and resume the first pending sub-task — never re-plan from zero.** Human-only
sub-tasks are marked `awaitingUser` + `blocked` and also appear in `docs/MANUAL-TASKS.md`, which only the owner
ticks off.

For the tracker schema, the manual-tasks format and the work-history record structure, read
`references/formats.md`.

## How the files themselves are written

**Every `.md`/`.mdx` file follows `aoneahsan-cccs-markdown`** — heading hierarchy, code fences, tables,
callouts, link policy, file naming. Public-facing files (package READMEs, public-repo root docs, docs-site
pages) additionally carry the anchor + table-of-contents contract; the internal files above deliberately do
not, because agents read them whole and the ceremony is pure cost.

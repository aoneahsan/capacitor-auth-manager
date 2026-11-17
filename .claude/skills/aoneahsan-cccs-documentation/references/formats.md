# Document formats

## Project context — `docs/PROJECT-CONTEXT.md`

Use the compact contract in
`aoneahsan-cccs-project-understanding/references/project-context.md`. It records durable project identity,
architecture, constraints, owner decisions, key paths and verification without copying global rules or
feature-specific state.

Create or update it only when durable knowledge needs a home. `Last Updated` changes with content, not on a
calendar-only refresh.

## Feature tracker — `docs/features/<slug>/00-tracker.json`

```jsonc
{
  "$schema": "<slug>-tracker",
  "description": "Resumable tracker. The first phase/sub-task with status 'pending' or 'in_progress' is the next thing to work on.",
  "module": "<slug>",
  "createdAt": "YYYY-MM-DD",
  "lastUpdated": "YYYY-MM-DD",
  "planFile": "/abs/path/to/plan.md",
  "userDecisions": { "...": "locked choices — do not re-ask" },
  "knownRisks": ["..."],
  "phases": [
    {
      "id": "phase01",
      "title": "...",
      "status": "complete | in_progress | pending | blocked",
      "completedAt": "YYYY-MM-DD",
      "subTasks": [
        { "id": "phase01.1", "title": "...", "status": "pending",
          "note": "what was actually done + anything discovered",
          "awaitingUser": false }
      ]
    }
  ],
  "runHistory": [
    { "date": "YYYY-MM-DD", "phase": "phase01", "summary": "...", "commit": "<sha>" }
  ],
  "resumeInstructions": "1) Read planFile + this tracker. 2) Find the first pending sub-task. 3) Do that phase only. 4) Update statuses + append a runHistory row. 5) One commit."
}
```

The folder also carries `00-overview.md` (what and why, acceptance criteria) and one `phaseNN-*.md` per phase.

**Sub-task notes are the highest-value field.** Record what was found, not just that it was done — that is
what a future session needs and cannot recover from the diff.

## `docs/MANUAL-TASKS.md`

```markdown
# Manual / User-Only Tasks — <Project>
> The ONE place for everything only you can do. Fixed path: docs/MANUAL-TASKS.md.
> Last updated: YYYY-MM-DD

## Pending
| # | Task | Why only you | Runbook | Status |
|---|------|--------------|---------|--------|
| 1 | Upload the signed AAB | needs the keystore + Play Console | docs/play-store/RELEASE-STEPS.md | Not started |

## Completed
(move rows here with the date)
```

The agent **appends** rows, and ticks one off only when the owner confirms it done (then the same turn, without asking). Each row points at a runbook rather than duplicating the
commands.

## Work history — `docs/work-history/YYYY-MM-DD-WHXXX-short-slug.md`

Sections: metadata · executive summary · starting point · work completed · files changed · references ·
current status · next steps · technical notes · metrics · **continuation prompt** · document history.

The continuation prompt is the part that earns the file: a self-contained, copy-paste prompt naming this
record's path, the relevant trackers, what was finished, and the documented next steps.

## `CLAUDE.md` / `AGENTS.md` size check

```bash
wc -c CLAUDE.md AGENTS.md          # each under 28000, hard ceiling 30000
diff CLAUDE.md AGENTS.md           # expect only the mirror-reference line to differ
grep -c "Last Updated" CLAUDE.md   # must be present
```

Some projects symlink `AGENTS.md` to `CLAUDE.md`. That is one file and satisfies the rule — do not "fix" it.

## Project self-explanation

Project identity and durable decisions live in `docs/PROJECT-CONTEXT.md`. Re-check it after material
architecture, product, deployment or owner-decision changes — never re-run an audit solely because a fixed
number of days elapsed. A fresh session reads the current record and verifies only facts relevant to its task.

# Overview — `aoneahsan-cccs-fix-reported-issues`

## Purpose

Emptying the open-issue queue that `aoneahsan-cccs-report-project-issues` fills: any session opened in an
owned project checks `docs/REPORTED-ISSUES.md`, fixes what is open, and moves resolved entries to
`docs/RESOLVED-ISSUES.md` — so consumer-reported bugs actually get fixed at the source instead of
accumulating.

## What this skill does

- Detects open issues at session start (`grep "^### ISSUE-"`), backed by a `SessionStart` hook that injects
  a reminder — while making the file check, not the hook, the contract.
- Runs the fix on the owner's model workflow: **plan on the configured Fable model, implement on the
  configured Opus model** (explicit owner choice wins), main context,
  stack-matching skills invoked, root cause verified against code before trusting the entry's diagnosis.
- Requires verification with the project's own gates plus the entry's exact repro before an issue counts as
  fixed.
- Moves resolved entries — original body intact, resolution date + fixing version/deploy marker added — and
  never deletes history.
- Propagates: rules-KB quirk marked resolved, release per the project's own rules, owner-only steps to
  `docs/MANUAL-TASKS.md`.
- Handles the edges: not-a-bug entries resolve with explanation; blocked fixes stay open with a dated note
  and a paused owner question.

## When it gets invoked

- Session start in a project whose `docs/REPORTED-ISSUES.md` has open entries (the hook reminder).
- Being asked to check, work, or clear a project's reported issues.
- After filing an issue, when the owner says to fix it now.

## Where it applies

Every owned project — the queue path is fleet-wide, not specific to the three products that seeded it.

## Sources

`~/.claude/rules/project-issue-reporting.md` (the fleet rule) · files-hub's resolved-entry format (date +
deploy marker) · the owner's model-workflow rule (Fable role plans; Opus role implements; explicit owner
model choice wins).

## Related skills

`aoneahsan-cccs-report-project-issues` (filing) · `-ask-the-owner` (blocked fixes pause) · `-git-workflow`
(one commit; the move rides the fix commit) · `-packages-up-to-date` (when the fix ships as a version bump).

## Maintenance

Stable. Re-check if the owner changes the queue filenames, the detection marker, or the model workflow.

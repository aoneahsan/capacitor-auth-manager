# Project completion — overview

## Purpose

The owner wants every production project finished to one clear standard before any idea project or new
project starts. This skill is that standard: what category a project is, what "100%" means for that category,
which items are held (browser extension, iOS, Android for an extension), which gates override the score, and
how each point is proven live. Requested 2026-10-21 and first proved on LifeWell.

## What this skill does

- Confirms the project's category with the owner at the start of every finalization session
- Scores the project against its category's weighted criteria, with live evidence per row
- Keeps held items out of the work and out of suggestions until the owner asks in a new session
- Records the scorecard in the private `projects-finalization-record` repo
- Orders the remaining work and stops at the owner's store chain

## When it gets invoked

Finalizing a production project; "is it done", "what is left", "how complete is it"; deciding whether an
extension, Android or iOS build may start.

## References

- `references/categories.md` — the weighted criteria per category, held items, notes
- `references/standards-checklist.md` — what each criterion requires, and its owning skill
- `references/audit-procedure.md` — the proof for each criterion
- `references/scorecard-format.md` — the record-repo row, JSON and audit file
- `references/async-jobs.md` — long actions as server jobs with a Jobs page and a finish notification

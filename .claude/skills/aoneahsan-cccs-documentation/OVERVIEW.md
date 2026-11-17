# Overview — `aoneahsan-cccs-documentation`

## Purpose

Keeps documentation useful and small. Its two jobs are to stop doc work from consuming the task it is meant to
record, and to guarantee that every project puts the same artefact at the same path so nobody has to search.

## What this skill does

- Sets the **brevity budget** — recording caps at ~10% of effort, no unrequested summary or status files, and
  every docs touch deletes something stale.
- Fixes the shared paths every project uses: `docs/PACKAGES.md`, `docs/MANUAL-TASKS.md`,
  `docs/features/<slug>/00-tracker.json`, `docs/play-store/README.md`, `docs/rules-tracker.md`,
  `docs/work-history/`.
- Defines the `CLAUDE.md`/`AGENTS.md` contract: both files always, mirrored, root vs nested split, a 30k
  character ceiling with a 28k target, a `Last Updated` field, and a 3-day review cadence.
- States the **point-don't-copy** rule for global rules and policy files, with the stale-duplicate failure
  that motivated it.
- Carries the **per-project stack override**: rules describe concerns, the project's chosen stack supplies the
  mechanism, and the project's choice always wins.
- Requires a resumable tracker for any work spanning 3+ files or 2+ sessions, and forbids re-planning from
  zero when one exists.

## When it gets invoked

- Writing or updating any documentation, README, or `CLAUDE.md`/`AGENTS.md`.
- Starting work that will span multiple sessions or touch many files.
- Deciding where a new file belongs, or naming one.
- Doc/tracker work is starting to outweigh the actual task.
- Resuming a feature, or picking up an unfamiliar project.
- A rule's default stack does not match what the project actually uses.

## Where it applies

Every project. The fixed-path half is what makes fleet work across ~105 projects tractable.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-001, R-002, R-004, R-005, R-014, R-016, R-020,
R-037, R-042, R-043, R-047, plus §0 stack override) and `_source-understanding/files/prompt-logs.md` (the
brevity mandate, fixed fleet paths, the 7-day project-audit re-run guard).

## Related skills

`aoneahsan-cccs-git-workflow` (docs update in the same commit) · `aoneahsan-cccs-coding-standards` (the
`.env.example` half of the env contract) · every other skill, which points here for where its artefacts live.

## Maintenance

Re-check when a new fixed-path artefact is introduced fleet-wide.

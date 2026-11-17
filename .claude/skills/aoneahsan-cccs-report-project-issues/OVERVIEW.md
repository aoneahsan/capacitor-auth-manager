# Overview — `aoneahsan-cccs-report-project-issues`

## Purpose

Making sure a bug found in one of the owner's OWN projects — while consuming it elsewhere or testing it —
lands in that project's repo as an actionable, fully-detailed entry, instead of dying in a chat log or a
downstream workaround. Generic: applies to native-update, FilesHub, strata-storage, and every other owned
project.

## What this skill does

- Fixes the two fleet-wide paths: `docs/REPORTED-ISSUES.md` (open queue, `### ISSUE-NNN` sections) and
  `docs/RESOLVED-ISSUES.md` (history), created on first use, pointed at from the target's root `CLAUDE.md` +
  `AGENTS.md`.
- Defines the entry contract — verbatim symptom, repro, affected version, root cause where diagnosed (with
  evidence), suggested fix — so a zero-context session can fix it without re-discovery.
- Enforces the three-place discipline: the target repo's queue (actionable), the matching global rules-KB
  mirror (fleet-wide workaround knowledge), and the consumer's own conventions where they exist.
- Draws the public-repo line: honest queues are fine in public repos; secrets and private-project internals
  are not.
- Hands the fix side to `aoneahsan-cccs-fix-reported-issues`.

## When it gets invoked

- An integration or test run surfaces a bug/quirk/wrong behaviour in an owned package or platform.
- Deciding where a cross-project finding should be recorded.
- A workaround is about to be committed downstream for a bug that belongs upstream.

## Where it applies

Every owned project, as the TARGET; every project, as the reporter.

## Sources

`~/.claude/rules/project-issue-reporting.md` (the fleet rule) · files-hub's pioneering
`docs/REPORTED-ISSUES.md` flow · strata-storage's LabFlow entry (the model for full-detail root-cause
reporting).

## Related skills

`aoneahsan-cccs-fix-reported-issues` (the other half) · `-fileshub` / `-native-update` / `-strata-storage`
(each routes its product's bugs here) · `-documentation` (fixed paths, pointers not copies).

## Maintenance

Stable. Re-check only if the owner changes the fixed filenames or the flow.

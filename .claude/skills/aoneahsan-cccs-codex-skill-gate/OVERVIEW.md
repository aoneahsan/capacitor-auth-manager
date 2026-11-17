# Overview — aoneahsan-cccs-codex-skill-gate

Makes Codex work from the same skills Claude Code has. Before each phase, it checks that the project holds
every owner skill the phase needs, at the notebook's current version, then has Codex read them before the first
edit.

## What this skill does

- Maps the phase's concerns (packages, UI, backend, database, store, words) to owner skills.
- Reads each copy's state from the version hash: current, stale, modified, or missing.
- Copies or refreshes missing and stale skills through `project-skills-sync.py add`. It keeps local fixes and
  links each skill for Codex discovery.
- Applies the privacy law: client repos never receive committed copies, public repos keep them local, private
  repos commit them.

## Where it fits

It is copied into every production repo as part of the core profile. `/sync-project-skills` refreshes the
whole fleet every 15 days (30 at most). This gate is the per-phase check between those runs.

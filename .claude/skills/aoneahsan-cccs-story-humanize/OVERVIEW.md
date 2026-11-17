# Story humanize — overview

## Purpose

The finalize gate for prose. Machine-written text has measurable tells (a flat sentence-length curve, a
predictable word list, budgeted punctuation used without a budget) and unmeasurable ones (no specifics, no
opinion, no hedging, no voice). This skill scores both halves and rewrites what fails without touching a
fact. The deterministic half is the same computation the lint hook runs on every draft write, so a writer
hears about it immediately and the finalizer confirms it at the end.

## What this skill does

- Score mode: a verdict per criterion — burstiness, range, banned phrases, em-dash and "not X but Y"
  budgets, triplet reflex, opener repetition, throat-clearing and summary tells, specificity, point of
  view, hedging, voice match, palette.
- Rewrite mode: fixes flagged criteria only, meaning and facts frozen, with a diff summary.
- Honours the `<!-- story-lint: allow "…" -->` marker so a deliberate exception is recorded, not fought.
- Names the fingerprint it checked against instead of claiming a detector score.

## When it gets invoked

- the finalizer, on every surface, before GATE 4
- "make it sound human", "less AI", "too generic", "too polished"
- the lint hook reported a failure
- a reviewer wants a measurement behind a rhythm complaint

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any prose a person reads; strictest on `docs/story/drafts/` |
| Stack override | Stack-independent |

## Sources

| Source | Record |
|---|---|
| The storytelling-system spec § Humanizing (burstiness first, then the list, then specificity and voice) | `global-audit-reports-records/storytelling-content-system/00-source-research.md` |
| The lint hook (the deterministic half, as code) | `global-config/hooks/posttooluse-story-lint.sh` |

## Related skills

- `aoneahsan-cccs-story-craft` — `aoneahsan-cccs-story-craft/references/humanize.md` teaches the method; this skill measures it.
- `aoneahsan-cccs-story-orchestration` — where the finalize pass sits.
- `aoneahsan-cccs-copywriting` — clarity edits, which are a different pass.

## Maintenance

- **Living registries this skill points at:** the banned list in `aoneahsan-cccs-story-craft` →
  `assets/banned-phrases.txt` (one file, two readers).
- **Last reviewed:** 2026-08-27

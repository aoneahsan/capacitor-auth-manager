# Story craft — overview

## Purpose

The router of the storytelling content system. Every other story skill assumes a writer who already knows
which structure fits the surface, what the project's emotional palette allows, and what makes prose read
human. This skill holds that knowledge in one place so no project reinvents it and no two projects drift
into the same voice by accident. Built 2026-08-27 from the owner's storytelling-system spec
(`global-audit-reports-records/storytelling-content-system/00-source-research.md`).

## What this skill does

- Routes a surface (UI copy, blog, store listing, CV, portfolio, README, social, email, mental-health) to its
  default structure and its reference file.
- Carries the seven craft references: story frameworks, copywriting frameworks, hooks and memorability,
  humanizing, AEO/SEO, emotional palette, safety.
- Owns `assets/banned-phrases.txt`, the single phrase list that the lint hook and the humanize skill both
  read.
- Enforces the pre-writing gate: Bible, fingerprint and content-map row loaded before the first sentence.
- Defines the three-line self-check every draft returns, including the `NEEDS DECISION` line for anything
  the writer would otherwise have to invent.

## When it gets invoked

- "write the onboarding copy" / "write a blog post about X" / "draft the store listing"
- "make this sound like us" / "less AI" / "it reads generic" / "give it some life"
- "in our voice" / "match this sample"
- Any user-visible text in a project that carries `docs/story/`

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project with a human reader — web, mobile, extension, docs site, portfolio, the owner's own writing |
| Stack override | Stack-independent; the surface files name the constraints a stack adds (store limits, MV3 rules) |

## Sources

| Source | Record |
|---|---|
| The storytelling-system spec (2026-08-27) | `global-audit-reports-records/storytelling-content-system/00-source-research.md` |
| Chip & Dan Heath, *Made to Stick* (SUCCESs); Loewenstein's curiosity-gap theory | distilled in `references/hooks-and-memorability.md` |
| Dan Harmon's Story Circle · Pixar Story Spine · Snyder's *Save the Cat* · Kishōtenketsu · Freytag | `references/frameworks.md` |
| Schwartz, *Breakthrough Advertising* (awareness levels); Miller, *StoryBrand* | `references/copywriting-frameworks.md` |
| Nielsen Norman Group (Morkes & Nielsen); Aarron Walter, *Designing for Emotion* | `references/aeo-seo.md`, `references/emotional-palette.md` |
| Seer Interactive 2026 · BrightEdge · AirOps · McKinsey 2025 · Ahrefs | `references/aeo-seo.md` (numbers carried with their source names) |

## Related skills

- `aoneahsan-cccs-story-orchestration` — the state machine, gates and role dispatch this craft feeds.
- `aoneahsan-cccs-story-bible` / `-story-content-map` / `-story-voice-registry` — the records a draft reads.
- `aoneahsan-cccs-story-humanize` — the scoring rubric applied at finalize.
- `aoneahsan-cccs-copywriting` — clarity + honesty, applied underneath every surface.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/storytelling-content.md`,
  `~/.claude/rules/publishing-compliance.md` (store words), `~/.claude/policy/*.json`.
- **Last reviewed:** 2026-08-27

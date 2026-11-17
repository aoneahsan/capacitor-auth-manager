---
name: aoneahsan-cccs-story-humanize
description: 'Scores and rewrites prose so it reads as written by a person: the burstiness rubric, the banned-phrase floor, specificity, point of view, restored hedging, em-dash and "not X but Y" budgets. Score mode returns a verdict per criterion; rewrite mode fixes without changing meaning or facts. Use at finalize on every surface, when copy reads generic or machine-written, when asked to make text sound human or "less AI", or when the story lint hook reports a failure on a draft.'
metadata:
  source: global-audit-reports-records/storytelling-content-system/00-source-research.md § Humanizing; the lint hook global-config/hooks/posttooluse-story-lint.sh computes the deterministic half of this rubric
---

# Story humanize

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

## Overview

Two halves. The **deterministic half** — sentence-length variance, banned phrases, dash and "not X but Y"
budgets, opener repetition, the summary-conclusion tell — is computed by the lint hook on every write to
`docs/story/drafts/` and again here in score mode. The **judgment half** — specificity, point of view,
hedging, voice match against the fingerprint, palette delivery — only a reader can score. Rewrite mode
fixes what score mode flagged, and nothing else.

**The standard:** every criterion passes or is allowed with a written reason; a rewrite changes no fact and
no meaning; "passes a detector" is never the claim — "reads as this voice" is.

## When to use

- The finalizer runs it on every surface before GATE 4 (rewrite mode, then score mode).
- "make this sound human", "less AI", "it reads generic", "too polished".
- The lint hook printed a report on a draft.
- A reviewer wants a number behind "the rhythm is flat".

**Not for:** clarity edits (`aoneahsan-cccs-copywriting`) or structure (`-story-craft` frameworks). It
does not touch facts — a wrong fact is the fact-checker's finding.

## Score mode — the rubric

| Criterion | Measure | Pass |
|---|---|---|
| Burstiness | sentence-length standard deviation ÷ mean | ≥ 0.45 |
| Range | per ~150 words: one sentence ≤ 6 words and one ≥ 25 | both present |
| Banned phrases | matches against `aoneahsan-cccs-story-craft` → `assets/banned-phrases.txt` | 0, or an allow marker with a reason |
| Em dashes | count per 150 words | ≤ 1 |
| "not X, but Y" | occurrences per 300 words | ≤ 1 |
| Triplet reflex | three-item lists per 500 words | ≤ 2 |
| Opener repetition | consecutive paragraphs starting with the same word | < 3 |
| Throat-clearing / summary | first sentence "In this post…", last paragraph "In conclusion…" | absent |
| Specificity | one concrete detail per section (~200 words) | present |
| Point of view | the writer visibly thinks something | present |
| Hedging | "about", "probably", "I think" — per 300 words | ≥ 1 where the voice hedges |
| Voice match | side by side with the fingerprint's sample sentences | a reader cannot tell them apart |
| Palette | each band lands where the Bible puts it | delivered |

Exact computations, the sentence-split rule and the score-sheet format: `references/rubric.md`.

## Rewrite mode — the constraints

- Meaning and every fact frozen. A rewrite that needs a new fact stops with `NEEDS DECISION`.
- Fix only flagged criteria; leave passing sentences alone.
- Vary length by splitting and merging, not by padding. Cut before adding.
- Replace a banned phrase with the plain word, or delete the clause — never with a synonym from the same
  register.
- Return a diff summary: what changed, which criterion it served.

## The allow marker

A draft may keep one banned phrase deliberately: `<!-- story-lint: allow "robust" -->` on its own line,
with the reason in the finalizer's "what changed and why". The hook honours the marker; the reviewer reads
the reason.

## What passing means

Prose a specific person could plausibly have written, checked against that person's sentences. Detectors
change monthly and disagree with each other; optimising for one is the failure mode. The three levers that
work — syntax variety, specificity, voice-matching — are the rubric's first, ninth and twelfth rows.

## Common mistakes

| Mistake | Instead |
|---|---|
| Swapping banned words for synonyms | Plain word or delete; then fix the rhythm, which was the real tell |
| Padding to create a long sentence | Merge two real ones; cut elsewhere |
| "Improving" a fact while humanizing | Facts are frozen; NEEDS DECISION |
| Claiming a detector score | Report the rubric, name the fingerprint it was checked against |

## Going deeper

- `references/rubric.md` — every measure computed exactly as the hook computes it, plus the judgment
  criteria's checklists and the score-sheet layout.

## Related skills

`aoneahsan-cccs-story-craft` (`aoneahsan-cccs-story-craft/references/humanize.md` is the craft method; this is the gate) ·
`-story-orchestration` (the finalizer step) · `-copywriting`

---
name: aoneahsan-cccs-story-craft
description: 'The craft router for story-driven content: hooks, structure, voice, emotional palette, humanizing, AEO — for UI copy, onboarding, blog posts, store listings, portfolio and README text, social posts, email sequences, CV bullets and mental-health surfaces. Use whenever writing or reviewing prose meant to move a reader, when a project carries docs/story/, when a specific voice or tone is asked for, or when existing copy reads generic or machine-written.'
metadata:
  source: global-audit-reports-records/storytelling-content-system/00-source-research.md (the 2026-08-27 spec) + the owner's product-voice rules (aoneahsan-cccs-copywriting)
---

# Story craft

🔴 **Floor:** `aoneahsan-cccs-custom-made`.

## Overview

Every piece of content a reader is meant to feel comes from the project's **Story Bible** — its audience,
core promise, emotional palette and voice fingerprint — and from one deliberately chosen structure. This
skill is the router: which framework fits the surface, what the palette allows, which reference to open.

**The standard:** no prose before the Bible; no banned phrase; one concrete specific per section; jagged
sentence rhythm; every fact real or marked; no joke on a safety surface.

## When to use

- Writing or reviewing onboarding, empty states, error copy, a landing page, a blog post, a store listing, a
  README's human parts, a portfolio page, a social post, an email sequence, a CV bullet.
- The owner asks for "our voice", "make it sound like us", "less AI", "more life", or hands over a sample to
  match.
- A project has `docs/story/` — then this skill is mandatory for every user-visible sentence.

**Not for:** clarity and honesty rules on plain technical prose — `aoneahsan-cccs-copywriting` owns those and
applies underneath this skill; formatting — `aoneahsan-cccs-markdown`; the per-page SEO content contract —
`aoneahsan-cccs-seo-content-writing`.

## Before writing — the three files

1. `docs/story/story-bible.md` — missing or unapproved → run `aoneahsan-cccs-story-bible` (`/story-init`) and
   **stop at GATE 1**. Never draft against a Bible the owner has not approved.
2. `docs/story/voice-fingerprint.md` — the 8–12 sample sentences, rhythm rules, diction do/don't.
3. The surface's row in `docs/story/content-map.md` — tone, length, CTA, framework, target questions. No row →
   `aoneahsan-cccs-story-content-map`, **stop at GATE 2**.

## 🔴 STOP list

- A fact, number, name or quote you would have to invent → write `NEEDS DECISION: <what you need>` instead.
- The surface is therapy, crisis, legal, medical, financial, or an error that cost the reader something →
  open `references/safety.md` first; humor is off; the palette's gravity band applies.
- The voice fingerprint says one thing and the request says another → NEEDS DECISION, never a quiet blend.
- A phrase in `assets/banned-phrases.txt` (the lint hook reads the same file) → cut it, or allow it with the
  documented marker and a reason.

## Surface → framework → reference

| Surface | Default structure | Open |
|---|---|---|
| Web app UI, onboarding, empty/error states | Walter's hierarchy (usable before pleasurable) + BAB for "what changes" | `references/surface-webapp-ui.md` |
| Mobile app + store listing | Schwartz awareness level → AIDA; store copy short and factual | `references/surface-mobile-app.md` |
| Browser extension | same as mobile; MV3 store rules | `references/surface-browser-extension.md` |
| Blog / article | Story Circle or Kishōtenketsu; answer-first under question H2s | `references/surface-blog.md` |
| CV / resume | Freytag-in-miniature per role: situation → action → measured result | `references/surface-cv-resume.md` |
| Portfolio | Hero's Journey with the client as hero; proof over adjectives | `references/surface-portfolio.md` |
| README / docs | PAS opener, then plain reference prose | `references/surface-readme-docs.md` |
| Social | In medias res; one hook formula; one CTA | `references/surface-social.md` |
| Email sequence | PAS or 4Ps across the sequence; one idea per email | `references/surface-email-sequence.md` |
| Therapy / mental health | Kishōtenketsu (no conflict framing); safety rules override everything | `references/surface-therapy-mental-health.md` |

Structures themselves: `references/frameworks.md` (Hero's Journey, Story Circle, Pixar spine with the
"therefore/but" test, Save the Cat, Kishōtenketsu, in medias res, Freytag) ·
`references/copywriting-frameworks.md` (AIDA, PAS, BAB, 4Ps, StoryBrand, Schwartz's five awareness levels).

## Craft rules that apply to every draft

- **Rhythm.** Mix a three-word sentence with a thirty-word one. Fragments on purpose. One-sentence
  paragraphs exist. Method: `references/humanize.md`.
- **Specificity.** Each section carries one detail only a person close to the product would know — a
  number with a unit, a named screen, a time of day, a real constraint.
- **Hook.** The first line must be un-scrollable-past; open a curiosity gap and close it before the end.
  Formulas: `references/hooks-and-memorability.md`.
- **Palette.** Deliver the Bible's ratio, not a flat "friendly". Where each tone goes, and when a joke is
  wrong: `references/emotional-palette.md`.
- **Answer directly** under a question heading before supporting detail; no fixed word count earns selection.
  Why it matters and the cited numbers: `references/aeo-seo.md`.
- **Honesty.** No fabricated statistic, no overclaim, no banned store word — `aoneahsan-cccs-copywriting`.

## Self-check (return it with every draft)

Four lines: palette match (which tones landed, where) · rhythm variety (shortest and longest sentence) ·
**length** (words per section vs the map row's cap) · unsure spots, each as `NEEDS DECISION: <question>`.

## Common mistakes

| Mistake | Instead |
|---|---|
| Drafting from the request alone | Load the Bible, fingerprint and map row first |
| A uniform 18-word sentence march | Vary length on purpose; read it aloud |
| "Friendly and professional" | The Bible's ratio, delivered beat by beat |
| A pun in an error that lost data | Safety reference; say what happened and how to fix it |
| Guessing a number to sound concrete | NEEDS DECISION |

## Going deeper

- `references/frameworks.md` — seven story structures, when each fits, the "therefore/but" beat test.
- `references/copywriting-frameworks.md` — six persuasion structures and the awareness ladder.
- `references/hooks-and-memorability.md` — curiosity gap, SUCCESs, nine hook formulas, retention devices.
- `references/humanize.md` — burstiness method, the fingerprint method, why blacklists alone fail.
- `references/aeo-seo.md` — answer-first, question H2s, schema, E-E-A-T, the 2026 citation numbers by source.
- `references/emotional-palette.md` — mixing humor/depth/light/dark, Walter's hierarchy, when not to joke.
- `references/safety.md` — crisis signposting, non-judgmental language, legal/medical/financial framing.
- `references/surface-*.md` — one file per surface (ten), each with tone, length, CTA and its own traps.

## Related skills

`aoneahsan-cccs-story-orchestration` (the workflow, gates, roles) · `-story-bible` · `-story-content-map` ·
`-story-humanize` · `-story-voice-registry` · `-story-personal-voice` (the owner's own voice) ·
`-copywriting` · `-react-aeo` · `-seo-content-writing`

<!-- Living law (link, never copy): ~/.claude/rules/storytelling-content.md when present. -->

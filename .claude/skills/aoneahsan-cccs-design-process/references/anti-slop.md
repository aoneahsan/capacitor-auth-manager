# Anti-slop — why AI interfaces look generic, and what to do instead

**Last Updated:** 2026-07-27

The failure is not incompetence, it is **defaulting**: the model reaches for the aesthetic that appears most
often in training data instead of reading the situation. The fix is to read the room first, then commit
hard.

## The design read — one line, before any code

> *"Reading this as: `<page kind>` for `<audience>`, with a `<vibe>` language, leaning toward
> `<aesthetic family>`."*

Examples:

- *B2B SaaS landing for technical buyers, restrained minimal language, leaning toward Tailwind utilities and
  a tight neutral scale.*
- *Solo designer portfolio for hiring managers, editorial/kinetic-type language, leaning toward custom CSS
  and scroll-driven motion.*
- *Public-sector service, trust-first language, leaning toward maximum legibility and zero ornament.*

Signals to read: **page kind** · **vibe words the owner used** ("playful", "premium", "brutalist",
"Linear-style") · **references they named** · **audience** — the audience picks the aesthetic, not personal
taste · **existing brand assets** — on a redesign these are starting material, not optional input ·
**quiet constraints** — accessibility-critical, regulated, kids, low-end devices. **Constraints override
aesthetic preference, always.**

If the read is genuinely ambiguous, ask **one** question, never a list.

## The three dials

Set them explicitly, from the read. Every density, layout and motion decision follows.

- **VARIANCE** 1–10 — perfect symmetry ↔ deliberate asymmetry
- **MOTION** 1–10 — static ↔ cinematic
- **DENSITY** 1–10 — art gallery ↔ cockpit

| Read | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| minimal / calm / editorial | 5–6 | 3–4 | 2–3 |
| premium consumer / luxury | 7–8 | 5–7 | 3–4 |
| playful / experimental / agency | 9–10 | 8–10 | 3–4 |
| landing page / portfolio (default) | 7–9 | 6–8 | 3–5 |
| trust-first / regulated / a11y-critical | 3–4 | 2–3 | 4–5 |
| dashboard / data product | 4–5 | 3–4 | 7–8 |
| redesign — preserve | match existing | +1 | match existing |

A **playful, modern, unique** brief means high variance and real motion — but density stays low and the
accessibility floor never moves.

## The anti-default list

These are the tells. Reaching for any of them means the read was skipped:

- AI-purple / indigo→violet gradient on everything
- Centred hero over a dark mesh or aurora blob
- Three equal feature cards in a row
- Glassmorphism applied uniformly
- Inter + slate-900 as the unconsidered default
- Emoji used as interface icons
- A generic SaaS hero → logos → features → testimonials → CTA skeleton with nothing specific in it
- Infinite-loop micro-animations with no meaning

## Reaching past the default

**Colour.** Start from the brief's emotion, not from a hue you like. One unique palette per project, claimed
in `~/.claude/palettes/project-palettes.json` by **OKLCH hue angle**. Build a full ramp, not three tints.
Pick a genuine accent that carries the personality, and verify contrast in both themes — a "playful" palette
that fails 4.5:1 is not playful, it is unusable.

**Typography.** The single highest-leverage differentiator, because almost nobody changes it. A deliberate
pairing, a modular scale, generous line-height, a comfortable measure — plus typographic correctness (curly
quotes, en/em dashes used correctly, no straight apostrophes). That last group is most of why competent text
still reads as "AI wrote this".

**Layout.** Asymmetry, overlap, and a real editorial grid beat another 12-column three-card row. Vary
rhythm: full-bleed against constrained, dense against airy.

**Motion.** Meaning over decoration — spatial continuity, state change, attention direction. 150–300 ms for
UI feedback; transform and opacity only; `prefers-reduced-motion` honoured at the token layer. One
memorable, deliberate moment beats twelve ambient loops.

**Detail.** The things that read as "custom": considered empty states, a loading state with personality, a
branded 404, hover and focus states that feel intentional, and microcopy in the product's own voice.

## Scope honesty

This method is strongest for landing pages, marketing sites and portfolios. **Dashboards, data tables and
multi-step product UI are governed by density and legibility first** — high variance there is a defect, not
personality. Set the dials accordingly rather than applying one aesthetic everywhere.

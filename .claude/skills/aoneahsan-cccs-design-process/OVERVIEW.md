# Overview — `aoneahsan-cccs-design-process`

## Purpose

UI work in these projects kept failing in two specific ways: output that looked templated because the model
defaulted instead of reading the situation, and rework because nobody agreed what was being built before it
was built. Both are process failures, not taste failures. This skill supplies the missing spine — a staged
design process with a gate at each step, so requirements, direction, structure, and tokens are settled
before a component is written, and the result is reviewed by running it rather than reading it.

It deliberately does **not** restate visual direction. `aoneahsan-cccs-frontend-design` owns that (Tailwind
plus custom components, the unique per-project palette, the six acceptance criteria). This owns the order,
the artefacts, and the gates.

## What it does

- Defines seven stages — grill, brief, architecture, tokens, tasks, build, review — each with one artefact
  and one gate that must pass before the next stage opens.
- Fixes where design artefacts live: `docs/design/` for project-wide identity, the feature folder for
  feature-scoped design. No third location.
- Supplies the anti-slop method: the one-line design read, the variance/motion/density dials with a
  read-to-dial table, and the explicit list of AI-default tells to avoid.
- Carries the specifics for colour (OKLCH hue claiming against the global registry, full ramps, contrast in
  both themes), typography (pairing, scale, measure, typographic correctness), and motion (meaning over
  decoration, transform/opacity only, reduced-motion at the token layer).
- Requires user flows to be written entry → steps → success → failure, which is what catches the screens
  nobody planned.
- Gives stage 7 a concrete run-it checklist across six breakpoints, keyboard, contrast, and every empty,
  loading and error state.
- Maps each stage to the house skills to invoke, and to the optional external craft depth available through
  the cloned-skills library.

## When it is invoked

- Starting any new UI, page, or product surface; redesigning an existing one.
- A vague visual request — "make it look good", "make it modern", "make it playful".
- Output has come back generic, templated, or indistinguishable from a default theme.
- Visual work keeps getting reworked because the direction was never agreed.
- Choosing a colour palette, a type scale, or a motion language.
- Before a design review, to know what the review should actually check.

## What it deliberately does not do

Restate the visual direction owned by `-frontend-design` · pick a stack · replace the feature-tracker
convention · demand all seven stages for a one-line change (they compress, but are never silently skipped).

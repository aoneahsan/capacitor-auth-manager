---
name: aoneahsan-cccs-design-process
description: 'The staged design process: interrogating requirements, a design brief, information architecture and user flows, colour/typography/motion tokens, sequenced tasks, build, review. Use when starting or redesigning any UI, when a request is vague ("make it look good"), or when visual work keeps getting reworked.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/urls/design-process-7-skills.md
---

# Design process

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

**One-shot "make it pretty" prompting produces faster chaos, not a product.** The gap between a prototype and
something shippable is the unglamorous middle: requirements, a brief, information architecture, tokens, task
decomposition, review. This skill supplies that spine. `aoneahsan-cccs-frontend-design` supplies the visual
direction; this decides the order and the artefacts.

## The seven stages

Each stage has one gate. **Do not open the next stage until the gate passes.**

| # | Stage | Produces | Gate |
|---|---|---|---|
| 1 | **Grill** | agreed requirements | Can you state what is being built and for whom, in two sentences? If not, do not build. |
| 2 | **Brief** | design direction | Audience, tone, and references named — plus what already exists in the codebase. |
| 3 | **Architecture** | routes, nav, hierarchy, user flows | Every screen reachable; every flow has an entry, a success state, and a failure state. |
| 4 | **Tokens** | colour, type, spacing, motion | Palette claimed in the registry; contrast verified; nothing hardcoded downstream. |
| 5 | **Tasks** | sequenced plan | Ordered foundation → core UI → responsive → polish, with dependencies. |
| 6 | **Build** | the interface | Mobile-first 320→1920; every element from the tokens. |
| 7 | **Review** | findings, then fixes | Run it, at real breakpoints, as a real user. Not a code read. |

Skip a stage only when its artefact already exists and is current — read it instead of regenerating it. On a
small change, stages 1–5 may collapse into one paragraph; they are never silently dropped.

## Where the artefacts live

Project-wide visual identity → `docs/design/` (`brief.md`, `architecture.md`, `tokens.md`).
Design for one feature → that feature's `docs/features/<slug>/` folder, next to its tracker. Never invent a
third location.

## The two failure modes this exists to prevent

**Generic output.** Before generating anything, state a one-line **design read**: *"Reading this as: `<kind>`
for `<audience>`, with a `<vibe>` language."* Then commit. Never default to AI-purple gradients, a centred
hero over a dark mesh, three equal feature cards, glassmorphism everywhere, or Inter + slate-900 — those are
the tells. Full anti-slop method, the variance/motion/density dials, and the palette, typography and motion
specifics: `references/anti-slop.md`.

**Rework.** Requirements settled at stage 1 cost a sentence; discovered at stage 6 they cost the build.

## Stage detail

Per-stage inputs, artefact templates, the skills to invoke at each stage, and the review checklist:
`references/stages.md`.

## Common mistakes

- Jumping to stage 6 because the request sounded simple — then rebuilding it three times.
- Choosing colours in components instead of at stage 4, so nothing is themeable afterwards.
- Claiming a palette without reading `~/.claude/palettes/project-palettes.json` first — hues are compared as
  **OKLCH angles**, and a hue already claimed by another project must never be reused.
- Treating "responsive" as a stage-7 fix. It is a stage-6 constraint, mobile-first, from the first line.
- Reviewing by reading code. Stage 7 means running it at real breakpoints.
- Animating for decoration. Motion carries meaning or it is removed — and it always honours
  `prefers-reduced-motion`.

## Related skills

`aoneahsan-cccs-frontend-design` (visual direction) · `-tailwind-v4` + `-design-system` (stage 4) ·
`-react-components` + `-react-aria` + `-motion` (stage 6) · `-frontend-development` (responsive floor) ·
`-react-accessibility` + `-web-e2e-testing` (stage 7) · `-click-dummy` (HTML-first exploration before code)
· `-cloned-skills-library` (external craft depth: colour database, typography enforcement, motion recipes).

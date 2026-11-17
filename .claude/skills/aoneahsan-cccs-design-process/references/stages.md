# The seven stages in detail

**Last Updated:** 2026-07-27

## 1 · Grill — interrogate the requirement

Stress-test before anything is built. *If you cannot articulate what you are building and why, it should not
be built yet.*

Ask, and get answers: **who** uses this and in what context · **what job** does it do, in their words · what
does success look like · what is explicitly **out of scope** · what already exists that this must live
beside · what constraint is non-negotiable (regulated, accessibility-critical, offline, low-end devices).

Genuinely owner-only or outcome-changing gaps pause the work — `aoneahsan-cccs-ask-the-owner`. Routine
choices are decided from the project's established patterns, not asked.

**Artefact:** a short requirements section. Two sentences of "what and for whom" is the gate.

## 2 · Brief — decide the direction

First **read the codebase**: existing components, tokens, palette, fonts, and the root `CLAUDE.md`
stack override. A brief that ignores what exists produces a redesign nobody asked for.

Then settle: audience · emotional tone (pick one extreme and commit — brutally minimal, editorial,
playful, luxury, industrial, retro-futuristic…) · reference products, named · what must feel different from
competitors · the **design read** sentence.

**Artefact:** `docs/design/brief.md`. **Skills:** `aoneahsan-cccs-frontend-design`, `-copywriting`.

## 3 · Architecture — structure and user flows

Routes and hierarchy · navigation model (and where it collapses — see the hamburger rule in
`-frontend-development`) · **every user flow written as entry → steps → success state → failure state** ·
what lives in the URL (`-url-state-persistence`) · empty, loading and error states for every surface.

A flow without a failure state is not finished. This is the stage that catches the screens nobody thought
about.

**Artefact:** `docs/design/architecture.md`. **Skills:** `-react` (routing), `-url-state-persistence`,
`-react-ui-ux`.

## 4 · Tokens — colour, type, spacing, motion

Three layers, always: **primitive** (raw value) → **semantic** (purpose) → **component**. Components consume
only the component or semantic layer; a raw hex in a component is a defect.

**Colour.** One unique palette per project. **Read `~/.claude/palettes/project-palettes.json` before
claiming one** — `primaryHue` is an **OKLCH hue angle**, never HSL, and a hue already claimed by another
project must not be reused. Verify contrast (4.5:1 body, 3:1 large/UI) in **both** light and dark before
the palette is considered done.

**Typography.** A pairing with a real reason, a modular scale, 16px body minimum, line-height ~1.5, and a
comfortable measure. Typographic correctness — curly quotes, correct dashes, no double spaces — is not
optional polish; it is most of why text reads as professionally set.

**Motion.** Tokenise duration and easing. 150–300 ms for UI feedback; motion must convey meaning (spatial
continuity, state change) rather than decorate. Never animate `width`/`height` — transform and opacity only.
`prefers-reduced-motion` is honoured at the token layer so every consumer inherits it.

**Artefact:** `docs/design/tokens.md` + the actual CSS/theme file.
**Skills:** `-tailwind-v4`, `-design-system`, `-motion`, `-frontend-design`.

## 5 · Tasks — sequence the work

Decompose into ordered tasks with dependencies, in four bands:

1. **Foundation** — tokens, theme, layout primitives, typography base
2. **Core UI** — the screens and components that carry the main flows
3. **Responsive** — every breakpoint 320 → 1920, touch targets, safe areas
4. **Polish** — motion, empty/loading/error states, decorative treatment, microcopy

Multi-session or independently resumable work gets `docs/features/<slug>/00-tracker.json`
(`-task-planning`). A one-session change does not need one.

## 6 · Build

**Mobile-first, from the first line** — 320px up, never a desktop layout retrofitted. Every value from the
tokens. Every interactive element keyboard-operable and labelled (React Aria supplies behaviour; the visual
layer is ours). Every list, form and async surface has its empty, loading and error state built, not
deferred.

**Skills:** `-react-components`, `-react-aria`, `-tailwind-v4`, `-frontend-development`, `-motion`,
`-react-forms`, `-react-ui-ux`.

## 7 · Review — run it

**Not a code read.** Run the app and inspect it.

- [ ] **Breakpoints 320 · 375 · 768 · 1024 · 1440 · 1920** — no horizontal scroll at any width
- [ ] Touch targets ≥ 44×44 with ≥ 8px separation; body text ≥ 16px
- [ ] Contrast passes in **both** light and dark
- [ ] Full keyboard pass: every control reachable, focus always visible, no trap
- [ ] Empty, loading, and error states all render — trigger them, don't assume
- [ ] `prefers-reduced-motion` genuinely reduces motion
- [ ] Nothing hardcoded that should be a token
- [ ] Reads as the design brief's tone, not as a default template
- [ ] Copy is honest and specific — no lorem, no placeholder shipped

**Skills:** `-react-accessibility`, `-web-e2e-testing`, `-verification`. Findings become fixes, then this
list runs again. Report what actually failed; a review that finds nothing on first pass is usually a review
that did not run the app.

## Cloned-skill depth per stage

Available only if copied into the project — `aoneahsan-cccs-cloned-skills-library`:

| Stage | External depth |
|---|---|
| 2 Brief | `ext-taste-design-taste-frontend` (design read + dials) · `ext-taste-brandkit` |
| 4 Tokens | `ext-uiuxpm-ui-ux-pro-max` (192 palettes, 74 font pairings) · `ext-bencium-ui-typography` (Butterick rules) · `ext-anthropic-theme-factory` |
| 6 Build | `ext-cds-motion-framer` · `ext-cds-gsap-scrolltrigger` · `ext-cds-lottie-animations` |
| 7 Review | `ext-accesslint-audit` · `ext-bencium-design-audit` · `ext-anthropic-webapp-testing` |

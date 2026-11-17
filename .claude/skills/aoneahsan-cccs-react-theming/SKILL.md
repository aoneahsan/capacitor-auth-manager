---
name: aoneahsan-cccs-react-theming
description: 'The single theme control every project ships: one header icon opening one panel carrying every appearance axis (light/dark, colour treatment, radius, density, text size, typeface, panel background, motion, sound; never a cursor), the axis registry, pre-paint application, dual-layer persistence. Use for any theme customiser or dark mode, and whenever a fixed decorative overlay — a floating badge or progress bar — must stay visible over surfaces it is painted on top of.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Theming

**Every project exposes ONE theme control to all users, signed in and signed out.** Theming is not an admin
feature; it is how the app accommodates the person using it.

## 🔴 One icon, one panel — never a row of buttons

A single icon in the header opens a panel holding **every** appearance preference. Not two cycle-buttons, not
a settings sub-page, not a dark-mode toggle beside a palette toggle.

**Cycling is fine for two states and wrong for nine** (incident: `references/axis-registry.md`).

**Panel shape:** anchored popover at ≥640px, full-height sheet below. Anchored rather than full-screen,
because a panel covering the page hides what the setting just did — the point of a live preview.

🔴 **THE HEADER ENTRY POINT IS THE FEATURE.** Visible on every route and at **every width**, signed in or out.

## The axis set

| Axis | Attribute | Values |
|---|---|---|
| Appearance | `data-theme` → `data-appearance` | light · dark · **system** |
| Colour treatment | `data-palette` | the project's 2–3 treatments, at **genuinely different hues** — one registered primary, the rest free |
| Corner radius | `data-radius` | none · small · medium · large · full |
| Density | `data-density` | compact · comfortable · spacious |
| Text size | `data-type-scale` | small · medium · large |
| Typeface | `data-font` | the families actually bundled — usually two |
| Panel background | `data-surface-style` | solid · translucent |
| Motion | `data-motion` | system · full · reduced |
| Sound | `data-sound` | on · **off (the default)** — the only axis that starts off |

🔴 **Card selectors, never dropdowns**, and **each card previews its own value**: radius cards render at their
radius, density cards at their spacing, type and font cards in their own size and face, treatment cards show a
live surface/ink/accent triad. A dropdown hides the thing being chosen. Build each axis as a real
`radiogroup` with `radio` children and roving tabindex — RAC's `RadioGroup` anatomy, so a framework build
keeps the paint and drops the behaviour (`aoneahsan-cccs-react-aria`).

## 🔴 No cursor axis, no custom cursor (owner, 2026-10-26)

Browser default pointer only; an existing one is removed, dummy first. Detail and the one exception:
`references/axis-registry.md` → "No cursor axis".

## 🔴 One registry, one loop

**The axes are one table.** The pre-paint script iterates it, the panel renders from it, one `applyAxis()`
writes them. Adding an axis is one row — so an axis cannot be half-added.

**Count them: the table, the state interface and the apply path must agree** — the recorded failure is in
`references/axis-registry.md` (law: `~/.claude/rules/frontend-ui-standards.md` §10).

## 🔴 Pre-paint writes EVERY axis, not just the theme

A head script, before any module loads, stamps all of them on `<html>`. Appearance applied late is a colour
flash; **density or text size applied late is a reflow** — the page paints, then every spacing and font size
changes and the layout moves. That is worse, and it is the axis most often forgotten, because dark mode is the
one everybody remembers.

`data-theme` is the **preference** (may be `system`); `data-appearance` is the **resolved** light|dark, set in
the single apply path with a live `prefers-color-scheme` listener (detail: `references/axis-registry.md`).

## 🔴 The consumption contract — every component obeys, or the axis is a lie

The control sets **tokens**; components read tokens. A component that hardcodes a radius, spacing, font family
or colour is **invisible to the control** and looks wrong in exactly one combination. Two mechanisms carry it:

**Multipliers for anything numeric** (`--density`, `--type-scale` as `calc()` factors on every token) and
**compose, don't override** (an axis gets its own token, never a competing selector). Read
`references/axis-registry.md` → *The consumption mechanisms* when writing tokens or a primitive.

## 🔴 A fixed decorative overlay takes its colour from the surface UNDER it

A floating badge or progress bar given the accent vanishes on an accent band; 🔴 no custom property on a band
reaches a `position: fixed` sibling, so resolve the surface under it on a boundary event and use that surface's
ink token. 🔴 It has **no gate unless you build one**. Read `references/axis-registry.md` → "The overlay-contrast
rule" when adding any fixed overlay · law: `rules-detail/frontend-ui-standards.md` §16.

## Persistence — dual layer

Device storage signed out; the user record **and** that cache signed in, remote winning on sign-in
and written back. **Never raw `localStorage`** — go through **`strata-storage`**, whose one sanctioned
exception is the pre-paint script. Debounce remote writes (≥500ms). Every axis is URL-shareable for
review, 🔴 **shown, never persisted**. 🔴 A hydration gate holds first paint until the store has
rehydrated *and* auth resolved. 🔴 `system` is the default **only when nobody has decided** — an
approved design artefact overrides it, used literally rather than resolved from the OS.
Detail: `references/patterns.md`.

## Common mistakes

Five recorded ways this goes wrong — a button per axis, hand-written
`setAttribute` per axis, only the theme applied pre-paint, asserting an axis is *declared*
rather than executing the write path, and the theme applied in a React effect — plus the four
that faked their own measurements: `references/axis-registry.md` → "Common mistakes".

## Going deeper

- **`references/axis-registry.md`** — the registry, the apply path, the pre-paint script, the no-custom-cursor rule, and **the four gates, each shown failing**.
- `references/patterns.md` — the store, the sync service, self-previewing cards, the hydration gate and the
  verification matrix.

## Related skills

`aoneahsan-cccs-tailwind-v4` (the token architecture the axes drive) · `-design-system` (primitives that must
consume them) · `-react-aria` (the radiogroup anatomy) · `-motion` (the motion axis; `gsap.matchMedia` reads
the OS only) · `-interaction-feedback` (what the `sound` axis gates) · `-frontend-design` (the claimed hue and
its treatments) · `-strata-storage` (persistence) ·
`-click-dummy` (where the control is designed and approved first) · `-react-ui-ux` (the boot loader).

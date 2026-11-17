# Overview — `aoneahsan-cccs-frontend-design`

## Purpose

The visual direction skill, and the deepest one in the catalog — the owner's stated position is that UI/UX is
50% of any project. It exists to correct a measured outcome: roughly 70 projects built on component libraries
converged on the same competent, forgettable look.

## What this skill does

- States the **direction**: new projects and deliberate redos use Tailwind plus custom components; existing
  projects keep their library until a redo is ordered. The bar is unique, playful, creative, cheerful and
  user-friendly — opinionated rather than safe.
- Fixes the **six acceptance criteria** for replacing a component library (theme, colour, font, contrast,
  accessibility, typography), so going custom is a net gain rather than a regression.
- Requires a **unique colour palette per project**, chosen at project start and recorded in a global registry
  modelled on the dev-port registry, checked against existing projects before being claimed.
- Requires the palette to be expressed as **semantic tokens** rather than raw hex, so components track the
  palette, the user's theme and any rebrand automatically.
- Gives the add-life levers — decorative SVG, entrance motion capped at 600ms, hover treatment, a boot loader
  with rotating copy — each paired with what to avoid, and governed by restraint and `prefers-reduced-motion`.
- Extends design to **copy**: error messages, empty states and button labels carry the project's voice.
- Sets the **SVG-first** asset rule: author and commit SVG, export raster last, never hand-edit the export.

## When it gets invoked

- Designing any page, component, modal, empty state or hero.
- Starting a new project's visual identity, or choosing its colours.
- A UI looks generic, default, or "AI-template".
- Adding motion, decoration, or a loading state.
- Creating any icon, logo, or graphic asset.

## Where it applies

Every project with a user interface, on any platform.

## Sources

`_source-understanding/files/prompt-logs.md` (the full UI/UX brief of 2026-07-19 — the 70-project
observation, the preserved-controls list, the unique-palette-with-global-registry requirement, the
50%-of-any-project framing) and `_source-understanding/files/generic-project-rules.md` (R-040 playful UI,
R-021 theme controls, and the SVG-first rule restated across R-008/012/018/019/028/044).

## Related skills

`aoneahsan-cccs-react-components` (the library decision in build terms) · `-react-theming` (the customiser
that exposes the palette) · `-react-accessibility` (contrast and motion) · `-frontend-development`
(responsiveness) · `-react-ui-ux` (page-level patterns).

## Maintenance

The palette registry is live data — read it before every new project. The direction itself is owner-set and
recent.

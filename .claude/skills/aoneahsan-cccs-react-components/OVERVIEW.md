# Overview — `aoneahsan-cccs-react-components`

## Purpose

How components are built and reused, and — most consequentially — whether a project uses a component library
at all. It carries the owner's 2026-07-19 course correction away from Radix/ShadCN toward Tailwind plus custom
components, including the boundary that keeps existing projects untouched.

## What this skill does

- States the **library decision** as a three-way rule: existing projects keep their library, new projects use
  Tailwind plus custom components, and a deliberate UI redo is the moment to switch. Notes explicitly that
  this supersedes the older Radix-mandatory rule while that rule still governs projects still using a library.
- Fixes the acceptance criteria for going custom — theme, colour, font, contrast, accessibility and
  typography control must all survive the move, because those are why the library was chosen in the first
  place.
- Sets the extraction threshold: build the primitive on the second occurrence, and only when both copies will
  change together.
- Requires named props over positional ones, treating prop names as the component's public API.
- Specifies **card-based option UI** for checkbox, radio and select groups of ≤8 options, with the tight
  variant for dense forms and the fallback above 8.
- Fixes **D3.js as the only charting library**, with the ceiling argument for why.

## When it gets invoked

- Creating any component.
- The same markup has appeared twice.
- Choosing between a component library and custom code, or starting a new project's UI.
- Building a checkbox, radio or select group.
- Adding any chart or data visualisation.
- Auditing an existing component set for reuse or consistency.

## Where it applies

Every React project. The library-decision half is the part that differs by project age.

## Sources

`_source-understanding/files/prompt-logs.md` (the UI direction, the preserved-controls list, generic
reusable components) and `_source-understanding/files/generic-project-rules.md` (R-007, R-026, R-044).

## Related skills

`aoneahsan-cccs-frontend-design` (the visual direction and the palette registry) ·
`-react-accessibility` · `-react-theming` · `-react-form-components` · `-programming-principles` (the DRY
caveat that governs extraction).

## Maintenance

⚠️ The R-007 conflict is recorded as an open question in
`_source-understanding/files/generic-project-rules.md`. This skill encodes the reconciliation the owner
described; confirm before treating it as settled.

## Related open decision

The select-component choice is recorded in `aoneahsan-cccs-react-form-components`.

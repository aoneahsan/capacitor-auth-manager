# Overview — `aoneahsan-cccs-react-accessibility`

## Purpose

Keeps interfaces usable by keyboard and assistive technology. It is a first-class skill in this catalog
specifically because accessibility is one of the six guarantees a component library was supplying, and the
move to custom components is exactly where it gets dropped without anyone noticing.

## What this skill does

- Puts **semantic elements first**, with the table of native elements that make most accessibility free, and
  the explicit accounting of what a `<div onClick>` costs to reproduce and still gets wrong.
- Documents the **visually-hidden-input pattern** that keeps custom card selectors accessible — the real
  input stays in the DOM under `sr-only` rather than being replaced.
- Sets keyboard requirements: full operability, logical tab order, `:focus-visible` styling rather than
  removed outlines, and the full modal focus cycle including **returning focus to the trigger on close**.
- Scopes ARIA to where native semantics run out, lists the attributes that actually earn their place, and
  warns that incorrect ARIA is worse than none.
- Sets contrast ratios (4.5:1 text, 3:1 large text and UI boundaries) against the real background, and forbids
  colour as the sole carrier of meaning.
- Covers reduced motion, alt text, heading structure and real labels.

## When it gets invoked

- Building any interactive component — button, modal, menu, tabs, form field, custom select.
- Replacing a component-library component with a custom one.
- Auditing a UI, or responding to an accessibility issue.
- Something works with a mouse but not a keyboard.
- Choosing colours, or checking a palette against text.

## Where it applies

Every user interface, web and native.

## Sources

`_source-understanding/files/prompt-logs.md` (accessibility named among the controls that must survive the
move to custom components) and `_source-understanding/files/generic-project-rules.md` (R-021, R-040, R-044,
and the reduced-motion and contrast requirements).

## Related skills

`aoneahsan-cccs-react-components` (where the patterns are implemented) · `-frontend-design` (contrast and
motion) · `-react-form-components` (field ARIA) · `-frontend-development` (touch targets) · `-react-seo`
(heading structure and alt text overlap).

## Maintenance

Stable. WCAG ratios and native semantics do not churn.

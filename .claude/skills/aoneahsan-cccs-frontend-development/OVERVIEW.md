# Overview — `aoneahsan-cccs-frontend-development`

## Purpose

The implementation half of frontend work: making a design correct at every screen size. It matters more here
than in a typical web project because every project ships as an Android app as well as a website, so the
320px end has real users.

## What this skill does

- Fixes the **six-breakpoint set** from 320px to 1920px and requires genuinely mobile-first authoring, with
  the note that retrofitting mobile onto a desktop-first layout is what ships horizontal scroll.
- States the non-negotiable minimums: no horizontal scroll at any width, 44×44px touch targets, 16px body
  text on mobile (below which iOS zooms on focus), responsive media with intrinsic dimensions, flexbox modals
  with a scrollable region, and wide content scrolling inside its own container.
- Carries the **one-navigation-method-per-viewport** rule — the hamburger appears only when inline nav is
  hidden, both driven by one shared breakpoint — with the instruction to reduce nav items rather than show
  both.
- Covers **native safe areas** and the single-inset-owner requirement that keeps content out from behind the
  system bars.
- Names the exact widths to verify, plus dark mode and reduced motion.

## When it gets invoked

- Implementing any layout, page or component.
- Reviewing a component across screen sizes.
- Building or changing navigation.
- Something overflows horizontally, or a tap target is hard to hit.
- Preparing a build for the Android shell.

## Where it applies

Every frontend project, and especially every Capacitor-wrapped one.

## Sources

`_source-understanding/files/generic-project-rules.md` (the responsive breakpoint table, touch and text
minimums, R-040's cross-size requirement) and `_source-understanding/files/prompt-logs.md` (mobile-first and
100% responsive stated repeatedly; the hamburger-duplication incident).

## Related skills

`aoneahsan-cccs-frontend-design` (what it should look like) · `-react-accessibility` (targets and focus) ·
`-react-components` (where responsive behaviour is implemented) · `-capacitor` (safe areas) ·
`-react-performance` (layout shift).

## Maintenance

Stable. The breakpoint table is owner-set.

# Overview — `aoneahsan-cccs-react-theming`

## Purpose

The user-facing theme customiser and the persistence behind it. Theming is treated as a product feature
available to everyone rather than a setting for signed-in users, and this skill also owns the hydration gate
that keeps the app from flashing the wrong theme on load.

## What this skill does

- Specifies the **full option set** — appearance including a live-updating system mode, accent colour, neutral
  tone, border radius, UI scaling, font size and panel background — with the values for each.
- Requires **card selectors rather than dropdowns**, where the card previews the property it sets: radius
  cards render at their radius, font-size cards at their size.
- Requires the customiser to be reachable from the header for **signed-out users too**, with a scroll area and
  a reset-to-defaults action.
- Defines **dual-layer persistence**: device storage for everyone, the backend record for signed-in users,
  with remote winning on sign-in, local values retained on sign-out, and remote writes debounced so dragging
  through swatches does not write per frame.
- Bans raw `localStorage` in favour of the project's storage layer so web and native behave identically.
- Carries the **hydration gate** — hold first paint until both the store has rehydrated and auth has resolved
  — and explains the flash it prevents.
- Requires all theming to flow through **tokens**, so a hardcoded colour is invisible to every option, and
  requires verification against every option rather than just light and dark.

## When it gets invoked

- Building or auditing a theme customiser.
- Adding dark mode, or persisting any user preference.
- The app briefly shows the wrong theme on load.
- Reviewing whether components respond to accent, radius or scale changes.
- Syncing preferences across a user's devices.

## Where it applies

Every project with a user interface. The option set originated with Radix Themes but is written here to be
library-independent, since new projects use custom components.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-021 — the customiser, the dual-layer persistence
and the FOUC-preventing loader) generalised beyond Radix, plus
`_source-understanding/files/prompt-logs.md` (theme, colour, font, contrast and typography control named as
the things that must survive the move to custom components).

## Related skills

`aoneahsan-cccs-frontend-design` (the token system and the project palette) · `-react-state-zustand`
(the store and persistence middleware) · `-react-ui-ux` (the boot loader) · `-react-components` (card
selectors) · `-react-accessibility` (contrast across accents).

## Maintenance

Re-check when the fleet completes the move from `@capacitor/preferences` to strata-storage.

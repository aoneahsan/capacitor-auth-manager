# Overview — `aoneahsan-cccs-react-ui-ux`

## Purpose

The experience patterns that decide whether an app feels finished. It concentrates on the states that are
never in a design file and rarely in a demo — empty, loading, failed, offline, first-run — because that is
where products feel broken even when nothing is wrong.

## What this skill does

- Requires **four visually distinct states** on every data-driven surface, with a skeleton rather than a
  spinner for loading, an explanation plus an action for empty, and plain language plus retry for error.
  Names the empty-rendered-as-spinner case as the most common false bug report.
- Specifies the **boot loader** — full page until theme hydration and auth resolution, with rotating copy —
  and identifies it as the FOUC guard that stops the light-then-dark snap.
- Requires branded **404 / 500 / 403 / 401** pages with a way home, and an audit that every link leads
  somewhere real.
- Sets navigation affordances: an absolute-target go-back button, a live footer version, hash-aware
  scroll-to-top, and a dismissible resume nudge with shared dismissal.
- Fixes the **share contract**: an in-app modal on web, `@capacitor/share` on native, branched at click time —
  and explains why `navigator.share` with a silent clipboard fallback is banned.
- Treats **copy as design surface**, including errors, empty states and button labels.

## When it gets invoked

- Building any page or data-driven view.
- Designing a loading, empty, error or offline state.
- Adding a share action.
- Writing user-facing copy.
- A flow feels unfinished, or a user reports something as broken that technically works.

## Where it applies

Every React project, web and native.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-011, R-012, R-013, R-021 loader, R-022, R-040 copy
personality) and `_source-understanding/files/prompt-logs.md` (the share bug that produced the contract, and
the dismissible-nudge pattern).

## Related skills

`aoneahsan-cccs-frontend-design` (visual treatment) · `-react-theming` (the hydration gate) · `-react`
(routing and error pages) · `-react-accessibility` (announcing state changes) · `-capacitor` (native share).

## Maintenance

The share contract's full spec lives in `~/.claude/rules/share-feature.md` — point there, do not restate it.

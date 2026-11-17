# Overview — `aoneahsan-cccs-react-performance`

## Purpose

Keeps the initial bundle proportional to the first screen and keeps user-facing operations responsive. It
covers both halves of "slow": how much code ships, and how long a thing takes once it runs.

## What this skill does

- Requires **every route to be lazy-loaded**, with no exception for small pages.
- Requires heavy libraries to be **dynamically imported at point of use**, split at the feature boundary
  rather than per component.
- Sets the virtualisation threshold at ~200 visible rows.
- Puts **measure before optimising** ahead of the render-cost techniques, and ranks structural fixes (moving
  state down, passing children as props) above memoisation, which has its own cost.
- Names the zustand whole-store destructure as the most common avoidable re-render, and requires stable keys.
- Covers image and asset cost: SVG for vector, explicit dimensions to prevent layout shift, lazy loading
  below the fold.
- Treats **data cost as performance**, pointing at the fetch budget.
- Carries the **response-time budget** the owner set after a 40–60 second AI operation: redesign rather than
  a spinner, cache after first load, show real progress, move blocking work to a Worker.
- Sets build gates: zero warnings, investigate chunk-size warnings rather than raising the limit, no
  production source maps.

## When it gets invoked

- The bundle is growing, or a build warns about chunk size.
- A page, list or interaction feels slow.
- Adding a heavy dependency — an editor, a chart library, a PDF or image processor.
- Building a long list or table.
- Before shipping a production build.

## Where it applies

Every React project, web and Capacitor. Bundle size matters more on native, where the shell is loaded from
disk but updates ship over the air.

## Sources

`_source-understanding/files/prompt-logs.md` (lazy-load every route, dynamic package loading, TanStack
Virtual, the response-time rule after the 40–60s background remover) and
`_source-understanding/projects/ztools-seo.md` (the hero-skeleton LCP technique).

## Related skills

`aoneahsan-cccs-react-api-tanstack-query` (data cost) · `-react-tables-tanstack` (virtualisation in practice)
· `-react-state-zustand` (selector discipline) · `-frontend-design` (asset strategy) · `-javascript`.

## Maintenance

Stable. Re-check thresholds if the fleet moves to a different bundler.

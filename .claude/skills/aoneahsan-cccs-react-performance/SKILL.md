---
name: aoneahsan-cccs-react-performance
description: 'Frontend performance and the fleet performance standard: measured budgets (a first-load gate on the build, LCP/CLS/TBT on a mid-phone profile), TanStack Query staleTime classes, zustand selectors, lazy routes, heavy imports at point of use, virtualisation, transform/opacity animation. Use on every change, when the app feels slow, for speed, Core Web Vitals, re-renders, state management, animation jank, a growing bundle or heavy dependency, and before shipping a build.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Performance

Two budgets govern everything here: the **core JS bundle** stays proportional to the first screen, and a
**user-facing operation should not feel slow**. The owner made the second one a rule after an AI feature took
40–60 seconds to respond.

## 🔴 The fleet standard — read it before the first edit

Speed, state management and animation are a rule for **all work, on every project** (owner, 2026-09-11). The
one standard is **`references/performance-standard.md`** — the measured budgets and their instruments, the
state, rendering and animation rules, the before-and-after audit, and what every change reports. This page
is the technique; that file is the law. Point to it; never restate it.

## Lazy-load every route

```tsx
const Dashboard = lazy(() => import('@/pages/Dashboard'));
```

**Every** route, including small ones. The core bundle should carry the shell and the first screen, nothing
more.

## Dynamically import heavy libraries at point of use

The editor, the chart library, the PDF renderer, the image processor, the QR generator — none belong in the
initial bundle if most sessions never touch them.

```tsx
const openEditor = async () => {
  const { Editor } = await import('@/features/editor');
  setEditor(() => Editor);
};
```

Split at the **feature** boundary, not per component — dozens of tiny chunks cost more in requests than they
save in bytes.

Words read only by a lazy feature belong in that feature's chunk. Importing its whole catalogue from the
eager shell can pull the feature's copy into the first-load graph even when the screen itself is lazy.

## Virtualise long lists

`@tanstack/react-virtual` above roughly **200 visible rows**. Below that it is complexity for nothing.

## Render cost

Measure before optimising — this is the rule most often broken in the name of performance.

- **The cheapest fix is usually structural:** move state down so fewer components subscribe, or pass children
  as props so they do not re-render with the parent.
- `memo`/`useMemo`/`useCallback` have their own cost and are worth it when a component is expensive **or** a
  prop identity is breaking a memoised child — not by default.
- **Select slices** from zustand rather than destructuring the store (the single most common avoidable
  re-render — see `aoneahsan-cccs-react-state-zustand`).
- Keys must be stable ids, never array indices.

## Images and assets

SVG for anything vector. Raster gets explicit `width`/`height` to prevent layout shift, `loading="lazy"`
below the fold, and modern formats. See `aoneahsan-cccs-frontend-design` for the SVG-first rule.

## Data cost is performance

An unbounded query is a performance bug and a cost bug at once. The fetch budget — 20 default, 50 max — is
in `aoneahsan-cccs-react-api-tanstack-query`.

## Response-time budget

A user-facing operation that takes tens of seconds needs redesign, not a spinner: cache models and heavy
assets after first load, show real progress rather than an indeterminate spinner, and move blocking work to a
Web Worker so the UI keeps responding.

## Build gates

Zero warnings. Set `chunkSizeWarningLimit` deliberately and **investigate what tripped it** rather than
raising the number. Production ships **no source maps**.

For measurement, code-splitting and Core Web Vitals detail, read `references/techniques.md`. To profile a
live page (LCP/INP/CLS, render-blocking resources, network waterfall) with the `use_browser`/CDP tooling,
read `references/web-perf-audit.md`.

# Performance — fast, lean and smooth, every change, every project

**The canonical standard.** Every other skill, rule, agent and project task points here; none restates it.
**Reference implementation:** LifeWell (2026-09-11) — `docs/PERFORMANCE.md` and `scripts/verify-perf-budget.ts`
on the `redevelop-v1` branch of `lifewell` (commit `bd9e6f09`). Its figures are LifeWell's own measurements:
copy the mechanism, never the numbers.

## Why it exists — the owner's words, verbatim

**2026-09-11**, making it a rule for all work:

> "please make sure we work on app speed optimization and state management, animation etc properly, so app is
> not slow at all and is as fast and performance efficient as possible, add as part, rule for all work please"

Asked whether that covers LifeWell only or the fleet, he chose **"LifeWell and the whole fleet"** (LifeWell
OD-87 A1). So this is carried in every agent packet and every change report, and it is a gate, not a wish.

**The defect behind it.** On 2026-08-29 LifeWell's home page advertised **98 `modulepreload` links and pulled
577 kB before it could paint** — a marketing page fetching a date picker, a data table and growth-chart
reference tables. Two causes, both invisible in the source: a **barrel import on an eager path** (+539 kB) and
a **route loader naming a feature barrel**, which pins it into the entry chunk (+297 kB). Typecheck, lint, 893
unit tests and the build were green over both. That is why every budget below is **measured on the built
output**, and why a claim of speed is never accepted without a number.

## 1 · The budgets — measured, never asserted

| Budget | Limit | Instrument |
|---|---|---|
| First-load preloads on the landing route | the project's measured baseline plus headroom | the first-load gate on `dist/` |
| First-load graph — bytes the landing route pulls before boot | the project's measured baseline plus headroom | the first-load gate |
| Any one chunk in the first-load graph | a ceiling one re-introduced barrel cannot fit under | the first-load gate |
| LCP | ≤ 2.5 s | the mid-phone profile |
| CLS | ≤ 0.1 | the mid-phone profile |
| Total blocking time — long-task time over 50 ms, summed | ≤ 200 ms | the mid-phone profile |
| Every interaction acknowledged at the control | ≤ 100 ms (`frontend-ui-standards.md` §12) | the mid-phone profile — `event` timing entries (INP) |

**The first-load gate** is a script run after the build. It reads the built entry HTML (or the bundler's
manifest), counts the `modulepreload` links, sums the first-load graph and names the largest chunk in it.
🔴 **Set each budget from this project's own measured baseline, with headroom enough for ordinary growth and
far too little for a re-introduced barrel** — LifeWell's two regressions were an order of magnitude above its
headroom. A budget nothing can breach is decoration. 🔴 **Watch it fail once** against a planted barrel before
trusting it (`~/.claude/rules/build-test-quality.md` — a gate you have not watched fail is not verified).

**The mid-phone profile** needs no new dependency. Serve the production build under the run-to-verify grant
(`01-authorizations.md`), drive the automation Chrome (`browser-automation.md` — never the owner's), throttle
over CDP — `Emulation.setCPUThrottlingRate` 4× and `Network.emulateNetworkConditions` at a "Fast 3G" profile —
and inject a `PerformanceObserver` before navigation for `largest-contentful-paint`, `layout-shift` (excluding
`hadRecentInput`), `longtask` and `event`. Kill the server and the browser afterwards. Profiling technique:
`web-perf-audit.md`; Core Web Vitals and bundler settings: `techniques.md` (both beside this file).

🔴 **Start the instrument's Chrome with `--disable-features=OptimizationHints`**, as Lighthouse's own launcher
does. A bare Chrome asks the renderer for the page's content about one second after the page settles
(`AIPageContentAgent` in a trace), and to answer it lays out everything `content-visibility: auto` had skipped,
in one long task with no script on the stack. Measured on Rent Party, 2026-10-10: 22 of 22 runs with Chrome bare,
0 of 22 with the feature off, about 160 ms of blocking on the web and 80 ms on a phone at 4×, and a visit that
runs none of the app's code still gets it. It reads as a page defect and is not one. Also make one throwaway
visit before the first measured run: a browser measured within seconds of starting gives a slow first run.

🔴 **The project's record lives at `docs/PERFORMANCE.md`** — the same path in every project: the budgets with
the baseline commit and date, the key routes, the staleTime classes, the motion tokens, and the known leads
not yet fixed.

## 2 · State

- **Server data lives only in TanStack Query.** Freshness comes from named **staleTime classes** declared once
  in the query client: *stable* (registries, settings, static lists), *personal* (a person's own data — the
  default) and *live* (`0`, genuinely live only; realtime is usually the better tool). LifeWell's values are
  30 min · 5 min · 0, with window-focus refetch off and one retry. A record read at `staleTime: 0` carries a
  written reason. Detail: `aoneahsan-cccs-react-api-tanstack-query`.
- **Keys come from each feature's own factory**, so an invalidation names exactly what changed — never
  `invalidateQueries()` with no key.
- **No fetch inside an effect**, no copying query data into local state, and no waterfall that a loader or a
  parallel query could remove. Every list read is paginated — 20 by default, 50 at most
  (`~/.claude/rules/data-fetch-budget.md`).
- **Zustand only through selectors** — one field per selector, or `useShallow` for several; never a
  whole-store subscription, which re-renders every consumer on any change. 🔴 In v5 a selector that builds a
  fresh object on each call re-renders forever. Detail: `aoneahsan-cccs-react-state-zustand`.
- **No React Context for app state.** Context re-renders every consumer on any change; it is for dependencies
  that do not change.
- **Memoise only where a profile shows it pays.** The cheaper fix is structural — move state down, pass
  children as props.

## 3 · Rendering and loading

- **Every route is lazy.** Heavy libraries — charts, the rich-text editor, graph layouts, PDF and image tools
  — are imported at the point of use and split at the **feature** boundary, never per component.
- 🔴 **No barrel import on an eager path, and no route loader naming what it would pin into the entry chunk.**
  These are the two shapes the first-load gate exists for.
- **Nothing new on the first-load path without a measured reason** — the gate's delta goes in the report.
- **A catalogue that grows with every release loads with its page**, not with the first-load shell. Check the built entry graph after adding a changelog or feed catalogue (windowsweep, 2026-11-08).
- **Virtualise a list above about 200 visible rows**; below that it is complexity for nothing.
- **Images** carry `width`/`height`, `loading="lazy"` below the fold and `decoding="async"`; vectors are SVG.
- **No layout reads inside render or animation loops** (`getBoundingClientRect`, `offsetWidth`) — read once,
  write in a batch.
- **A skeleton is drawn at the size of its content**, so arriving data shifts nothing (CLS).

## 4 · Animation

- **`transform` and `opacity` only, per frame** — never `height`, `width`, `top`/`left` or `box-shadow`. Use
  `grid-template-rows` or `scaleY`, `translate`, or a cross-faded pseudo-element instead.
- **Every duration and easing comes from the motion tokens**, each multiplied by the factor the in-app
  **Motion** axis and `prefers-reduced-motion` set. 🔴 A literal `ms` value in a component is a defect: it is
  invisible to both. Tokens and the axis: `aoneahsan-cccs-motion` · `aoneahsan-cccs-react-theming`.
- **Reduced motion is decided per pattern** — neutralise movement, keep opacity; a spinner stays.
- **Continuous motion pauses when it cannot be seen** — off-screen (`IntersectionObserver`) or with the tab
  hidden (`visibilitychange`). `will-change` is set only while animating.
- **Restraint limits ornament, never feedback** — every control still answers hover, press and focus within
  100 ms.

## 5 · The audit — before and after

A project adopting this standard, and every phase that closes, measures its **key routes** on the mid-phone
profile — the landing page, the signed-in home, one heavy list, one chart, one form, settings and one public
content page, named in `docs/PERFORMANCE.md` (six to ten; the project picks). Add React Profiler render counts
on the two busiest screens, query waterfalls and over-fetching, and animation jank. Fix or file each finding,
then measure again and record the after column beside the before. 🔴 **In a rebuild, the live site as it
stands today is the first before column** — the rebuild ships only when it beats it.

## 6 · A change that moves a number says so

Every change report carries:

- the first-load gate's output after the build, and **the number it moved, with the delta**;
- for a UI change on a measured route, that route's vitals **before and after**;
- for a new query, its key, its staleTime class and its limit;
- for new motion, its token and what it does under reduced motion.

"It should be faster" is not a measurement.

## 7 · Other stacks

Flutter, Tauri and browser-extension projects apply this by analogy under the per-project stack override —
the same budgets and disciplines, measured with that platform's own instruments; the concern maps, the tooling
does not.

## Done when — per project

1. The first-load gate runs after every build and has been watched failing once against a planted barrel.
2. `docs/PERFORMANCE.md` records the budgets with their baseline commit and date, and the key routes' vitals
   before and after the audit.
3. The state, rendering and animation checks above are audited, each finding fixed or filed.
4. Completion is recorded in `~/Documents/ahsan-work/code/docs/tracking/performance-standard-tracker.json`
   and in the project's root `CLAUDE.md` + `AGENTS.md` (`~/.claude/rules/fleet-tasks.md`).

**Law:** `~/.claude/rules/frontend-ui-standards.md` mandate 18 · depth in
`~/.claude/rules-detail/frontend-ui-standards.md` §18.

**Last updated:** 2026-10-10 (the instrument's Chrome starts with OptimizationHints off, and one throwaway visit
comes first: Rent Party R2.4). Earlier 2026-09-11 (established — owner directive; LifeWell OD-87 A1)

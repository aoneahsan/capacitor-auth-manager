# Implementation

**Last Updated:** 2026-10-23 — rewritten from the first build (LifeWell, WP016 Phase E, live 2026-10-22). Reference
implementation: `lifewell/src/features/tours/`.

## Library — Driver.js behind our own wrapper

Chosen 2026-10-21 against the owner's bar: open source with a licence that costs nothing for a commercial
product, and the most control.

| Library | Licence | Verdict |
|---|---|---|
| **Driver.js** (1.10.2) | MIT | ✅ No dependencies, small, framework-agnostic; `moveTo(index)` jumps to any step; `stagePadding`/`stageRadius` cut the overlay round the target |
| Reactour (`@reactour/tour` 3.8.0) | MIT | Fallback if Driver.js cannot do something we need |
| React Joyride (3.2.0) | MIT | React-only and less control over the step card |
| Shepherd.js (15.3.0) | AGPL-3.0 | ❌ copyleft on a closed product |
| Intro.js (8.6.0) | AGPL-3.0 | ❌ |
| Onborda (1.2.5) / NextStep | MIT, but peer-depends on Next.js + framer-motion | ❌ for Vite apps |

🔴 Confirm the licence from the package's own LICENSE file and npm page at install time, and record it in
`docs/PACKAGES.md`.

## What we take from Driver.js, and what we do not

Take: the **overlay** (an inline-styled SVG, fixed and full-viewport, with the cut-out), the scroll into view and the
refresh on resize. Do not take: its stylesheet (`driver.css` adds `.driver-active * { pointer-events: none }`) or its
popover — **the step card is ours**, React Aria buttons on theme tokens, drawn over the overlay.

🔴 **Driver.js 1.10.2 renders its own popover even for a step that carries no `popover`.** With its stylesheet not
imported it shows as two bare *Previous / Next* buttons at the end of `<body>` — found on LifeWell's built output by a
screenshot, invisible to every gate. Hide it in the app's base layer: `.driver-popover { display: none !important; }`.
Turn the library's keys off (`allowKeyboardControl: false`, `allowClose: false`) and handle Escape and the arrows in
the runner, capture phase, so there is one answer to each key.

## Wrapper (as built)

```
src/features/tours/
  registry.ts          # routeId → { desktop: Step[], app?: Step[] }; resolveTarget(data-tour id)
  registry.parity.test.ts   # every step's data-tour target exists in that page's dummy; every key in the catalogue
  tour-button.tsx      # the one button; lazy-loaded by the header, so the library is on no first load
  tour-hint.tsx        # the once-per-page hint
  tour-runner.tsx      # Driver overlay + our ring and card; keys, focus, the phone sheet
  tour-card.tsx        # the step card: Step n of N · title · body · All steps (jump) · Skip tour · Back · Next
  seen-state.ts        # browser set (strata-storage) + account column, merged on sign-in
  tour-analytics.ts    # the events below, through the analytics registry
  use-tours-t.ts       # t() for the tours namespace (default value required)
  walkthrough/         # steps.ts · step-count.ts · walkthrough-page.tsx · walkthrough.seo.ts · parity test
```

- **The button lives in the shared header** (the app's top bar and the public header, the same control), not in each
  page head — one place, every route. 🔴 **And in the phone app view's bar** — LifeWell's `AppBar` (the app view's
  only header, AMENDMENT 215) did not mount it, so on a real phone the home page had phone steps and no way to start
  them (AMENDMENT 241). A parity check worth writing: every layout that renders a header renders `TourButton`. Lazy: `lazy(() => import('…/tour-button'))`; measured 511 ms from press to
  *Step 1 of 3* on a cold chunk.
- **The step's index is URL state** — `?tour=<n>` (1-based) — so a refresh or a shared link opens the same step.
- **Two step sets were enough** (`desktop`, `app` for the phone view); a tablet width uses the desktop set. A step whose
  target is absent at the current width is dropped, never shown floating.
- **The phone card is a bottom sheet** below 48rem, with the highlighted element scrolled into view above it.

## The hint

- One line, one action (*Show me*) and a close; `role="status"`; never a modal. Shown for **8 s** (4 s more after the
  pointer leaves), held while hovered or focused.
- 🔴 **Keep it inside the screen.** It is right-aligned under the tour button, and on a 320 px phone the button sits
  left of other header controls, so the hint's own width pushed its left edge to −80 px (`verify:responsive`). Measure
  the hint's width once it has rendered (one `requestAnimationFrame`) and clamp `right` to `viewport − width − gap`.
- Marked seen **the moment it shows**, never on dismiss. Not shown on a task page (checkout, connect, sign-in callback)
  and not while another first-visit notice is showing.

## Seen state

- Browser: a strata-storage key holding the set of route paths.
- Account: one column on the profile row — LifeWell's `profiles.tour_hinted`, bounded (≤ 80 entries, each matching
  `^/[a-z0-9/-]{0,80}$`), written by a plain update of that column only, merged with the browser set on sign-in.
  Reason it first (`aoneahsan-cccs-supabase-schema-design`) and give it the paired privilege block.

## Analytics

`tour_hint_shown`, `tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped` (with the step index),
`walkthrough_step_viewed`, `walkthrough_cta_clicked`, through the project's analytics registry
(`aoneahsan-cccs-analytics`). Properties carry a source and a count, never a person.

## Parity tests (pre-approved class)

- Registry ↔ dummy: every important route has a tour; every step's `data-tour` target exists in that page's dummy
  markup; every string key exists in the catalogue.
- Walkthrough ↔ dummy: the step count, each step's image name and size, its bullets and its CTA.

## Screenshots for the walkthrough

- Captured at **1440 × 900 and 390 × 844** (a `mobile` device metric for 390, so the phone app view and its bar
  render), saved as `webp` (`Page.captureScreenshot` with `format: 'webp'`), committed in the dummy's
  `assets/walkthrough/` and the app's `public/walkthrough/` as the same files.
- Taken from the **dummy pages** when the live demo account has too little data to show the screen, with the dummy's
  review-only controls hidden (its state switches and demo bar) — otherwise from the live product as a seeded non-admin.
- 🔴 **They go stale silently.** LifeWell's twelve were taken before the menus and the bar moved (AMENDMENT 237), so the
  walkthrough advertised the old navigation while every gate was green. Re-capture whenever a screen they show changes,
  and look at them — a copy gate cannot read a picture.
- 🔴 Disable the cache (`Network.setCacheDisabled`) when capturing right after a CSS change: the automation browser
  otherwise serves the old stylesheet.

## Verification (what the LifeWell close actually ran)

🔴 **The 390 pass must run in the APP VIEW** — touch emulation on (`Emulation.setTouchEmulationEnabled({enabled:true})`),
`setDeviceMetricsOverride({width:390,height:844,deviceScaleFactor:3,mobile:true})`, then reload so the pre-paint
`data-view` script re-reads `pointer: coarse`. LifeWell's first close "verified the phone sheet at 390" in a desktop
Chrome: fine pointer, web view, so the gap every real phone hit was invisible to it.

On the built output, as a non-admin, at 1440 and 390: the hint shows once and not on the next visit; the button opens
step 1; `?tour=3` opens step 3; the card's *All steps* jumps; Skip and Escape close; the phone sheet at 390;
`/how-lifewell-works?step=3` opens step 3; the stray-popover check (no visible `.driver-popover`); then the same pages
on the live URL with the bundle hash compared.

## Lessons from the 2026-10-24 fleet pass (HabitForge, LabFlow, ClearHire, zaions.com, aoneahsan.com, AChat)

- 🔴 **Render the slot only after hydration** (`useSyncExternalStore(() => noop, () => true, () => false)`): a lazy
  component that suspends in a prerendered page makes it hydrate with a mismatch. Not a `useEffect` + `setState`
  (lint refuses it).
- 🔴 **The tour's CSS loads with the lazy chunk**, never in the render-blocking stylesheet (ClearHire's first-load
  budget went red by 1.4 KB). Keep the dummy's `tours.css` byte-identical and import it from the button chunk.
- 🔴 **Follow the target every frame while the tour is open** (compare the rounded box, redraw only on change; call
  `driver.refresh()`). A reveal animation or a section that changes height moves a heading with no scroll event —
  the ring sat 400px off on zaions.com at 390.
- 🔴 **A deep link waits for every target** (or ~2 s, then opens with what it has): signed-in pages draw their
  sections when data arrives, and opening on the first heading gives a one-step tour of a four-step page.
- **Where the trigger is drawn more than once** (AChat: the desktop rail, the phone list header, the public header),
  put a button before each, copy the trigger's visibility classes, and let only the visible one hint or open.
- **Where a header is too narrow on phones**, change the chrome in the dummy first (aoneahsan.com folded the Account
  word into a glyph below 30rem — keeping AD-19 — and tightened the row below 22.5rem). Measure `scrollWidth` at
  320 and 390 after the button exists; an `ml-auto`/`margin-inline-start: auto` on the trigger must move to the
  tour button (HabitForge, AChat app view).
- **Words:** the page-tour words go in the catalogue every route loads (ClearHire `common`, zaions `site`, AChat
  `common`) under a prefix that does not collide (`pageTour.*` where `tour.*` was taken by first-run tips). Data
  keys carry their namespace where a gate demands it; literal keys where a gate refuses assembled ones
  (aoneahsan.com `text-parity`). With several locales, reuse the approved translation wherever the English line
  matches an existing approved string, and match the product's register (French `tu`, Arabic `دردشة`).
- **The walkthrough page** is a real route: prerender list, SEO registry/heads, sitemap/directory, hosting
  rewrites, parity manifest and proof captures, page date. Every step is in the prerendered HTML; paging starts
  after mount. A per-step label is a literal key ("Step 3 of 6") when the markup parity scans text.
- **Back** as a text or icon button; a kit whose secondary button always ends in a forward arrow (zaions.com) uses
  an icon-only Back.
- **Branches:** the app on `wip/guided-tours`, the dummy on the kit's `wip/root-guided-tours` (the app's primary-branch
  parity reads the dummy); merge both after the owner's GATE 4.
- 🔴 **With Driver.js as overlay only, scroll to each step's target yourself** (LabFlow, 2026-10-26). Driver.js 1.10.2
  scrolls a target into view only from its own popover and transition paths; with the popover unused, a target below
  the fold stayed there and our card, placed beside it, went off screen too (pricing steps 3 and 4, card at top 6130 in a
  900 px viewport). Do what the dummy's `go()` does: `target.scrollIntoView({ block: 'center', behavior })` on every step
  change, `auto` under reduced motion. Prove it with `?tour=<last>` on a long page: the card's rect is inside the
  viewport once the scroll settles (a slow headless smooth scroll can take several seconds).
- **Reduced motion reads the theme panel's Motion axis too** (`data-motion="reduced"`), not only the media query. LabFlow's
  runner tested for `'off'`, a value the axis never has.

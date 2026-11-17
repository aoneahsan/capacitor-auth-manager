---
name: aoneahsan-cccs-guided-tours
description: 'The two in-product demo systems: a page tour (one consistent button per important page, a one-time hint per page per browser and account, skippable, closable, jump-to-step, desktop and phone step sets) and the product walkthrough page (big real screenshots, short bullets, calls to action). Driver.js behind our wrapper. Use when adding onboarding, a product or page tour, coachmarks, a walkthrough or how-it-works page, or finalizing a production project.'
metadata:
  source: 'Owner request 2026-10-21 (LifeWell root, finalize-production-projects-1-at-a-time.md). First built on LifeWell (WP016 Phase E, live 2026-10-22); completed 2026-10-23 from what that build proved.'
---

# Guided tours

## Overview

People should learn what a product does without being interrupted. Two systems serve that, both drawn in the
click dummy first and worded through the Story Bible:

- **Page tour** — "show me this page". Detailed, page-specific, started by the person.
- **Walkthrough page** — "what is this product". A few screens covering the core, reachable at any time.

Both count for 10 points in the completion standard (`aoneahsan-cccs-project-completion`).

## 1. Page tour

- **The button** sits in the same place on every route — the shared header (app top bar and public header alike);
  an icon button with an accessible name, lazy-loaded so the tour library is on no first load.
- 🔴 **EVERY CHROME THE PRODUCT RENDERS CARRIES IT — the phone app view and the native shell too** (owner, 2026-10-23,
  LifeWell: *"i tested lifewell in mobile browser and it does not show anything for tour of home page"*). A product
  with a phone app view (`aoneahsan-cccs-mobile-app-feel`) swaps its header for an app bar on a real phone; if the
  button lives only in the web header, **no phone visitor can start a tour**. List every layout's header (web header,
  app top bar, app-view bar, native shell bar) and mount the button in each, before the theme control. The phone
  step set (`app`) is useless without it. Important pages at
  minimum: home, dashboard, every domain hub, settings, account, onboarding, and each page with a non-obvious
  control.
- **The hint** points politely at the button **once per page**: a soft pulse plus one short line ("Take a quick
  tour of this page"), never a modal, never blocking, gone after 8 s (held while hovered or focused), and kept inside the screen at 320 px. Marked seen **when
  it shows**, per browser (strata-storage) and per account (one profile column), so a second device does not
  repeat it. Never shown on a task page (checkout, connect, sign-in callback).
- **The tour** is skippable and closable at every step (Close, Escape, click outside), shows progress, offers a
  step list to jump to any step, and Back/Next. Focus moves into the step card and returns to the button on
  close. It restarts from the button at any time.
- **Step sets** per page: `desktop` (anchored cards; tablets use it too) and `app` (the phone app view, a
  bottom-sheet step card with the highlighted element scrolled into view). The step index is URL state (`?tour=`). A step
  whose target is absent at the current width is skipped, never shown floating.

## 2. Walkthrough page

- One route (named in the dummy, free in the frozen URL contract), public and signed-in alike.
- 4–8 steps. Each: one big real screenshot (or two), captured from the live product at 1440 and 390 and served
  as optimised `webp` at both sizes; 1–3 bullets of one short sentence each; 1–2 calls to action ("Open your
  dashboard", "Try it now").
- `?step=` holds the current step (`aoneahsan-cccs-url-state-persistence`); arrow keys and swipe move between
  steps; the last step ends on the main CTA.
- Reached from **one consistent place in every product**: the sidebar footer on desktop and the Account / More
  tab on phones, plus the last onboarding step. 🔴 **And for a SIGNED-OUT phone visitor**: the app-view home carries the
  same "See how it works" button the web hero does — a signed-in menu row is no way in for someone who has no account
  yet (LifeWell AMENDMENT 241).

## 3. Build rules

Library, wrapper API, registry shape, persistence, analytics events, performance and the parity test:
`references/implementation.md`. 🔴 Targets use `data-tour="…"` attributes, never CSS classes. 🔴 Every string
goes through `t()`. 🔴 The library is lazy-loaded on first use, so the first-load budget does not move.
🔴 Driver.js draws its own popover even for a step without one — hide `.driver-popover`; the card is ours.
🔴 Walkthrough screenshots go stale silently when navigation changes: re-capture them, and look at them.
🔴 `prefers-reduced-motion` turns transitions off.

## 4. Verification

🔴 **390 px in a desktop browser is NOT the phone.** A phone app view switches on `pointer: coarse` as well as width,
so a narrow desktop window gets the web view and passes while every real phone shows nothing (LifeWell, 2026-10-23).
Verify the phone with touch emulation on (`Emulation.setTouchEmulationEnabled` + a `mobile` device metric) or a real
device, and assert the button is **visible** in the app view on every registered public and signed-in page.

On the live site as a **non-admin** test account at 1440 and 390 (the 390 pass in the app view, above): the hint shows once per page and not again
after a reload or on a second device; a tour can be skipped, closed and jumped mid-way; the phone sheet works;
`?step=3` on the walkthrough opens step 3. The parity test is green.

**Related:** `aoneahsan-cccs-click-dummy` · `-story-craft` · `-mobile-app-feel` · `-react-accessibility` ·
`-interaction-feedback` · `-motion` · `-strata-storage` · `-i18n` · `-analytics` · `-react-performance`

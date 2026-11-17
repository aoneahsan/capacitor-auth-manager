---
name: aoneahsan-cccs-mobile-app-feel
description: 'Making a web product feel like a native app on phones: an app view for phone browsers and the Capacitor shell beside a responsive web view, chosen pre-paint without flash or layout shift, plus the app-view vocabulary (app bar, cards, thumb-zone action, bottom bar, sheets, safe areas). Use when a page "does not feel like a mobile app", when designing a phone-first home screen, or when a Capacitor build looks like a website.'
metadata:
  source: LifeWell WP013 (2026-09-29) — real testers opened the live home page in a phone browser and said it "does not feel like a mobile app"; the owner asked for a separate mobile view, home page first
---

# Mobile app feel

## Overview

A responsive page shrinks a website to fit a phone; it still reads like a website. People who open the product
on a phone judge it as an app. They expect an app bar, big cards, one action under the thumb, and screens
that slide, not a long marketing scroll with a footer wall.

**The standard:** a page that needs it has **two compositions**. The **app view** is for phone browsers and
the native shell. The **web view** is for tablets and desktops, and it stays fully responsive down to 320 px,
because a desktop user can narrow the window. The same data, route, words and components serve both; only
the composition differs.

## 🔴 Choosing the view — once, before paint

```js
// inline in index.html <head>, beside the theme snippet and BELOW the viewport meta — no import, no framework
var native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
var phone = matchMedia('(max-width: 767px) and (pointer: coarse)').matches;
document.documentElement.dataset.view = native || phone ? 'app' : 'web';
```

- 🔴 **Place it below `<meta name="viewport">`.** Above it, a phone still measures the 980 px default layout width, so
  every phone gets the web view (ZTools A5, 2026-10-27).
- **Never the user-agent string alone.** It lies (desktop-mode browsers, tablets) and is being frozen.
- **`pointer: coarse` is required**, so a narrowed desktop window keeps the web view (responsive), exactly as
  the owner specified.
- The React side reads `data-view` through one hook (`useViewMode()`) and never re-detects. Listen for a
  change only on `orientationchange`/resize crossing the breakpoint, and swap without a reload.
- **Crawlers get the web view.** Prerendered HTML is the web composition, so SEO, the noscript body and
  JSON-LD are unchanged. The app view is a client composition.
- **No flash, no shift.** Each view is its own lazy chunk; the prerendered web body is hidden under
  `[data-view=app]` until the app view mounts, and CLS at 390 px stays ≤ 0.1.

## 🔴 Every place the web reaches, the app view reaches (owner, 2026-10-30, every project, no exception)

*"in mobile app, we must have way for user to get to each and every part of project, like we do in web, but
optimized as mobile app as best as possible"*. Rent Party's app view drew five tabs and nothing else, so Invite
friends, Inbox, Plan, Settings and nine more places had no way in on a phone.

- **Parity is counted from the route list:** every route the web header, account menu, drawer or footer links to is
  reachable in the app view in **at most two taps** from any tab. List the routes, then prove each one at 390 touch
  and in the native shell. A route reachable only by typing its address is a defect.
- **One menu, never a second one:** the tab bar holds the three to five most used; everything else lives in the
  **same** drawer or account list the web uses, opened from the app bar's Menu (or the Profile tab's list), drawn
  from the one nav registry. Never hand-copy links into an app-only menu.
- **Mobile-shaped, not web-shrunk:** a sheet or full-height drawer with 44 px rows and icons, the account's places
  under the person's name, Sign out last, admin rows only for the team, selling surfaces hidden in a store build.
- **Dummy first:** the app bar's Menu (or the Profile list) is drawn in the click dummy before the app.

## The app-view vocabulary

Read `references/app-view-patterns.md` before drawing. In short:

- **Top app bar**: brand and at most three icon actions (Menu last); no horizontal nav links.
- **Full-bleed hero card** with the one-sentence promise and **one** primary action.
- **Horizontal cards** with `scroll-snap` for the key moments, and dots that are buttons.
- **A sticky primary action in the thumb zone**, clear of the safe-area inset.
- **A bottom tab bar** for the three to five top destinations; the page carries no second navigation
  (`frontend-development` one-method-per-viewport rule).
- **Sheets, not new pages**, for short choices; a sheet is a real dialog (React Aria), dismissible by swipe
  and Escape.
- **Collapsed footer**: legal, sitemap and feed links in one disclosure. The required links still exist.
- **44 px targets, a press state within 100 ms, `prefers-reduced-motion` respected**, and no hover-only
  anything.

## Order of work

1. **Dummy first**: draw the app view as its own page in the click dummy, with a numbered amendment, using the
   approved words (`aoneahsan-cccs-click-dummy`). The owner approves it before any app code.
2. Add the pre-paint snippet and `useViewMode()`.
3. Split the page into `web-*.tsx` (the existing content, moved unchanged) and `app-*.tsx`, selected at the
   route. Share components; never fork the data layer.
4. Verify at 390 touch (app view), 1440 (web view), and a desktop window at 390 (web view, responsive).
   Check first-load size, LCP and CLS against the project budget.

## Common mistakes

| Mistake | Instead |
|---|---|
| Detecting in a React effect | The pre-paint snippet; one source of truth |
| Width alone decides | Width **and** `pointer: coarse`, or the native shell |
| The app view gets different words | Same words from the dummy; only the composition changes |
| Prerendering the app view | Crawlers keep the web view |
| Removing the footer links | Collapse them; `/sitemap` and `/feed` stay linked |
| A second nav inside the page | The bottom bar is the navigation |
| Tabs only, the other places unreachable | Menu opens the web's drawer: every place, two taps at most |

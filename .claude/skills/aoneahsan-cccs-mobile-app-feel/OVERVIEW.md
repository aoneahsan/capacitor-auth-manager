# Mobile app feel — overview

## Purpose

Real testers opened LifeWell's live home page in a phone browser and said it "does not feel like a mobile app".
The page was fully responsive; that was the problem. It was a website made to fit. This skill gives a page a
second composition, the **app view**, for phone browsers and the native shell, chosen before paint. The
**web view** stays for tablets and desktops and remains responsive down to 320 px.

## What this skill does

- Decides app view versus web view once, pre-paint, from the native shell or a coarse pointer plus narrow width
- Splits a page into web and app compositions that share words, data and components
- Supplies the app-view vocabulary: app bar, hero card, snap cards, thumb-zone action, bottom bar, sheets, safe areas
- Keeps crawlers, CLS and the first-load budget where they were

## When it gets invoked

- "it does not feel like a mobile app", "make it feel like an app", "mobile view"
- Designing a phone-first home or landing screen
- A Capacitor build that looks like a website
- Adding an app view to any further page (home first, others only when the owner asks)

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Web + Capacitor products with public or signed-in pages |
| Stack override | The concern maps to any stack: one pre-paint flag, two compositions, shared data |

## Related skills

- `aoneahsan-cccs-click-dummy` — the app view is drawn first
- `aoneahsan-cccs-frontend-development` · `-react-ui-ux` · `-motion` · `-react-accessibility` · `-react-aria`
- `aoneahsan-cccs-react-performance` — the budgets
- `aoneahsan-cccs-capacitor` — native detection and safe areas
- `aoneahsan-cccs-app-growth` — why the first screen matters

## Maintenance

- **Living registries:** `../../rules/frontend-ui-standards.md`, `../../rules/react-mobile.md`
- **Last reviewed:** 2026-09-29

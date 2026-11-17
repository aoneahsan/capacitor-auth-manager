# Capturing real screens

Every framed screen is a capture of the **current live app**. Captures are never mocked, composited or edited.

## The browser

Use the automation browser only (`~/.claude/rules/browser-automation.md`): the superpowers-chrome tool on the
`ahsan-automation` profile. Run `get_profile` before the first navigation. Never launch the owner's Chrome.

## The store app's composition

Capture what the **store app** shows, not the website. Most Capacitor projects have a review switch that draws
the native shell in a browser (Rent Party: `?shell=native`). Find it in the project's shell code or
`STORE-LISTING.md`; without one, capture from a real device build or ask the owner for device captures.

**A native app with no browser shell** (Kotlin/Compose, Flutter) and no device connected: do not wait and do not
start an emulator unless the owner asks. Draw the feature screens from the approved click dummy and the app's own
tokens, strings and icon paths (`design-system.md` → Feature-explainer shots), and frame the owner's device captures
when he sends them (2026-11-09, Waylock).

## Viewport math

Aim for 9:16. Set a mobile viewport with touch, e.g. `{width: 432, height: 768, mobile: true,
deviceScaleFactor: 2.5}`. The tool caps a screenshot at about 1013 × 1800; that is still above the frame's 756 × 1344
screen, so quality holds. Keep every capture at the same viewport so the UI scale matches across shots.

## Accounts and privacy

- Signed in as a non-admin test account (`~/.claude/rules/automation-test-accounts.md`), or signed out where the
  screen looks the same. Never an admin view: it shows staff-only controls.
- No email address, real name or private room code that stays open. Cancel any room or game made for a capture.
- Real gameplay or real content made for the capture is fine; editing a capture's pixels is not.

## Freshness check (before framing)

For every capture, compare its visible strings with the app's current i18n catalogue and the listing:

```bash
grep -rn "crowded couch" src/i18n/locales/en/*.json   # the capture said "2 to 6", the app says "2 to 8"
```

Recapture when a string, a count, a button or a layout has changed, or when the capture contradicts the
description. Record each capture's date and the app build in `STORE-LISTING.md`.

## Choosing eight screens

Shot 1 frames the core screen (the board, the editor, the dashboard). Shots 2–8 are seven **other** screens that
map one-to-one to the approved captions, in the listing's story order: start → core action → social → pause or
save → invite → reward → result. A screen used in shot 1 is not repeated.

## Where captures live

`app-publish-assets/screenshots/phone/raw/<screen>.png`, committed. Masters reference them by relative path; the
export inlines them.

# Update flow — overview

## Purpose

A user left on an old build loses fixes, hits removed APIs and walks away. The owner ruled on 2026-10-30 that every
product we ship has a tested and verified update flow, with no exception and no per-project question. Layer 1
updates the product by itself. Layer 2, a release-record gate, catches anyone layer 1 missed: an urgent release
blocks at once with its reason, and a normal release is announced at once and required from the next start.

## What this skill does

- Defines layer 1 per surface: web service-worker takeover, native-update OTA, Play immediate in-app update,
  extension auto-update, Tauri updater, Flutter in-app update, npm deprecation
- Defines layer 2: the release record, the decision table, the check timings, the block screen, the notice and the
  admin publish page
- Adds the Play in-app review to every Capacitor app
- Records the native-update quirks that make the flexible flow and the review results unsafe to use as typed
- Sets verification: a `test` channel, planted urgent and normal rows, screenshots, owner-only device checks
- Makes "update flow verified" a hard completion gate

## When it gets invoked

Building, auditing or finalizing any web app, Capacitor app, browser extension, desktop app or package;
`/finalize-project`, `/complete-project`, `/product-audit`; OTA, in-app updates, in-app review, "force update",
"new version available", "users stuck on an old version".

## References

- `references/contract.md` — release record schema, decision table, timings, offline rule, admin page
- `references/web.md` — service-worker takeover and the web Update action
- `references/capacitor.md` — OTA, Play immediate update, in-app review, native-update quirks
- `references/extension.md` — browser-extension update check and reload
- `references/desktop-flutter.md` — Tauri updater, Flutter in-app update and web
- `references/package.md` — npm packages and their websites
- `references/verification.md` — how to prove both layers

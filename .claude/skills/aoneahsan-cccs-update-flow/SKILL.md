---
name: aoneahsan-cccs-update-flow
description: 'The update flow every product must ship, no exception: self-update first (SW takeover, native-update OTA, Play immediate in-app update, in-app review, extension and Tauri auto-update), then a release-record gate read on start and resume and pushed on publish, never on a timer (urgent blocks now with its reason, normal blocks from the next start). Use when building, auditing or finalizing any product, or for OTA, in-app update or review, force update, users on an old version.'
metadata:
  source: 'Owner directive 2026-10-30 (Rent Party root): "each and every product we ship must have a tested/verified updates flow" · "no exception, never" · "do not ask for any project, it is a must for all projects". Reference implementation: Rent Party (monopoly), 2026-10-30.'
---

# Update flow

## Overview

A user on an old version is a customer we are losing to our own mistake. **Every product we ship carries a
verified update flow. It is never optional, never asked about and never deferred to "later".** Law:
`~/.claude/rules/update-flow.md`.

## The two layers

1. **Layer 1: the product updates itself, first and always.** The user does nothing.
   - Web / PWA: the new service worker takes over and the page reloads at a safe moment (`references/web.md`).
   - Capacitor: signed native-update OTA for web changes. A binary change goes through Play's **immediate**
     in-app update (`references/capacitor.md`).
   - Extension: the store's auto-update, plus `runtime.requestUpdateCheck()` → `reload()` (`references/extension.md`).
   - Tauri updater, Flutter `in_app_update` (`references/desktop-flutter.md`). npm: `references/package.md`.
2. **Layer 2: the fallback gate, in every product, even where layer 1 always works.** An admin publishes a release
   record (`references/contract.md`). The client reads it on start and when it comes back into view or resumes,
   and re-reads it the moment a release is published: a broadcast, never a timer (`aoneahsan-cccs-realtime-not-polling`).
   - **Urgent** and the running version is older → a full-screen block now, the release's reason shown, one
     **Update** action. Nothing else is usable until it is updated.
   - **Normal** and older → tell the user at once that a new version is out and is required from the next start.
     Store that, and **block from the next start** until updated.
   - **Update** runs layer 1 (reload into the new build, apply the OTA bundle, Play immediate update) and falls
     back to the store page.

**In-app review** ships with every Capacitor app: Play's own sheet after a real success moment, throttled.

## Quick reference

| Need | Do |
|---|---|
| Version the client reports | the build's own version (`__APP_VERSION__`), the OTA bundle's, `App.getInfo()` for the binary |
| Release record | a DB table + a public latest-row view + an audited admin publish action + an admin page |
| Testing | a `test` channel and a build that reads it; **never** plant a production row |
| Offline | fail open, except a normal release already stored, which still blocks at the next start |
| Words | the block screen, the notice and the admin page are drawn in the click dummy first; i18n keys |

## Common mistakes

- Treating "the SW updates itself" as the whole flow. Layer 2 is still owed.
- Flexible Play updates through native-update ≤4.1.1: Android restarts the app with no prompt. Use **immediate**.
- Reading native-update's review results by their TypeScript names. Android returns `allowed` / `shown`; read
  both (`references/capacitor.md`).
- A gate that blocks when the check fails (offline, 5xx). Blocking is for a known newer release only.
- Calling it done from a green build. Prove it with the `test` channel and screenshots (`references/verification.md`).

## Finalization

`/finalize-project` and `/complete-project` load this skill. "Update flow verified" is a **hard gate** in
`aoneahsan-cccs-project-completion`: a project without both layers proven is not complete, whatever its score.

---
name: aoneahsan-cccs-pwa-no-cache
description: 'Every own React web app is an installable PWA with NO service-worker caching or offline mode, plus a @capacitor/network full-screen blocking offline overlay that lifts after a real request and refetches without reloading. Manifest, icons, cache-free worker, build gate, headers, install UX, CDP checks; 5 points. Use for /pwa, finalize and complete runs, PWA, manifest, service worker, offline, @capacitor/network, vite-plugin-pwa or workbox.'
metadata:
  author: aoneahsan
  source: 'Owner request 2026-11-17 (production-projects/random-tasks/pwa). Builds on the update-flow web layer and finalization-playbook-02 cache-clearing lesson.'
---

# Installable PWA, no caching, offline overlay

🔴 **Floor:** `aoneahsan-cccs-custom-made`. Law and his words: `~/.claude/rules-detail/pwa-no-cache.md`.
Worker registration and takeover belong to `aoneahsan-cccs-update-flow` (its web reference); this skill owns the
worker's *contents*, the manifest, install UX and connectivity.

## What every React web app ships

| Piece | Standard | Reference |
|---|---|---|
| Manifest | `public/manifest.webmanifest`, full field set, 192/512/maskable icons from the SVG master, wide + narrow screenshots, iOS meta in `index.html` | `references/manifest-and-icons.md` |
| Worker | `public/sw.js`: skipWaiting, claim, delete only legacy caches, **no fetch handler, no precache**, build stamp, push handlers kept | `references/service-worker.md` |
| Build gate | `vite/pwa-no-cache.ts` plugin: stamps the worker, fails the build on any cache code, vite-plugin-pwa, or a short manifest | `references/build-gate.md` |
| Headers | `index.html`, `/sw.js`, `/manifest.webmanifest` → `Cache-Control: no-cache`; hashed `/assets/*` immutable | `references/build-gate.md` |
| Install UX | own install control (`beforeinstallprompt`), iOS Add-to-Home-Screen sheet, hidden in standalone and native, Settings entry | `references/install-ux.md` |
| Connectivity | one `ConnectivityProvider` on `@capacitor/network`, confirmed by a real `no-store` request | `references/connectivity-overlay.md` |
| Offline overlay | full screen, app root `inert`, drop-down panel, focus trapped, announced, the product's own words and tokens | `references/connectivity-overlay.md` |
| Reconnect | "Back online" ~1 s, outbox replays, active queries refetch, realtime resubscribes, **no reload** | `references/connectivity-overlay.md` |

"No caching" means no Cache Storage, no precache, no cache-first or stale-while-revalidate route, and no offline
shell. HTTP caching of fingerprinted build files is not offline caching and stays.

## Rules that decide edge cases

- 🔴 A worker never deletes a cache it does not own: `strata-storage-*` lives in Cache Storage (playbook-02).
- 🔴 `vite-plugin-pwa`, `workbox-*` and `virtual:pwa-register` are removed, not configured down. (`caches.open` in the
  client bundle is allowed only inside strata-storage's own Cache API adapter.)
- 🔴 No timer re-checks connectivity (`aoneahsan-cccs-realtime-not-polling`): status events, `visibilitychange`
  and the user's "Try again" only.
- "Connected" is a hint. The overlay lifts only after `fetch('/version.json', { cache: 'no-store' })` (or the
  project's own health endpoint) answers 2xx — captive portals report connected.
- A 1.5 s grace period before showing; a blip never flashes the overlay.
- Never reload on reconnect. Reload only for a newer build found while offline or a failed lazy chunk, at the
  update-flow's safe moment (idle or hidden).
- Existing app-level offline features (outbox, cached reads over strata-storage) stay only when they replay
  cleanly under the overlay with zero console errors; otherwise fix or remove them. Owner, 2026-11-17: *"i just do
  not want fucking errors"*. Ad-hoc `useOnline`/`useNetworkStatus` hooks fold into the one provider.
- 🔴 The overlay is never fetched on demand, and its words live in a namespace bundled at boot: with no cache, a chunk
  not fetched before the connection went never arrives. Put it in the first load, or — where the project has a
  first-load budget gate (HabitForge, ClearHire) — keep only the tiny store eager and **preload the screen's chunk at
  idle right after boot** (`ConnectionGateHost`), so it is in memory before any connection drops.
- A product with a **working offline feature** (an outbox, queued quick actions, designed per-page offline states)
  keeps it behind an **escape** on the overlay — "Keep logging offline" (LifeWell), "Carry on offline" (HabitForge),
  "Keep using the tracker offline" (ClearHire) — which hands back the page to its own offline states (owner,
  2026-11-17: block, plus an opt-in escape; keep existing offline features where they work). Where a user setting
  gates offline logging (LifeWell's "Keep working offline"), the escape shows only while it is on. A product with no
  offline feature is simply blocked. Reconnect after an escape needs no "Back online" line.
- An existing `useOnline()`-style hook keeps its API and reads the store, AND treats `navigator.onLine === false` as
  offline (always truthful) — test drivers that stub `navigator.onLine` keep working.
- The refetch runs AFTER every outbox handler, whenever it registered: give the store an `afterConnectionRestored`
  phase, because a page-level replay registers long after the app's refetch.
- A shared blocking screen (update gate + connection screen) shares one inert-behind / no-way-out helper.
- Native Capacitor shell: the overlay runs; the install control never shows.
- Click dummy first: the overlay, the "Back online" state and the install sheet are drawn in the project's dummy
  before code (`frontend-ui-standards.md`).
- Words through i18n keys, in the project's Story Bible voice; never "You are offline" alone — say what happens
  ("Your changes are safe. We'll pick up where you left off once you're connected.") in that product's voice.

## Done means (5 points; scorecard row "Installable PWA, no caching, offline overlay")

All of `references/verification.md` on the **live** URL: installability errors `[]`, built worker passes the gate
(and the gate was seen failing on a planted fetch handler), offline overlay blocks at 1440 and 390, reconnect lifts
it and refetches without a reload, zero console errors, `pwa-status.json` row pushed, and the owner's real-phone
install check queued in `docs/MANUAL-TASKS.md`.

Agent: `aoneahsan-ccca-pwa`. Command: `/pwa`. Status:
`projects-finalization-record/production/pwa-status.json`. Migration from older setups: `references/migration.md`.

# Overview — `aoneahsan-cccs-pwa-no-cache`

Created 2026-11-17 from the owner's request. It backs `/pwa` and is a 5-point row in `/finalize-project` and
`/complete-project` for every category that ships a React web app.

## Purpose

Every own React web app installs properly on phones and computers, never serves anything from a service-worker cache,
and shows one honest, blocking offline overlay driven by `@capacitor/network` until a real request succeeds.

## Files

- `SKILL.md`: the pieces, edge-case rules, done means.
- `references/manifest-and-icons.md`: manifest fields, icons, screenshots, iOS meta.
- `references/service-worker.md`: the worker template and cleanup list.
- `references/build-gate.md`: the Vite plugin and `_headers`.
- `references/install-ux.md`: the install control on Chrome/Edge/Android and iOS.
- `references/connectivity-overlay.md`: provider, overlay, reconnect, outbox interplay.
- `references/verification.md`: CDP checks, local and live.
- `references/migration.md`: removing vite-plugin-pwa/workbox, folding old hooks.

Agent: `aoneahsan-ccca-pwa`. Status: `projects-finalization-record/production/pwa-status.json`. Law:
`rules/pwa-no-cache.md`.

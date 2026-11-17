# Verification — local, then live

Use the automation browser only (`browser-automation.md`: CHROME_WS_BROWSER, `ahsan-automation` profile). Every
check below runs on the local production build (`yarn build` + the project's preview/`wrangler pages dev dist` on its
registered port) and again on the live URL with cache disabled. Save evidence under the run folder named in
`/pwa` and link it from `pwa-status.json`.

| # | Check | How | Pass |
|---|---|---|---|
| 1 | Installable | CDP `Page.getInstallabilityErrors` | `{ installabilityErrors: [] }` |
| 2 | Manifest parsed | CDP `Page.getAppManifest` | no `errors`; `id`, icons, screenshots present |
| 3 | Worker active, no fetch | `navigator.serviceWorker.getRegistration()` → active `scriptURL` ends `/sw.js`; fetch `/sw.js` text has no `fetch` listener and carries this build's stamp | true |
| 4 | Nothing cached | after a full load and two route changes: `await caches.keys()` | only `strata-storage-*` (or `[]`) |
| 5 | Requests hit network | CDP `Network.responseReceived` for the next navigation: no `fromServiceWorker: true` | true |
| 6 | Headers | `curl -sI` for `/`, `/sw.js`, `/manifest.webmanifest`, `/version.json` | `no-cache` / `no-store` as in `build-gate.md` |
| 7 | Offline overlay | `Network.emulateNetworkConditions({ offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })`, wait 2 s | overlay visible, app root has `inert`, a click on a page button does nothing, focus is inside the panel |
| 8 | Blip ignored | offline for 500 ms then online | overlay never rendered |
| 9 | Reconnect | back online | "Back online" then overlay gone within ~2 s, `performance.getEntriesByType('navigation')` count unchanged (no reload), active queries refetched (network log), a typed form value is still there |
| 10 | Captive portal | online but block `/version.json` (`Network.setBlockedURLs`), tap Try again | overlay stays |
| 11 | Console | across 1–10 | zero uncaught errors, zero `CHANNEL_ERROR` loops |
| 12 | Both widths | 1440 desktop and 390 with touch emulation (phone app view) | screenshots of overlay + install control |
| 13 | Native shell (if `android/`) | build is not required here; confirm `@capacitor/network` in `android/capacitor.plugins.json` after `cap sync` | listed |

Also prove the old-worker path when the project previously had a caching worker: in a fresh profile, load the
**previous live build** first (or the retired worker address with a planted cache), then the new deploy — the old
caches are gone after one load and the tab ends on the new build.

Pilot lessons (LifeWell, 2026-11-17):
- Serve the built output from OUTSIDE the repo (`cd <scratchpad> && npx wrangler pages dev <abs>/dist-pages`):
  run inside it, wrangler writes `.wrangler/` into the repo and lint fails on its generated files.
- The automation Chrome on this fleet needs `--no-sandbox --ozone-platform=headless`; launch your own on a free port
  with the project's profile, and kill only that pid. Never `pkill -f` (it matches its own shell).
- A Cloudflare zone's browser-cache TTL can serve `/sw.js` with `max-age=14400` despite `_headers`. It is harmless
  (a worker update check bypasses the HTTP cache for the main script); report it, don't chase it.
- A new Capacitor plugin can add an Android permission: a project's permissions contract test (LifeWell's
  `public-surface-contract.test.ts`) must list it; `@capacitor/network` adds `ACCESS_NETWORK_STATE`.
- Test the offline chunk case: offline, switch to 390 with touch emulation, then online. Exactly one reload after the
  probe passes is right; a reload while offline is the defect.

Session 2 lessons (HabitForge, ClearHire, 2026-11-17):
- 🔴 **Tailwind v4 scans the repo's `.claude/skills/` copies** (synced by `/sync-project-skills`) and `docs/`, and
  generates their example classes (`hover:tab-4`, `focus-visible:ring-2`) into the blocking stylesheet: +3.4 kB on
  ClearHire, enough to break its first-load budget. Add `@source not '../../.claude'; @source not '../../docs';`
  (path relative to the CSS entry) in every repo you touch. Prove it with a rule-set diff of live vs local CSS.
- The first visit after deploy on a browser that had the old caching worker shows one takeover reload and, during
  it, `Page.getInstallabilityErrors` can report `no-manifest`. Re-read on the settled page before failing it.
- A sentence split around an inline glyph breaks copy-parity gates: put the glyph first and keep one key per sentence.
- Projects with state-dependent words (an install card jsdom never shows) declare them in their parity ledger with a
  reason, the same way they declare other runtime-only words.

Phone install on real devices (Android Chrome, iOS Safari) is the owner's: add a `docs/MANUAL-TASKS.md` row with
the URL and what to look for; it does not hold the 5 points, which are earned by checks 1–12 live.

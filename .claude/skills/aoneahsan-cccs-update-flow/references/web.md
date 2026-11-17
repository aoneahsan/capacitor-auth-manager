# Layer 1 on the web — the service worker takes over

The web half is the deploy-reaches-open-tabs law (`~/.claude/rules/deploy-verification.md`, Rent Party D-142):

- Register the worker after the first paint. Ask the registration for an update when the page comes back into
  view, after a change of page (at most once a minute), and on layer 2's release broadcast — never on a timer
  (the 30-minute check was retired on 2026-11-03, `aoneahsan-cccs-realtime-not-polling`). To reach a tab that
  stays in view, publish the deploy's release record: its broadcast reaches every open tab.
- A newly installed worker is asked to take over at once (`postMessage({ type: 'SKIP_WAITING' })`). Never hold
  it behind a click.
- After the takeover, a page that has only just opened (under ~10 s) reloads at once. Any other page loads its
  next change of page in full, or reloads while hidden. A chunk the new deploy no longer has reloads the page
  instead of failing.
- Every own React web app is an installable PWA with **no caching** (`rules/pwa-no-cache.md`): the worker's
  contents, the manifest, the build stamp and the gate live in `aoneahsan-cccs-pwa-no-cache`
  (its service-worker and build-gate references). It has no fetch handler and precaches nothing. This file owns
  only registration, takeover and the reload moment.

- 🔴 **Stamp the build into the worker.** `registration.update()` finds a new worker only when `/sw.js` changed
  **bytes**. A cache-free takeover worker's code never changes, so write the build's entry chunk name into it at build
  time (a Vite `closeBundle` or Docusaurus `postBuild` step replacing a marker line) and fail the build when the
  marker or the stamp is missing. A hand-bumped constant was forgotten twice on windowsweep's docs, and no open tab
  took either deploy (found 2026-11-05).

**The Update action** (from the layer 2 block or notice): `registration.update()`. If a waiting worker appears,
take over and reload. If none appears within ~8 s, `location.reload()`. A hard reload fetches `index.html` fresh,
so the HTML must be served `Cache-Control: no-cache` (Cloudflare Pages `_headers`).

**Versions:** inject `package.json` `version` with Vite `define: { __APP_VERSION__ }` and show it in the footer or
settings. Bump the version for every user-visible release, or layer 2 cannot tell builds apart.

**Without a worker** (a site with none at all): layer 2 still runs, and Update is `location.reload()`.

## A tab opened on a first visit must move too (Empora, 2026-11-06)

Guarding the takeover listener with `if (navigator.serviceWorker.controller)` at registration leaves a first-visit tab listening to nothing: the worker's first `clients.claim()` gives it a controller later, and every later deploy passes it by. It looks fine in a test run from a profile that visited before. Always attach the listener and skip only the first `controllerchange` when the page started with no controller. Prove both paths: a fresh browser context, and a tab that has reloaded once.

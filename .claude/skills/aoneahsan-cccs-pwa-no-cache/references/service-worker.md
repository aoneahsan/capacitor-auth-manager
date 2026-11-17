# The cache-free worker

`public/sw.js`, plain JS, never processed by a PWA plugin:

```js
/* <product> service worker — installable PWA, NO caching (rules/pwa-no-cache.md). */
// BUILD_STAMP: __BUILD_STAMP__   ← replaced at build by vite/pwa-no-cache.ts; the gate fails if left as is

const LEGACY_CACHE = /^(workbox-|vite-pwa|precache|runtime|pages|images|static-|api-)/;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Delete only caches a former PWA plugin made. strata-storage-* is user data: never touch it.
    await Promise.all(keys.filter((k) => LEGACY_CACHE.test(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// No 'fetch' listener on purpose: every request goes to the network as if there were no worker.
// Push / notificationclick handlers (OneSignal or server push) go below, unchanged.
```

- 🔴 **No `fetch` listener at all.** Even a pass-through `fetch(event.request)` adds latency and breaks streaming,
  range requests and some auth redirects. Current Chrome, Edge and Android do not require one to install.
- `caches.keys()`/`caches.delete()` in the activate cleanup are the only Cache Storage calls allowed; the build gate
  allows exactly these two (see `build-gate.md`).
- The `LEGACY_CACHE` pattern is per project: before writing it, list the live origin's caches in the automation
  browser (`await caches.keys()`) and make sure every non-strata name is matched and no strata name is.
- A worker with no fetch handler never serves a page, so it cannot hold a tab on an old build: plain
  `register('/sw.js', { scope: '/' })` after `load`, `registration.update()` on `visibilitychange`, skip in dev and in
  the native shell. Freshness stays with the update flow's reload and chunk logic. When a project already has the
  takeover code, keep it.
- Registration, `SKIP_WAITING`, `controllerchange` and the reload moment come from
  `aoneahsan-cccs-update-flow/references/web.md` — never re-implement them here.
- OneSignal: its worker stays at its own path/scope (`aoneahsan-cccs-onesignal`); when a project imports OneSignal
  into `sw.js` with `importScripts`, keep that line and verify the imported worker does not add a fetch handler
  (OneSignal's does not cache).
- One worker per origin at `/sw.js`, scope `/`. Delete `registerSW.js` and every other worker *source*. 🔴 But a
  browser that installed an old caching worker at another address (`/service-worker.js`, vite-plugin-pwa's
  `/sw.js` with precache) keeps serving its cached `index.html` until **that address** returns new bytes. So the
  build gate copies the stamped `dist/sw.js` to every retired address listed in `RETIRED_WORKER_PATHS`
  (`build-gate.md`): the old registration updates to the cache-free worker, deletes its caches, claims the tab,
  and the update-flow takeover reloads it into the current build (playbook-04, "a no-worker site with an install
  manifest still owes layer 1"). Keep the retired copies for at least 6 months; record the removal date in
  `docs/PROJECT-CONTEXT.md`.

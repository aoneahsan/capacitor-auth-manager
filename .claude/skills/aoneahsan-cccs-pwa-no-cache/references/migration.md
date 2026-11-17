# Migration from older setups

Read the repo first: `package.json` (`vite-plugin-pwa`, `workbox-*`, `@capacitor/network`), `vite.config.*`,
`public/` (`sw.js`, `service-worker.js`, manifests), `index.html`, `main.tsx`, and grep `src/` for
`navigator.onLine|addEventListener\('(on|off)line'|useOnline|useNetworkStatus|use-online-status|networkStatusChange|offline-state|registerSW|virtual:pwa`.

| Found | Do |
|---|---|
| `vite-plugin-pwa` (any mode) | remove the plugin and package, its `registerSW`/`virtual:pwa-register` import and types; its old `sw.js` address becomes a retired path only if the new worker lives elsewhere (normally it is `/sw.js` already, so the new bytes replace it) |
| workbox in a hand-written worker | rewrite the worker from `service-worker.md`; list every old cache name for `LEGACY_CACHE` |
| A worker at another path | retired path in `RETIRED_WORKER_PATHS` |
| Two manifests | keep `manifest.webmanifest`; delete the other and its `<link>` |
| Missing icons / screenshots | generate from the SVG master; real captures |
| `navigator.onLine` hooks, banners, `offline-state` screens | move callers to `useConnectivity()`; delete the old hook and component and their i18n keys; keep any words worth keeping by moving them into `connectivity.*` |
| Outbox (offline-sync) | keep and wire into `onRestored` if replay is clean; otherwise fix or remove |
| `@capacitor/network` already used in places | one provider owns the listener; other call sites read the store |
| A worker stamp step elsewhere | fold into `pwaNoCache` |
| Update-flow layer 1 missing | not this skill's job alone — load `aoneahsan-cccs-update-flow` and add registration + takeover in the same change, since a worker without takeover leaves tabs on old builds |

After migration `yarn why vite-plugin-pwa workbox-window` prints nothing and the build gate is green.

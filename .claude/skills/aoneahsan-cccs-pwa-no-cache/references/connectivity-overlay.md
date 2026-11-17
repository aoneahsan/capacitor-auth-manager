# Connectivity provider and the offline overlay

## Package

`yarn add @capacitor/network` (and `@capacitor/core` if a marketing site lacks it — the web implementation needs
no native platform). Run `npx cap sync` only in a repo that already has `android/`/`ios/`. Add it to
`docs/PACKAGES.md`.

## One provider, one state machine

States: `online` → `checking` → `offline` → `restoring` → `online`.

```ts
// src/connectivity/connectivity.ts
import { Network } from '@capacitor/network';

const GRACE_MS = 1500;      // a blip never shows the overlay
const BACK_ONLINE_MS = 1000;

async function reachable(): Promise<boolean> {
  try {
    const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
    return res.ok;
  } catch { return false; }
}

export function startConnectivity(set: (s: State) => void, onRestored: () => Promise<void>) {
  let graceTimer: number | undefined;
  let state: State = 'online';
  const go = (s: State) => { state = s; set(s); };

  const handle = async (connected: boolean) => {
    window.clearTimeout(graceTimer);
    if (!connected) {
      if (state === 'online') graceTimer = window.setTimeout(() => go('offline'), GRACE_MS);
      return;
    }
    if (state === 'online') return;
    go('checking');
    if (!(await reachable())) { go('offline'); return; }      // captive portal / no route
    go('restoring');
    await onRestored();
    window.setTimeout(() => go('online'), BACK_ONLINE_MS);
  };

  void Network.getStatus().then((s) => handle(s.connected));
  const sub = Network.addListener('networkStatusChange', (s) => void handle(s.connected));
  const onVisible = () => { if (document.visibilityState === 'visible') void Network.getStatus().then((s) => handle(s.connected)); };
  document.addEventListener('visibilitychange', onVisible);
  return {
    retry: () => handle(true),                                 // the overlay's "Try again"
    stop: async () => { (await sub).remove(); document.removeEventListener('visibilitychange', onVisible); },
  };
}
```

The two `setTimeout`s are one-shot UI delays, not polling: nothing re-checks the network on a timer.

Also treat a request that fails with a network `TypeError` (Axios `ERR_NETWORK`, `fetch` rejection) as a hint: call
`handle(false)` from the API client's error interceptor *only* when `Network.getStatus()` agrees — otherwise a
single CORS or DNS failure would block the app.

🔴 **Loading the plugin dynamically** (a project that bans static native imports, or one that keeps it off the first
load): never resolve a promise WITH the plugin. A Capacitor plugin is a proxy that answers every property, `then`
included, so `import('@capacitor/network').then((m) => m.Network)` calls `Network.then()` and throws "not implemented
on web" — the store silently never starts. Resolve `({ plugin: m.Network })` and destructure (Pregnancy Pal, 2026-11-17).

## `onRestored` — recover without reloading

1. Replay the outbox first if the app has one (`aoneahsan-cccs-offline-sync`), so stale reads never overwrite the
   user's own writes.
2. `queryClient.resumePausedMutations()` then `queryClient.refetchQueries({ type: 'active' })`.
3. Supabase realtime: `supabase.realtime.connect()` if it dropped; channels re-join on their own — confirm in the
   console that no `CHANNEL_ERROR` loops. Refetch closes the gap (`aoneahsan-cccs-supabase-realtime`).
4. Tell the update flow to check now (`registration.update()` + release record read). If it finds a newer build or
   a lazy chunk failed while offline, its own safe-moment reload runs. Nothing else reloads.

TanStack Query: set `onlineManager.setEventListener` to the same provider so queries pause while offline instead
of erroring:

```ts
onlineManager.setEventListener((setOnline) => {
  const sub = Network.addListener('networkStatusChange', (s) => setOnline(s.connected));
  return () => { void sub.then((h) => h.remove()); };
});
```

## 🔴 A chunk that fails while offline must not reload the page (LifeWell pilot, 2026-11-17)

With no cache, any lazy chunk asked for after the connection went fails — the phone view's lazy parts, a route, a
dialog. The update flow's chunk-reload handler (`vite:preloadError` → `location.reload()`) then reloads straight into
the browser's offline error page, and the app is gone until the person reloads by hand. Guard it: while
`!navigator.onLine` or the provider is not `online`, leave the error to the route's error view (under the overlay) and
register one `onConnectionRestored(() => location.reload())`. Prove it: offline, switch to 390 with touch emulation (or
open a lazy route), then online — one reload after the probe passes, never one while offline.

## The overlay

- Rendered in a portal **outside** the app root. While shown, the app root gets `inert` (React 19: `inert` prop;
  React 18: `inert=""`) and `aria-hidden` is not needed on top of `inert`. Body scroll is locked.
- Backdrop dims the whole viewport; a panel drops from the top edge (transform only, ~240 ms, the project's easing
  token; `prefers-reduced-motion` → opacity only). On phones the panel spans full width under the safe-area inset.
- `role="alertdialog"`, `aria-modal="true"`, labelled and described by the panel's heading and text; focus moves to
  "Try again" and is trapped (React Aria `FocusScope contain restoreFocus`, or the project's `Modal` primitive with
  dismiss disabled). Escape does nothing — the state is not the user's to dismiss.
- Content: the product's mark, a heading and one sentence in its voice saying their work is safe and the app will
  continue by itself, a "Try again" button (shows a spinner while `checking`), and — if the app has an outbox —
  "N changes saved, they'll sync when you're back".
- `restoring`: the panel shows a "Back online" line with a check mark for ~1 s and slides away; focus returns where
  it was.
- Theme-aware (reads the theme axis tokens), i18n keys under `connectivity.*`, 320 → 1920, 44 px targets.
- Never shown on the boot loader before the app knows it is offline at first load: a first visit with no network
  never reaches the app at all (no cache), so the browser's own offline page appears — that is expected.

## Existing offline features

- Cached reads (TanStack persister, strata-storage snapshots) may stay; they are invisible under the overlay and
  harmless.
- An outbox may stay when it replays cleanly; the overlay shows its pending count. If it throws, double-writes or
  logs errors on replay, fix it; if it cannot be made clean, remove it and say so in the run log.
- Delete ad-hoc online hooks and banners after moving their callers to `useConnectivity()`.

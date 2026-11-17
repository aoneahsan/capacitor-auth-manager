# Install UX

The browser's own install affordance stays (address-bar icon, Android mini-infobar). On top, each product offers
its own install control, drawn in its dummy, in its own words and tokens.

## Where it appears

- A quiet "Install app" control in the header's overflow/account menu and a row in Settings → App.
- One dismissible in-flow card (never a modal, never on a task page: sign-in callback, checkout, connect) after
  the user's first real success moment, at most once per browser and account. Dismissal is stored with
  strata-storage (`pwa.install.dismissedAt`); Settings always offers it again.
- Hidden when: `matchMedia('(display-mode: standalone)').matches` or `navigator.standalone` (iOS) — already
  installed; `Capacitor.isNativePlatform()` — the native app; no prompt available and not iOS Safari.

## Chrome, Edge, Android, Samsung

```ts
// src/pwa/install.ts — one module; components read it through a tiny zustand store.
let deferred: BeforeInstallPromptEvent | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();               // keep it for our control; the address-bar icon still shows
  deferred = e as BeforeInstallPromptEvent;
  useInstallStore.setState({ canPrompt: true });
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  useInstallStore.setState({ canPrompt: false, installed: true });
  track('pwa_installed');           // event registry name
});
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  useInstallStore.setState({ canPrompt: false });
  return outcome;                   // 'accepted' | 'dismissed'
}
```

Register the listeners at module load in `main.tsx` (before React mounts) — the event can fire before the first
render. Declare `BeforeInstallPromptEvent` in `src/types/pwa.d.ts`.

## iOS and iPadOS Safari (no prompt API)

Detect iOS Safari not in standalone; the control opens a small sheet with three illustrated steps: the Share icon →
"Add to Home Screen" → "Add". Use the real Share glyph drawn as SVG, not an emoji. Other iOS browsers since iOS 16.4
also offer Add to Home Screen from their share menu; say "your browser's Share menu" there.

## Desktop

Chrome and Edge install into a window; `display_override: window-controls-overlay` is optional polish — only when the
header is designed for it (`env(titlebar-area-*)`), otherwise drop it from the manifest.

## Analytics

`pwa_install_prompted`, `pwa_install_outcome {outcome}`, `pwa_installed`, and the `source=pwa` launch dimension —
added to the project's event registry, never ad-hoc strings.

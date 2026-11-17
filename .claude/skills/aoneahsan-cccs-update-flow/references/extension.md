# Layer 1 in a browser extension

Stores update extensions themselves, but only every few hours, and only after the browser restarts the service
worker. Pull the update sooner:

- In the background service worker, call `browser.runtime.requestUpdateCheck()` on startup, when a popup or
  options page opens, and from an `alarms` alarm every 6 hours (alarms survive worker sleep; `setInterval` does
  not). The alarm is the marked `platform-no-connection` exception of `aoneahsan-cccs-realtime-not-polling`: the
  worker cannot hold a connection and the store cannot push to it. Mark it
  `// polling-exception: platform-no-connection — MV3 worker sleeps; the store cannot push`.
  `'update_available'` → `browser.runtime.reload()` when no extension page is open; otherwise wait for
  `runtime.onUpdateAvailable` and reload once the popup and options pages close.
- Firefox does not implement `requestUpdateCheck` for AMO-signed add-ons in every channel. Guard the call and rely
  on `onUpdateAvailable`.
- A version bump goes through the full version cascade (`aoneahsan-cccs-browser-extension-finalization`).

**Layer 2** runs in the popup and options pages (they are the extension's UI). It reads the `extension` platform
record over HTTPS from the bundled API host (no remote code: the response is data only). The block replaces the
popup's content. Update calls `requestUpdateCheck` → `reload`, falling back to a link to the store listing for
that browser.

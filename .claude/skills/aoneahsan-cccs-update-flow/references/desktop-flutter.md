# Layer 1 on desktop (Tauri) and Flutter

## Tauri

The updater plugin (`aoneahsan-cccs-tauri-distribution`): `check()` at start and when the window comes back into
view, never on a timer (the 6-hour check was retired on 2026-11-03, `aoneahsan-cccs-realtime-not-polling`); layer 2's
release broadcast reaches a window that stays open. A found update **downloads in the background at once**, and
`onCloseRequested` installs it when the window closes (`preventDefault`, `update.install({ restartAfterInstall: false })`,
then `destroy()`; never during a running job), so "install it later" is true with no click. *Install and restart*
reuses that download. The minisign key is backed up and restore-proven the day it is made (`project-config.md`).
Layer 2 reads the `desktop` record. Update calls `check()` → install → relaunch, falling back to the GitHub Releases page.

- 🔴 **`latest.json` lists every bundle that ships.** The plugin looks up `{os}-{arch}-{installer}`, then `{os}-{arch}`.
  With NSIS and MSI both on the download page, write `windows-x86_64-nsis`, `windows-x86_64-msi` and the generic
  `windows-x86_64` (→ the MSI, the tauri-action layout). A hand-written file with only `-nsis` left every MSI install
  with no update (windowsweep 1.4.1-1.4.2, found 2026-11-05). Each `signature` is the `.sig` file's exact text.
- **Verify each signature against the SHIPPED public key before upload** (`tauri.conf.json` `plugins.updater.pubkey`):
  minisign `ED` = Ed25519 over the file's BLAKE2b-512, plus a global signature over the signature and the trusted
  comment. Node's `crypto` checks both (`createHash('blake2b512')`, an Ed25519 JWK); plant a one-byte change and watch
  it fail. An installed app taking the update is the end-to-end proof for its own installer type only.
- **Install-on-close is proved by the NEXT release:** the build that ships it can only be tested by an installed
  copy of itself staging a newer version.

## Flutter

- **Android:** `in_app_update` (`checkForUpdate()` → `performImmediateUpdate()` when urgent or priority ≥ 4).
  The same immediate-first rule applies.
- **Web:** the Flutter service worker (`aoneahsan-cccs-flutter-web-deploy`). Version the worker so a deploy takes
  over; Update reloads.
- **Layer 2** is a Riverpod provider reading the record on start, on `AppLifecycleState.resumed` and on a data-free
  broadcast from a database trigger when a notice is published (`realtime.send`, public topic; the client re-reads,
  spaced 5 s). Never a timer. Block with a full-screen route above the router (go_router `redirect`). Reference:
  CallVault `release_notice_controller.dart`, migration `20261106100000`.

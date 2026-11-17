# Proving the update flow

A green build proves nothing about updates. Each layer is proven on its own.

## Layer 2 (agent-doable, every project)

1. Build with the **test** channel (`VITE_RELEASE_CHANNEL=test`), serve that build on the project's registered
   port, and open it in the automation browser at 1440 and 390.
2. Publish a **normal** test release above the build's version through the admin RPC (as a non-admin viewer in a
   second target, never as the admin). Within one check (or after a visibility change) the notice appears →
   screenshot. Reload → the block appears with the reason → screenshot.
3. Publish an **urgent** test release above that one → the block appears at once, without a reload.
4. Publish a test release **equal** to the build's version → reload → nothing shows, and the stored notice is cleared.
5. Go offline with a stored normal notice → reload → the block still shows. Offline with nothing stored → no block.
6. Remove the test rows (or publish a test row at `0.0.0`), and confirm the **production** channel has no row above
   the live version, so no player is ever blocked by a test.
7. Run the pure-logic tests for `decide` and `compareSemver`, and watch one fail against a planted wrong row.

## Layer 1

- **Web:** deploy, keep an old tab open, and confirm it takes the new build (the footer version changes) without
  a manual reload (`deploy-verification.md`).
- **OTA:** deploy a throwaway `0.0.x` build to the **development** channel with `npx native-update deploy --wait`,
  confirm `/api/v1/updates/check` returns it signed, verify the signature against the public key built into the app
  (`openssl dgst -sha256 -verify`), then delete it. The on-device switch (footer marker
  `native-update-implementation-testing-tN`, or the version) is an owner row in `docs/MANUAL-TASKS.md`.
- **Play immediate update + review:** owner-only on a Play-installed phone (internal app sharing or an internal test
  track with a higher `versionCode`). Write the exact steps and expected screens in `docs/MANUAL-TASKS.md`.

## Record

Each project records it in its completion audit row ("update flow: layer 1 ✓/✗ · layer 2 ✓/✗ · verified <date>")
and in the fleet tracker `~/Documents/01-code/docs/tracking/update-flow-tracker.json`.

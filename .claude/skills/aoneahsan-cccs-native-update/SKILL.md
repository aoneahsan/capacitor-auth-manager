---
name: aoneahsan-cccs-native-update
description: 'Native Update v4 integration and migration for Capacitor apps: signed OTA delivery, verified delta/full fallback, locked configuration, rollback confirmation, release UX, package-issue routing. Use when adding or upgrading native-update, shipping a web fix without a store release, or when a bundle is not offered or applied.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/projects/native-update-platform.md
---

# Native Update v4 integration

Read `~/.claude/rules/native-update-package.md` when present. It owns the live wire contract, versions,
consumer registry, and quirks; this skill owns the stable integration procedure.

## Gate the native shell first

> **Verified against the package tree at v4.0.2 on 2026-09-04** — every floor below was read from source,
> not carried forward: `package.json` (`engines.node >=24.16.0`, peer `@capacitor/core ^8.0.1`),
> `android/build.gradle` (`minSdkVersion 26`, `compileSdk`/`targetSdk 36`, `JavaVersion.VERSION_21`),
> `NativeUpdate.podspec` (`ios.deployment_target '14.0'`), `src/plugin.ts` (`setUpdateUrl()` still a
> logged no-op). ⚠️ Android is pinned at **API 36 deliberately** — the next AGP line needs compileSdk 37,
> which Capacitor 8 does not support; do not "helpfully" raise it.

Require Capacitor 8, Node 24.16+, Java 21, Android API 26+/SDK 36, and iOS 14+. Upgrade the native shell and
web package together when moving from v3 to v4; never send v4 JavaScript into a v3 native binary.

Treat the client-shipped `nu_app_` key and RSA public key as required production configuration. If either is
empty, keep OTA fully off without crashing. A binary built without them cannot receive its first OTA until a
native reinstall.

## Initialize once, then confirm every boot

Initialize with the canonical server base ending in `/api`, `requireSignature:true`, and
`enableDeltaUpdates:true`. Production signing is RSA-SHA256. Unsigned fixtures require both
`requireSignature:false` and `allowUnsignedDevelopmentUpdates:true`; native release builds ignore that escape
hatch.

Configuration locks after initialization. `setUpdateUrl()` is a deprecated no-op; call `reset()` and perform
one fresh initialization to change a locked setting. Call **`notifyAppReady()` immediately after successful
initialization on every healthy boot**. Two unconfirmed cold starts roll back; an integrity mismatch rolls
back immediately.

## Use the delta-aware flow

Check on native only and never block first paint. Prompt before an optional update; a mandatory update skips
the opt-out. Prefer `checkForUpdate()` → `downloadUpdate()` → `applyUpdate()`: it retains the complete signed
manifest and uses a compatible `NUDELTA/1` patch when worthwhile. Patch/source/bounds/target validation is
mandatory; any failure falls back to the signed full bundle.

If custom progress or UX requires `download()`, forward `signatureAlgorithm` and `delta` with the URL,
version, checksum, and signature. Dropping those fields silently disables the v4-safe path.

## OTA, in-app update and in-app review ship together

Every Capacitor app on native-update ships all three (owner, 2026-10-30), plus the layer 2 release-record gate
(`aoneahsan-cccs-update-flow`). Never add another update or review plugin beside it. On ≤4.1.1, use
`performImmediateUpdate()` only: the flexible flow restarts the app the moment it has downloaded. Read
`canRequestReview` / `requestReview` as `allowed ?? canRequest` and `shown ?? displayed`, because Android returns
the first names (`aoneahsan-cccs-update-flow/references/capacitor.md`).

## Prove the whole chain

Render a literal `native-update-implementation-testing-t{X}` footer marker and bump `X` per test bundle.
Seeing it change on a physical device proves build → upload → check → download/delta → apply → reload. Test
Android and iOS full download, delta success, forced full fallback, checksum/signature rejection, and rollback
before a production rollout.

When the package misbehaves, record the consumer finding at `docs/NATIVE_UPDATE_PACKAGE_ISSUES.md`, file the
repro in the package repo's `docs/REPORTED-ISSUES.md`, and mirror the reusable quirk into the living rule (see
`aoneahsan-cccs-report-project-issues`).

For initialization, migration, update-flow, and release examples, read `references/integration.md`.
Provisioning apps/keys/signing/keystore and shipping releases through CI belongs to
`aoneahsan-cccs-native-update-management-api`.

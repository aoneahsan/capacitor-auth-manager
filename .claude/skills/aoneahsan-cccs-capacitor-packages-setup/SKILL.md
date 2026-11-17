---
name: aoneahsan-cccs-capacitor-packages-setup
description: 'The Capacitor package baseline every React project audits against: official plugins, Capawesome additions, strata-storage, native-update for OTA, pwa-elements, and the minimum-permissions confirmation. Use when setting up a project, auditing one for finalisation, adding a native capability, or choosing a storage API.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/projects/ztools-capacitor-android.md
---

# Capacitor package baseline

The audit checklist for a new project, and for any project heading toward release.

## 🔴 Trapeze is part of the baseline

Every Capacitor project declares the latest stable `@trapezedev/configure` dev dependency, retains root
`apps-config.yaml` for its active native platforms, and keeps the exact package script
`"sync:apps-config": "trapeze run apps-config.yaml"`. Never remove it because no application source imports
it: the package is used by configuration and the release command. Run the script before native sync/build
when managed config changes, targeting guarded native variables rather than bypassing them with literals.
The full common package set and the standard script names (`cap:sync`, `cap:open:android`,
`android:build:debug`, `android:bundle:release`) are in
`aoneahsan-cccs-packages-up-to-date/references/baseline.md`.

## 🔴 strata-storage is the storage layer

**`strata-storage` replaces `localStorage`, `@capacitor/preferences`, IndexedDB access, cookies and session
storage** — one API across web and native, one place to change.

> ⚠️ This **supersedes** the older rule naming `@capacitor/preferences` as the localStorage replacement.
> ztools and other older projects still use Preferences; that is acceptable until they are revisited, but new
> work uses strata-storage. It is the owner's own package: `npmjs.com/package/strata-storage`.

Nothing in the app touches a storage API directly — one adapter module, everything else goes through it. That
is what makes the migration a one-file change.

## The official plugin set

Install what the project actually uses, and nothing else — every plugin can inject permissions.

**Effectively always:** `@capacitor/app` (lifecycle, deep-link URLs), `device`, 🔴 `network` (mandatory in every own
React web app, marketing sites too — it drives the offline overlay, `aoneahsan-cccs-pwa-no-cache`), `preferences`
(until strata-storage lands), `share`, `splash-screen`, `toast`, `dialog`, `haptics`, `clipboard`, `browser`.

**Only when the feature exists:** `camera`, `geolocation`, `barcode-scanner`, `motion`, `push-notifications`.
Each of these costs a permission — see `aoneahsan-cccs-android-finalization`.

**`@ionic/pwa-elements`** is required for official plugins (camera, toast, dialog) to work on **web**. Without
it they silently no-op in the browser.

## Capawesome additions

`@capawesome/capacitor-app-update` (in-app update prompts), `capacitor-app-review` (review at a positive
moment), `capacitor-android-edge-to-edge-support` (Android 15+), `capacitor-badge`, `capacitor-app-shortcuts`.

**Remove any Capawesome plugin duplicating an official one.**

⚠️ **If you add the edge-to-edge plugin, set `SystemBars: { insetsHandling: 'disable' }`** — otherwise two
inset owners fight and content renders behind the bars. And if `android.includePlugins` is set in the config,
that list is a **strict allowlist**: a plugin absent from it is inert natively.

## native-update for OTA

The owner's own OTA package — ship web-layer fixes without a store release. Verify with a literal
`native-update-implementation-testing-t{X}` marker in the footer before attempting anything larger. Contract
and quirks: `~/.claude/rules/native-update-package.md`. See `aoneahsan-cccs-native-update`.

## Auth and push

**Google Sign-In:** Firebase popup on web; `@codetrix-studio/capacitor-google-auth` on native. Never
`@capacitor-firebase/authentication`. **Push:** OneSignal, never hand-rolled VAPID/FCM/APNs.

## Banned

`@capacitor-firebase/crashlytics` and `@capacitor-firebase/performance` — Gradle wiring plus noisy runtime
errors. Sentry for errors; native APIs or Amplitude for performance.

## Minimum permissions

Every plugin you add is a permission you may have to justify to a reviewer. Audit the **merged** manifest, not
the source. For the full checklist, read `references/audit.md`.

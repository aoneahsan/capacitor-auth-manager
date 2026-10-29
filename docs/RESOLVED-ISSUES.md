# Resolved issues

History of closed entries from [`REPORTED-ISSUES.md`](./REPORTED-ISSUES.md), each with its fix date and
fixing version. Entries are moved here, never deleted.

### ISSUE-007 — Android Google sign-in fails on Play-installed builds with no account picker (3.0.0)

**Status:** RESOLVED · **Fixed:** 2026-10-29 · **Published version:** 3.1.0 (logcat: 3.1.1) · **Reported:** 2026-10-29 by the owner, every production Android app (LifeWell, Rent Party, AChat, …) · **Affects:** `capacitor-auth-manager@3.0.0`, `android/…/GoogleAuthProvider.java`

**Symptom** — Tapping Google sign-in in a Play-installed release showed an error and never an account chooser. The same apps signed in through `@codetrix-studio/capacitor-google-auth` (legacy GoogleSignIn) in their previous releases, with the same Web client and the same registered SHA-1s (LifeWell: upload `C5:CB:…` and Play App Signing `39:B7:…`, both with Android OAuth clients). Supabase recorded no `grant_type=id_token` request, so the failure was native.

**Cause** — 3.0.0 ran Android Credential Manager alone. It refused the request before any UI; on Android 14+ it routes through the system credential service and depends on the device's credential-provider settings, which GoogleSignIn never touches. A second defect hid the cause: `NoCredentialException` was replaced by the package's own text, so Google's message never reached the app or logcat. The R8 keep rules also sat in `proguard-rules.pro`, which never reaches a consumer.

**Fix** — `androidFlow: 'auto'` runs GoogleSignIn first (the codetrix path, its result through Capacitor's `@ActivityCallback`) and falls back to Credential Manager on any failure except a cancel. Every error carries Google's class + message, and configuration errors add the installed package + signing SHA-1. Keep rules moved to `consumer-rules.pro`. `play-services-auth` pinned to 21.6.0 because 22.0.0 removed GoogleSignIn.

**Logcat** — 3.1.1 writes native warnings and errors on release builds (`adb logcat -s CapacitorAuthManager`), so a device test shows the exact cause.

**Verified** — typecheck, lint, build, 30 tests, tarball smoke, and `smoke:native android` (debug + R8-minified release in a clean Capacitor 8 consumer). Real sign-in is a device check, done by the owner with a locally signed APK.

ISSUE-001…005 were fixed in the unpublished **2.5.0** source (2026-09-08) and shipped in **3.0.0** (2026-10-09); their history remains in `CHANGELOG.md`.

### ISSUE-006 — 2.5.0 is committed but never published: npm `latest` (2.4.4) still merges `READ_SMS` / `RECEIVE_SMS` / `USE_BIOMETRIC`

**Status:** RESOLVED · **Fixed:** 2026-10-09 · **Published version:** 3.0.0 · **Reported:** 2026-10-09 from Tilawah (Android consumer) · **Affects:**
`capacitor-auth-manager@2.4.4` (current npm `latest`), `android/src/main/AndroidManifest.xml`, `README.md`

**Symptom** — An app that installs the package from npm gets three extra permissions in its merged Android
manifest, none of which the Google provider uses:

```xml
<!-- node_modules/capacitor-auth-manager/android/src/main/AndroidManifest.xml (2.4.4 tarball) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.READ_SMS" />
```

`READ_SMS` / `RECEIVE_SMS` are Play-restricted (SMS & Call Log policy): a consumer app that ships them
without an approved default-handler use case is rejected. The 2.4.4 README on npm says the opposite —
*"The plugin adds no manifest permissions of its own"* (Installation → Android) — so consumers have no
reason to look.

**Repro**

```bash
npm view capacitor-auth-manager dist-tags          # { latest: '2.4.4' } — no 2.5.0
yarn add capacitor-auth-manager && npx cap sync android && (cd android && ./gradlew processDebugMainManifest)
grep -o 'android.permission.[A-Z_]*' \
  android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml | sort -u
# → includes READ_SMS, RECEIVE_SMS, USE_BIOMETRIC
```

**Root cause** — Already fixed in source, never released. Commit `7a077c6` (2026-09-03) reduced the manifest
to `INTERNET` only, and `CHANGELOG.md` → `[2.5.0] - 2026-09-08` lists it under *Fixed*; `package.json` reads
`2.5.0`; CI on `main` is green (2026-09-08). But the npm registry's versions end at `2.4.4` — there is no
publish workflow in `.github/workflows/` (only `ci.yml`), and the manual publish never happened. Every other
2.5.0 fix (ISSUE-001…005, the One-Tap hang, the `getCurrentUser()` `{}` bug, the native error codes) is
equally unshipped.

**Consumer workaround (until 2.5.0+ is on npm)** — in the app's `android/app/src/main/AndroidManifest.xml`
(with `xmlns:tools` on `<manifest>`):

```xml
<uses-permission android:name="android.permission.READ_SMS" tools:node="remove" />
<uses-permission android:name="android.permission.RECEIVE_SMS" tools:node="remove" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" tools:node="remove" />
```

**Suggested fix** — Publish `2.5.0` (or the next version) after the usual gates + tarball smoke test, then
confirm with `npm pack capacitor-auth-manager@latest` that the packed `android/src/main/AndroidManifest.xml`
declares only `INTERNET`. Consider a CI step that fails when the packed manifest contains any permission
beyond `INTERNET`, so a re-enabled provider cannot reintroduce one silently. Optional: also ship consumer R8
rules (`consumerProguardFiles`) — today consumers add their own `-keep class com.aoneahsan.capacitor_auth_manager.** { *; }`.

## Release verification

Published 3.0.0 is npm latest. The downloaded registry artifact declares only `android.permission.INTERNET`, includes native Google sources and consumer R8 rules, and excludes disabled providers and source maps. A fresh registry consumer passed all ESM/CommonJS imports, React SSR state, browser bundle, and complete AI-guide TypeScript examples. Release CI passed Node 24/26, Android debug/minified release, and iOS simulator compilation. The consuming app still needs real OAuth/device tests before production rollout.

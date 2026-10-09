# Reported issues

Open issues only. Each moves to [`RESOLVED-ISSUES.md`](./RESOLVED-ISSUES.md) with its date and fixing version
when it ships. Numbering continues across both files (ISSUE-001…005 closed in 2.5.0 — see `CHANGELOG.md`).

### ISSUE-006 — 2.5.0 is committed but never published: npm `latest` (2.4.4) still merges `READ_SMS` / `RECEIVE_SMS` / `USE_BIOMETRIC`

**Status:** OPEN · **Reported:** 2026-10-09 from Tilawah (Android consumer) · **Affects:**
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

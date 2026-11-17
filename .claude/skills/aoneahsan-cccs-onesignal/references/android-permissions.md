# What OneSignal injects into the Android manifest

Read this when auditing the merged manifest before a Play upload, or when a permission appears that no
plugin in `package.json` seems to explain.

## 🔴 17 launcher badge permissions come from OneSignal itself

Measured on aoneahsan-portfolio, 2026-08-21. `com.onesignal:notifications` injects `READ_APP_BADGE` plus
Samsung, Huawei, HTC, Sony, Oppo, Apex and "Everything" launcher variants — **17 in total** — and they are
**not** contributed by any badge plugin. Removing `@capawesome/capacitor-badge` leaves all 17 in place.

They are unavoidable with push, carry **no runtime prompt** and **no Data Safety consequence**. Do not chase
them: justify them in the store listing as OneSignal's, and move on.

## Proving where a permission actually came from

```
app/build/outputs/logs/manifest-merger-debug-report.txt
```

The blame report names the contributing library per node, which is the only way to answer "which dependency
added this" without guessing.

🔴 **Re-read the merged manifest with `--rerun-tasks`.** Gradle serves the PREVIOUS merged manifest from its
cache otherwise, and a stale file reads exactly like fresh evidence — you audit a build you did not make.

## The rest

The permission-stripping technique (`tools:node="remove"`), `POST_NOTIFICATIONS`, and the `AD_ID` three-way
agreement stay in `SKILL.md`, because they are decisions rather than evidence.

## Merged-manifest audit summary (moved from SKILL.md)

The Cordova plugin injects permissions — audit the **merged** manifest, strip unused ones with
`tools:node="remove"`, and justify the **17 launcher-badge permissions OneSignal itself injects** as
OneSignal's rather than chasing them (blame-report procedure: `references/integration.md` ·
`references/android-permissions.md`). **`POST_NOTIFICATIONS`** (Android 13+) is requested behind the opt-in.

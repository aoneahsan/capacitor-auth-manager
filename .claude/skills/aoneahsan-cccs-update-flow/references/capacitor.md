# Layer 1 in a Capacitor app — OTA, Play immediate update, in-app review

All three come from the owner's **native-update** package (`aoneahsan-cccs-native-update`). Never add
`@capawesome/capacitor-app-update` or another review plugin beside it: no duplicate package.

## 1. OTA (web changes, no store release)

Follow `aoneahsan-cccs-native-update`:
- one locked `initialize` (`requireSignature: true`, `enableDeltaUpdates: true`, `autoCheck` / `autoUpdate`
  off), with `notifyAppReady()` on every healthy start;
- after the first paint: `checkForUpdate → downloadUpdate → applyUpdate`, switching quietly at once while the app
  is fresh, otherwise at the next background;
- a **mandatory** bundle (`mandatory: true` on the server build) applies at once.

Mirror the layer 2 severity: an urgent web release is deployed with `mandatory: true`.

**A binary without the three values** (API URL, `nu_app_` key, public key) never receives OTA. Layer 2 then sends
the user to the store. Release builds must carry them.

## 2. Play in-app update (native code changed)

At start, after the first paint and before the OTA check:

```ts
const info = await NativeUpdate.getAppUpdateInfo(); // Android only; skip on web
if (info.updateAvailable && info.immediateUpdateAllowed && (urgent || (info.updatePriority ?? 0) >= 4)) {
  await NativeUpdate.performImmediateUpdate(); // Play's own full-screen flow, no words of ours
}
```

- `urgent` = the layer 2 record for `android` is urgent and its `min_native_version` is above `App.getInfo().version`.
- Set the in-app update priority when uploading (Play Developer API `inAppUpdatePriority`, 0–5). The Console
  cannot set it, so record the value in the release notes task for the owner.
- 🔴 **Do not use the flexible flow with native-update ≤ 4.1.1.** On `DOWNLOADED`, Android calls
  `appUpdateManager.completeUpdate()` straight away ("popupSnackbar" is a stub), so the app restarts in the middle
  of use. Immediate only, until the package ships a real prompt.
- When Play reports no update (a side-loaded build or an internal test track), layer 2's Update falls back to
  `NativeUpdate.openAppStore()` (market:// then https).

## 3. In-app review

```ts
const can = (await NativeUpdate.canRequestReview()) as { canRequest?: boolean; allowed?: boolean };
if (can.canRequest ?? can.allowed) {
  const r = (await NativeUpdate.requestReview()) as { displayed?: boolean; shown?: boolean };
}
```

- 🔴 **Android returns `allowed` / `shown`; the TypeScript types say `canRequest` / `displayed`** (native-update ≤
  4.1.1). Read both. Reading only the typed names means the review never shows.
- The native side throttles too: 7 days since install, 3 launches, 90 days between prompts, at most 3 ever. Our
  trigger sits on top: a real success moment (a finished game, a completed task, the third successful use). Never
  on start, never after an error, never behind a "Rate us?" pre-prompt of our own.
- Play decides whether the sheet shows. The result never says whether the user reviewed, so never reward or gate
  on it.

## Order at start

`notifyAppReady` (immediately) → first paint → Play immediate update check → OTA check → layer 2 gate.
Every step is wrapped so that a failure is logged and never stops the app.

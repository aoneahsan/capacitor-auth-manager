# OneSignal integration — code, worker scope, quotes and Android detail

> Moved verbatim from `SKILL.md` on 2026-08-25 (context pass: body over the 1,100-word hard cap).
> The body keeps every law and ban; this file carries the code blocks, the owner quotes in full, and the
> Android forensics.

## The owner directives, verbatim

Receive-only, 2026-08-20: *"we will not be using onesignal rest api, so do not ask me for it in any
project, unless i say myself in some project that for this project we need to implement onesignal rest api
flow, we only use onesignal to receive push notifications in web and android and in future in ios."*

One site URL, 2026-08-25: *"i can only add 1 site url in onesignal, and that is live url of this and each
project, so we will just confirm on deployed app simple… do not ask me again for this"*.

## The kill switch

```ts
const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;   // a UUID; safe to commit and ship

export function pushConfigured() {
  return Boolean(APP_ID);
}
```

**Empty means push is fully off** — no SDK, no worker, no prompt. Every entry point checks
`pushConfigured()` first, so a project ships push-ready and he switches it on by setting the id.

## One service, two lazy paths

```ts
export async function initPush() {
  if (!pushConfigured()) return;
  if (Capacitor.isNativePlatform()) {
    const {default: OneSignal} = await import('onesignal-cordova-plugin');
    OneSignal.initialize(APP_ID);
  } else {
    const {default: OneSignal} = await import('react-onesignal');
    await OneSignal.init({appId: APP_ID, serviceWorkerPath: '/push/onesignal/OneSignalSDKWorker.js',
                          serviceWorkerParam: {scope: '/push/onesignal/'}});
  }
}
```

**Dynamic-import each SDK**, so neither build bundles the other's. Initialise native at boot (so a tap can
route) and web **lazily, on opt-in** — ~30 KB for users who never enable push is waste.

## Service-worker scope

If a PWA or Workbox worker already owns scope `/`, OneSignal's worker **must** live in a subdirectory or the
two collide and one silently wins:

```
public/push/onesignal/OneSignalSDKWorker.js   →  scope '/push/onesignal/'
```

The file is one line importing OneSignal's CDN worker. Add `https://cdn.onesignal.com` to `script-src` and
`https://onesignal.com https://*.onesignal.com` to `connect-src`, or web push fails with no useful error.

## Reading the two probes

**Web:** `config.siteInfo.origin` is the one origin push is bound to; `features.restrict_origin.enable` and
`config.setupBehavior.allowLocalhostAsSecureOrigin` decide whether **localhost can ever subscribe** — so a
local failure there is configuration, to be reported as the measured reason, not a defect to hunt or a pass to
claim. **Android:** no `android_sender_id` means the FCM service account was never uploaded, so the app
subscribes and receives nothing however correct the code is. That upload is the one push item still worth an
owner row.

🔴 **Both probes green is not a live subscription: read the page's CSP too** (Pregnancy Pal, 2026-11-11). The v16
page SDK fetches its config as a JSONP **script** from `https://api.onesignal.com/sync/<app>/web`. A `script-src`
that allows only `cdn.onesignal.com` blocks it, `init()` rejects, and the app silently stays "off" on the right
origin. `script-src` needs `https://cdn.onesignal.com https://api.onesignal.com https://onesignal.com`, and
`connect-src` needs `https://onesignal.com https://*.onesignal.com`. Proof is the browser, not the probes: worker
registered under its scope, `PushSubscription.optedIn` true with a token. Headless Chrome hard-denies
notifications, and CDP `Browser.grantPermissions` did not take on Chrome 152. Seed the profile's
`profile.content_settings.exceptions.notifications` entry for the origin (setting 1) before launch, in a
visible automation window.

## The 17 injected badge permissions

🔴 **OneSignal injects 17 launcher badge permissions of its own** — not from any badge plugin, unavoidable
with push, no runtime prompt and no Data Safety consequence. Justify them as OneSignal's rather than chasing
them, and prove any permission's origin from the manifest-merger blame report — 🔴 with `--rerun-tasks`, or
Gradle hands you the previous merged manifest and it reads exactly like evidence.
`references/android-permissions.md`.

## Body sections compressed in place on 2026-08-25 — originals, verbatim

> The SKILL.md body was over the 1,100-word hard cap; these sections were shortened there. The
> originals are preserved here so nothing is lost.

Owner directive, 2026-08-20: *"we will not be using onesignal rest api, so do not ask me for it in any
project, unless i say myself in some project that for this project we need to implement onesignal rest api
flow, we only use onesignal to receive push notifications in web and android and in future in ios."*

**You build the subscription, the honest opt-in and the tap routing. He broadcasts by hand in the dashboard.
Nobody builds a server-side send path** unless he names it for that project, in that conversation.

Owner directive 2026-08-25: *"i can only add 1 site url in onesignal, and that is live url of this and each
project, so we will just confirm on deployed app simple… do not ask me again for this"*.

`allowLocalhostAsSecureOrigin` is **false in every project, permanently, by decision**. Never ask him to flip
it, never file a row for it, never hunt a defect when a local subscribe fails. Write the path correct by
construction and **confirm it once on the deployed origin**.

## 🔴 Service-worker scope

## Permission behind a user action

Never prompt at launch. A prompt with no context is denied, and a denial is **effectively permanent** —
browser and OS both stop asking. Explain the value, then request on an explicit opt-in.

## Notification taps must route

A tap opening a blank home screen wastes the notification. Route the payload's deep link on both platforms;
on native, wire it at boot, before the first tap can arrive.

OneSignal delivers over FCM, configured **in the OneSignal console** (owner-only) by uploading the Firebase
service-account JSON. 🔴 **The app does NOT need `google-services.json`** — the SDK takes the sender id from
`android_params` at runtime. Capacitor's generated `app/build.gradle` says *"Push Notifications won't work"*
without that file; for OneSignal the comment is **false**, and it has sent sessions asking the owner for a
file no OneSignal app needs.

The Cordova plugin injects permissions — audit the **merged** manifest and strip what the app does not use
with `tools:node="remove"`.

**`POST_NOTIFICATIONS`** (Android 13+) is a runtime permission, requested behind the opt-in.

🔴 **`AD_ID` must agree in three places** — the manifest, the Play advertising-id declaration, and the Data
Safety "Device or other IDs" row. Disagreement between the three is a Play Console error.

🔴 **But on the owner's own apps `AD_ID` is kept REGARDLESS — standing directive, 2026-08-21:** *"we
will have ads in almost all of our own projects, so always keep this permission please."* Push
delivery genuinely does not need the advertising id, so the natural conclusion is to strip it when
OneSignal segmentation is unused — **that conclusion is correct in general and wrong here.** Keep it
declared, answer Advertising ID = Yes (purpose: Analytics), and declare Device or other IDs.
`~/.claude/rules/publishing-compliance.md` · OD-52.

## The two unauthenticated curl probes

```bash
APP=<app_id>
curl -s "https://onesignal.com/api/v1/sync/$APP/web"                               # web platform
curl -s "https://api.onesignal.com/api/v1/apps/$APP/android_params.js?app_id=$APP"  # android platform
```

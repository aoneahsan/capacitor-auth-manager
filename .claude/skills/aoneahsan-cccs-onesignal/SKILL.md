---
name: aoneahsan-cccs-onesignal
description: 'Push through OneSignal, RECEIVE-ONLY: we subscribe the device and route the tap, the owner broadcasts from the dashboard, and the REST API key is never requested in any project. One service branching web and native, the app-id kill switch, service-worker scoping beside a PWA worker, permission behind a user action, two unauthenticated probes telling you whether web and Android are configured, the AD_ID declaration. Use when adding or debugging push, or when a daily reminder is mistaken for one.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# OneSignal push

**All push — web and mobile, every project — is OneSignal on the free tier.** Never a hand-rolled VAPID, FCM
or APNs pipeline. Full rule and platform matrix: `~/.claude/rules/push-notifications.md`.

## 🔴 Receive-only — never ask for the REST API key, in any project

Owner directive 2026-08-20 (verbatim in `references/integration.md`): **you build the subscription, the
honest opt-in and the tap routing. He broadcasts by hand in the dashboard. Nobody builds a server-side send
path** unless he names it for that project, in that conversation.

`VITE_ONESIGNAL_APP_ID` is the entire client contract. A vault `onesignal` service holding only `app_id` is
**complete** — `has.rest_api_key: false` is the expected fleet-wide state, never a gap, never a
`MANUAL-TASKS.md` row, never a blocking question.

🔴 **Do not let "we cannot send" defer the work.** That reasoning cost habitforge a whole wave (OD-69).
Subscription is what lets the dashboard reach anyone, and it never needed the key.

🔴 **A daily reminder is a LOCAL notification, not a push** — `@capacitor/local-notifications`, scheduled on
the device: no server, no network, correct across timezones by construction.
`aoneahsan-cccs-reminders-notifications` owns that engine. Reaching for push here turns a per-user preference
into a backend.

## 🔴 Ask curl whether the app is configured — never the owner

Both endpoints are unauthenticated; the app id is a public UUID.

Run the two probes in `references/integration.md` (web `sync/<app>/web`, Android `android_params.js`)
whenever setup state is in question.

Web: `config.siteInfo.origin` is the one bound origin. Android: **no `android_sender_id` means the FCM
service account was never uploaded** — the app subscribes and receives nothing however correct the code is;
that upload is the one push item still worth an owner row. Field-by-field reading:
`references/integration.md`.

## 🔴 One site URL per app — the LIVE one. Localhost is never enabled

Owner directive 2026-08-25 (verbatim in `references/integration.md`): `allowLocalhostAsSecureOrigin` is
**false in every project, permanently, by decision**. Never ask him to flip it, never file a row for it,
never hunt a defect when a local subscribe fails. Write the path correct by construction and **confirm it
once on the deployed origin**.

🔴 **The consequence in the UI is the part that gets missed: permission granted ≠ device subscribed.** The
browser grants happily on any origin; the subscription can only exist on the registered one. A page reading
only `Notification.permission` therefore reports *"push is on"* over a device the dashboard cannot reach —
the switch-that-lies, arriving through the back door. **Read `OneSignal.User.PushSubscription.optedIn` too**,
and let the page say *granted but not subscribed here*, which on a dev origin is the expected state rather
than an error. 🔴 Any copy saying so goes into the approved click dummy **first**; an app-only explanation is
drift even when it is true.

## The kill switch, and one service with two lazy paths

**An empty `VITE_ONESIGNAL_APP_ID` means push is fully off** — no SDK, no worker, no prompt; every entry
point checks `pushConfigured()` first, so a project ships push-ready and he switches it on by setting the id.
One `initPush()` branches on `Capacitor.isNativePlatform()` and **dynamic-imports each SDK** so neither build
bundles the other's; native initialises at boot (a tap must route), web **lazily, on opt-in** — ~30 KB for
users who never enable push is waste. The exact code: `references/integration.md`.

🔴 **Service-worker scope:** beside a PWA/Workbox worker owning `/`, OneSignal's worker **must** live in a
subdirectory (`public/push/onesignal/`, scope `/push/onesignal/`) or one silently wins. CSP needs
`https://cdn.onesignal.com` in `script-src` and `https://onesignal.com https://*.onesignal.com` in
`connect-src`, or web push fails with no useful error. Worker file contents: `references/integration.md`.

## Permission and taps

Never prompt at launch — a context-free prompt is denied, and a denial is **effectively permanent** on both
browser and OS. Explain the value, then request on an explicit opt-in. And a tap must route the payload's
deep link on both platforms — wired at boot on native, before the first tap can arrive; a tap opening a blank
home screen wastes the notification.

## Android specifics

OneSignal delivers over FCM, configured **in the OneSignal console** (owner-only) by uploading the Firebase
service-account JSON. 🔴 **The app does NOT need `google-services.json`** — the SDK takes the sender id from
`android_params` at runtime; Capacitor's generated `build.gradle` comment claiming otherwise is **false** for
OneSignal.

Audit the **merged** manifest (the Cordova plugin injects permissions, 17 launcher-badge ones from OneSignal
itself); read `references/android-permissions.md` before a Play upload. **`POST_NOTIFICATIONS`** stays behind the opt-in.

🔴 **`AD_ID` must agree in three places** — manifest, Play advertising-id declaration, Data Safety "Device or
other IDs". 🔴 **On the owner's own apps `AD_ID` is kept REGARDLESS — standing directive 2026-08-21** (*"we
will have ads in almost all of our own projects, so always keep this permission"*): push does not need it, so
the natural conclusion is to strip it — **correct in general and wrong here.** Keep it declared, Advertising
ID = Yes (purpose: Analytics). `~/.claude/rules/publishing-compliance.md` · OD-52.

## Common mistakes

Read `references/common-mistakes.md` when reviewing a push integration — twelve mistakes, from a
hand-rolled VAPID and asking for the REST key to a static import of both SDKs and a tap opening home.

## Related skills

`aoneahsan-cccs-reminders-notifications` (the engine that decides *what* to send) · `-capacitor` (native
plugin setup) · `-android-finalization` (the merged manifest and the declarations) · `-react-ui-ux` (the
opt-in surface).

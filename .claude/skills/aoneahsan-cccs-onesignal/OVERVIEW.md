# OneSignal push — overview

## Purpose

`~/.claude/rules/push-notifications.md` has carried the OneSignal rule for a while, but no skill did — so the
platform split, the service-worker scoping and the Android declarations were re-derived per project. This is
that rule as an invokable skill.

The rule itself came from a real finding: a project had shipped a self-rolled, web-only,
never-deliverable VAPID scaffold instead of OneSignal, which the fleet already ran elsewhere. Raw VAPID
registers a subscription but still needs a server holding the private key to ever send, and does nothing at
all on native.

## What this skill does

- States **OneSignal for all push, web and native**, and why a hand-rolled pipeline does not work.
- 🔴 Fixes the scope at **receive-only** (owner directive 2026-08-20): we subscribe the device and route the
  tap, **he broadcasts from the dashboard**, and the **REST API key is never requested in any project** unless
  he names it for that one. A vault `onesignal` service holding only `app_id` is complete.
- 🔴 Separates a **daily reminder** (a local notification on the device) from **push** (a broadcast channel),
  because conflating them turns a per-user preference into a backend.
- Gives the **two unauthenticated probes** that answer "is web configured? is Android configured?" — so setup
  state is measured with `curl` rather than asked of the owner, and a refused localhost subscription is
  recognised as configuration rather than chased as a defect.
- 🔴 Corrects the long-standing claim that OneSignal Android needs `google-services.json`. It does not.
- Makes `VITE_ONESIGNAL_APP_ID` a **kill switch** — empty means no SDK, no worker, no prompt — so a project
  ships push-ready and the owner enables it.
- Gives **one service with two dynamically-imported paths**, so neither build bundles the other's SDK.
- Requires **subdirectory service-worker scoping** beside an existing PWA worker, plus the CSP entries.
- Requires permission **behind a user action**, because a denial is effectively permanent.
- Requires **notification taps to route** to the relevant screen.
- Carries the Android specifics, including the **AD_ID three-way agreement** that is a Play Console error when
  broken.

## When it gets invoked

- Adding push notifications to a project.
- Wondering whether a project is "missing" the OneSignal REST API key. It is not.
- Deciding how a scheduled per-user reminder should be delivered.
- Wiring what happens when a notification is tapped.
- A service worker collision, or web push failing silently.
- Preparing an Android build that includes OneSignal.
- Completing the Data Safety and advertising-id declarations.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project with push — web, Capacitor Android, or both |
| Stack override | The concern is *one push provider behind one service, off by default, with permission earned*. Flutter projects use the OneSignal Flutter SDK with the same discipline. |

## Sources

| Source | Record |
|---|---|
| The house push rule, its platform matrix and Android specifics | `~/.claude/rules/push-notifications.md` — pointed at, not copied |
| The AD_ID ↔ Data Safety agreement and the Play error it causes | `~/.claude/rules/publishing-compliance.md` |
| The receive-only directive, verbatim, and the two probes | `~/.claude/rules-detail/push-notifications.md` (owner, 2026-08-20) |
| Measured evidence for both probes | habitforge, 2026-08-20 — web configured, Android not, and no `google-services.json` in the shipped old app |

## Related skills

- `aoneahsan-cccs-reminders-notifications` — the engine deciding what to send and when
- `aoneahsan-cccs-capacitor` — native plugin setup and platform branching
- `aoneahsan-cccs-android-finalization` — the merged manifest and the store declarations
- `aoneahsan-cccs-react-ui-ux` — the opt-in surface and its copy

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/push-notifications.md` (the full platform
  matrix and per-project state) and `~/.claude/rules/publishing-compliance.md` (the AD_ID agreement).
- **Last reviewed:** 2026-08-20 (receive-only; the probes; the `google-services.json` correction)

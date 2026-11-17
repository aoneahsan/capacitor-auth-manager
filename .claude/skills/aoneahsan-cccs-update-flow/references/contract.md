# Layer 2 contract — the release record and the gate

## The release record

Supabase is the default (`aoneahsan-cccs-supabase`, `-drizzle-orm`). A project still on Firebase keeps one
Firestore document per platform+channel with the same fields.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `platform` | enum `web` · `android` · `extension` · `desktop` (only the ones the product ships) | |
| `channel` | enum `production` · `test` | the client reads the channel its build names; verification uses `test` only |
| `version` | text, strict semver `x.y.z` | the version the user must reach |
| `severity` | enum `urgent` · `normal` | |
| `reason` | text, ≤ 280 chars, required | shown on the block screen; plain words, written for the user |
| `min_native_version` | text semver, nullable | set when only a new binary covers the release (native code changed) |
| `published_at` | timestamptz default now() | |
| `created_by` | uuid → the admin's profile | |

- **No client policy on the table.** A public view (`security_invoker = false`) returns the **latest row per
  platform and channel** (`distinct on (platform, channel) … order by published_at desc`) with the same columns
  minus `created_by`. The client reads one row (`eq platform`, `eq channel`, `limit 1`): the fetch budget holds.
- **Publish through an admin RPC** (SECURITY DEFINER, revoked from public/anon/authenticated/service_role, then
  granted back to authenticated with an admin check inside) that inserts the row and writes the project's admin
  audit log in the same transaction. A release is never edited. A mistake is corrected by publishing a newer row.
- **The admin page** (`aoneahsan-cccs-platform-admin`): the last 20 releases, newest first, plus a publish form
  (platform, channel, version, severity, reason, optional min native version). It is drawn in the click dummy
  first. It warns, without blocking, when the version is ABOVE the deployed build's version: a record above every
  build that exists would block everyone, while a record equal to the newly deployed build is the normal, correct
  publish (corrected 2026-10-31, windowsweep; the earlier wording, "not above", warned on every correct publish).

## The client gate

The running version comes from the build (`__APP_VERSION__` via Vite `define`). In a Capacitor app the **OTA bundle
version** counts when one is applied; the binary's `versionName` (`@capacitor/app` `App.getInfo()`) is compared
with `min_native_version`.

**When:** at start (after the first paint, never blocking it), on `visibilitychange → visible` / Capacitor
`appStateChange → isActive` and on `online` (at most once a minute), and the moment a release is published.
Never on a timer: the 15-minute read was retired on 2026-11-03 (`aoneahsan-cccs-realtime-not-polling`).

**The push.** The publish RPC broadcasts in its own transaction, on a PUBLIC topic, because signed-out clients
need it and the record is already public through the view:
`perform realtime.send(jsonb_build_object('version', p_version), 'release', 'releases:' || p_platform || ':' || p_channel, false);`
It is delivered only after commit, so a rolled-back publish sends nothing. The client subscribes to
`releases:<platform>:<channel>` and re-reads the view on every message and every `SUBSCRIBED`: the payload is a
signal, never the data. The channel rides the app's one Realtime socket; where a product would pass its plan's
connection quota (Free: 200), it opens for signed-in sessions only and visitors keep the start, visible and
`online` reads. Firebase: `onSnapshot` on the platform+channel document.

| Record | Running vs record | Stored notice | Result |
|---|---|---|---|
| none / read failed | — | none | nothing (fail open) |
| none / read failed | — | normal release, and this is a **new start** | **block** (the release is known) |
| any | running ≥ version | any | nothing; clear the stored notice |
| urgent | older | — | **block now** |
| normal | older | none, or stored during **this** run | **notice** now; store `{version, reason, storedAt}` |
| normal | older | stored during an **earlier** run | **block** |

🔴 **A record that was read always decides; the stored notice stands in only when there is no record or the read
failed.** Check the record first: a newer row at or below the running build clears a stored notice, even one for a
higher version (that is how a mistaken release is corrected). windowsweep checked the stored notice first in all
three clients, so a stored 1.4.3 notice outranked the 1.4.1 correction row (found on the test channel, 2026-11-05).

- **The block** is a full-screen surface above every route. It shows the reason and one **Update** button. There is
  no close and no back. Escape and the Android back button do nothing. It is announced (`role="alertdialog"`,
  focus on Update). It does not discard in-progress work: server state is already saved, and local drafts are
  persisted before it shows.
- **The notice** goes through the project's existing toast/notice layer and stays until dismissed. It gives the
  version, says the update is required from the next start, and offers **Update now** (the same action as the
  block's button).
- **Update** runs layer 1 for the surface: web → ask the worker to update, take over and reload; Capacitor → apply a
  downloaded OTA bundle, or Play immediate update when `min_native_version` is above the binary, falling back to
  `openAppStore()`; extension → `runtime.requestUpdateCheck()` then `runtime.reload()`, falling back to the store
  listing. While it runs, the button shows progress. When it fails, the screen says so and offers the store link.
- Store the notice through the project's storage layer (strata-storage on web), in the device area. "New start" =
  a new page load or a cold start of the app (a module-level start id compared with the stored one).

## Pure logic is tested (pre-approved class)

`compareSemver` and `decide({ running, record, stored, newStart })` → `none | notice | block`, one case per table
row plus prerelease/garbage input (invalid version → treated as no record, never a block).

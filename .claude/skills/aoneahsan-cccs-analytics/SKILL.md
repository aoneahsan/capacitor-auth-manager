---
name: aoneahsan-cccs-analytics
description: 'Product analytics: one service fronting GA4, Amplitude and Clarity, an event-name registry so names cannot drift, emission at the primitive layer, identity and consent, PII rules, confirming an event landed. Use when adding tracking, naming an event, handling consent, or when events never reach a dashboard.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Analytics

**Three destinations, one service, one vocabulary.** GA4 (Firebase), Amplitude and Microsoft Clarity all
receive the same events; no feature code ever imports a vendor SDK.

## 🔴 All three, every project — not a menu

Owner directive, and R-024 in the master rules. **They are not redundant**, which is why none may be dropped
as "we already have analytics": GA4 answers *how many and from where*, Amplitude answers *what one person did
in what order* and is **the only one that acknowledges ingestion**, Clarity answers *what the screen looked
like when it went wrong*. Two of three leaves a question nobody can answer later.

**GA4 and Firebase Analytics are the same property** — one measurement id, two SDKs. A project already on
Firebase Hosting almost certainly *has* one; ask `firebase apps:sdkconfig WEB` before concluding a property
must be created. Moving a backend off Firebase does not delete the Google project.

**The one carve-out: a browser extension may load neither GA4 nor Clarity.** Both fetch remote code, which is
a store rejection — bundled Sentry is the whole telemetry story there. Every other surface takes all three.

## 🔴 Three silent-death traps — read `references/silent-failures.md` when wiring or debugging a sink

- 🔴 **A hand-rolled gtag shim must push `arguments`, never a spread array** — a real `Array` is ignored and GA4
  sends nothing. `dataLayer.push === Array.prototype.push` → `true` means gtag.js never took over.
- 🔴 **A key blank in the DEPLOYED build lands nothing**, whatever the vault holds.
- 🔴 **Flip a sink's "ready" flag on the init PROMISE, never on the init CALL** — intermittent, so a clean run is
  not evidence; read the init code.

## 🔴 A dispatched event is not a landed event

Analytics is fire-and-forget by design, so **every failure is silent** — a wrong key, a blocked script, a
consent gate, an origin restriction. A green build proves nothing.

**Verify once, live, in each of the three dashboards**, and record the date. A sibling project shipped a
completely dead email path that passed code review and every gate for weeks; the same shape applies here.

| Destination | Where to look |
|---|---|
| GA4 | Realtime → Events (~30s) |
| Amplitude | User Look-Up on the test user, or the live event stream |
| Clarity | the session recording, plus the custom-tag filter |

## The taxonomy

**`object_verb`, snake_case, past tense.** `water_logged`, `medication_taken`, `plan_upgraded` — not
`logWater`, `Water Logged` or `click_button_1`.

```ts
// src/analytics/events.ts — the registry. Adding an event means adding it here.
export const EVENTS = {
  water_logged:      {volume_ml: 'number', source: 'string'},
  medication_taken:  {schedule_id: 'string', on_time: 'boolean'},
  plan_upgraded:     {from_tier: 'string', to_tier: 'string'},
} as const;

export type EventName = keyof typeof EVENTS;
```

A typed registry is what stops `water_logged`, `waterLogged` and `log_water` all existing by month three —
at which point no dashboard is trustworthy and the fix is a migration.

**Bounded property vocabulary:** reuse `source`, `tier`, `method`, `count`. A property invented per event is
a property nobody can segment on.

## Emit at the primitive layer

The reason "track every action" quietly fails is that it is asked of *feature* code, where every author must
remember. Wire it into the design system instead:

```tsx
<Button analyticsId="water_logged" analyticsProps={{source: 'dashboard_quick_action'}}>
```

A feature author gets tracking **by using the component**. Route changes emit `page_viewed` from the router,
once. See `aoneahsan-cccs-design-system`.

## Identity and consent

🔴 **ON BY DEFAULT, TOLD ONCE, NO OPT-OUT — fleet standard** (owner, 2026-10-30: *"it's on by default, and we tell user,
no otp out option, it's for our product to improve"*). The surface is the fleet legal notice
(`~/.claude/rules/legal-notice.md`): a quiet bottom bar with one "Okay", shown once per browser and per account, whose one
added line says the product counts how it is used to improve it (LifeWell's `notice.body` is the reference). No consent
dialog, no Privacy preferences panel, no per-tool switch, no GPC branch. The privacy policy and cookies page name all three
tools and what each receives. 🔴 Health-data protection is not an opt-out: replay (Clarity) is never loaded on a signed-in
or record page, and the body is masked there.

- **On sign-in**: set the user id and traits in all three. **On sign-out**: clear it — otherwise the next
  user on a shared device is attributed to the previous one.
- ~~Consent gates loading; the opt-out is honoured and persisted.~~ Superseded 2026-10-30: no analytics opt-out in the
  fleet (history: `rules-detail/legal-notice.md`). A client project whose own guide requires one keeps it.

## 🔴 PII rules — stricter here than elsewhere

This is a health app. What may **never** enter an analytics payload:

| Never | Why |
|---|---|
| **Health values** — a weight, a blood-pressure reading, a mood score | that is the medical record, in a third-party product analytics tool |
| **Free text** — note bodies, search queries, names | unbounded, and users type anything into a search box. 🔴 It leaks without any event naming it: GA4 stamps the full URL and the tab title on every hit, so a `?q=`, a sign-in `?code=` or "Search results for …" in a title reaches Google. Give GA4 `page_location`/`page_referrer` through `gtag('set')` (a `config` value outranks every later `set`), keep terms out of titles, mask replay (NetCage, 2026-11-08) |
| **Identifiers beyond the user id** — email, phone, exact location | re-identifies the record |

Track that a metric **was logged** and which **kind** — never its value. `water_logged {volume_ml}` is a
judgement call the owner has accepted for a volume; a blood-pressure reading is not, and belongs nowhere near
this pipeline.

The mistakes table (dispatched ≠ landed, vendor SDK in a feature, ad-hoc names, per-feature tracking, identity on sign-out, health values): `references/silent-failures.md`.

## Related skills

`aoneahsan-cccs-design-system` (where events are emitted) · `-react-ui-ux` (the instrumentation row of the
quality bar) · `-error-tracking` (the sibling pipeline) · `-plans-entitlements` (upgrade funnel events) ·
`-coding-standards` (env-key gating so an unconfigured destination is simply off).

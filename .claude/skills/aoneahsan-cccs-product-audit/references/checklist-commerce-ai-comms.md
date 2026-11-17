# Checklist — payments, AI, email (PAY server side and AI: security lane · PAY copy: discoverability lane · COMMS rendering: experience lane)

IDs: **PAY-01…08 · AI-01…07 · COMMS-01…06**.

## PAY — plans, payments, entitlements, commercial truth

Keep **four proof states** apart and never collapse them into "payments work":
1. code implemented;
2. sandbox lifecycle proven;
3. production configuration verified (products, prices, webhook endpoint and secret present by name);
4. a real lifecycle proven by the owner.

Polar web checkout, Play Billing, manual/admin grants and referral grants are separate rails.

| ID | Test | Acceptance |
|---|---|---|
| PAY-01 | The plan set exists: a free tier plus at least one paid plan, limits stored on the plan row, and the server refuses beyond limit (`00-house-rules.md` pricing) | Server refuses; UI and API limits agree. 🔴 "There is no paid tier" appears nowhere |
| PAY-02 | Five admin capabilities: create plan · edit limits · change a user's plan · per-user override · grant provenance, each audited (`aoneahsan-cccs-plans-entitlements`) | All five reachable for an admin, refused for a non-admin |
| PAY-03 | Displayed price, currency, interval and limits on `/pricing` (or `/plans`), plan cards and the store listing vs provider products and checkout quote | Identical for representative cases |
| PAY-04 | Webhook: signature verified with the provider SDK, idempotent (unique provider event id), out-of-order and duplicate events, a missed-event reconcile | Replays cannot double-grant. A browser success URL alone never grants access |
| PAY-05 | Entitlement single writer + audit trail; a grant extends and never overwrites a paid plan; a forced reversal ends the time it paid for (`payment-copy.md`) | Matches |
| PAY-06 | Sandbox lifecycle (where the sandbox is configured): success, failure, abandon, cancel, upgrade/downgrade | Each state proven with a sandbox receipt id (redacted) |
| PAY-07 | 🔴 **Payment copy law**: no refund/"before you pay"/warning text on any pay surface; exactly one consent line under each pay button; NO REFUNDS explained only in Privacy + Terms; cancellation copy neutral (`payment-copy.md`) | The grep and render check is clean. A contract test exists where the project has one |
| PAY-08 | Referral programme: points/badge on a confirmed referral (account exists **and** email verified, via trigger), thresholds are admin fields | Matches `~/.claude/skills/aoneahsan-cccs-plans-entitlements/references/referral-programme.md` |

🔴 Never make a live charge, refund, cancellation or webhook replay on production. The real-payment proof is a
`docs/MANUAL-TASKS.md` row.

## AI — features, cost, data

| ID | Test | Acceptance |
|---|---|---|
| AI-01 | Inventory: features, providers, routes through FilesHub (`/ai/route` or hourly `/ai/lease`), the fallback model from its secret, user levels (Spark/Pulse/Surge) (`fileshub-api.md`, `aoneahsan-cccs-fileshub-ai`) | No direct provider key in a client; no hardcoded model id |
| AI-02 | Server-side caps: per user, plan and request; the call recorded before it is sent; usage reported with `lease_id` + idempotency key; unknown billing reported as estimated | Reconcilable. Duplicates count once |
| AI-03 | Failure paths (mocked or bounded live): timeout, quota exhausted, lease refused, preferred model unavailable, fallback, partial stream, cancel | Recoverable UI. The fallback never exceeds the budget or changes data-sharing terms |
| AI-04 | Prompt injection via user content, retrieved docs or tool results (synthetic) | Untrusted content cannot widen tool authority. Tool arguments are validated server-side |
| AI-05 | Output handling: rendered as untrusted text; no HTML/SQL execution | Inert |
| AI-06 | Data sent to providers: which record fields, consent, retention, logs | Minimal and disclosed in the privacy policy |
| AI-07 | Safety surfaces (health, mental health, legal, money): no diagnosis, no outcome claims, no invented crisis lines (`storytelling-content.md`) | Clean |

## COMMS — email and notifications

| ID | Test | Acceptance |
|---|---|---|
| COMMS-01 | Every email goes through the one branded composer (no ad-hoc HTML in handlers); FilesHub transport (`services-integrations.md`, `aoneahsan-cccs-email-campaigns`) | grep clean |
| COMMS-02 | Template render at 600 px and on a phone, dark mode, plain-text part, working links, display names (never keys), token expiry | Renders with fixture data |
| COMMS-03 | Marketing: consent basis, one-click unsubscribe, suppression checked in the query, postal address, separate sending identity (`app-growth.md`) | All present. 🔴 No send during the audit |
| COMMS-04 | Sending-domain auth: SPF, DKIM, DMARC alignment via `dig TXT` | Present and aligned (DNS changes are owner-only) |
| COMMS-05 | Duplicate-send prevention and retries; opted-out users excluded from queued jobs | Idempotent |
| COMMS-06 | Push: OneSignal receive path, permission behind a user action, subscription state, tap routing (`push-notifications.md`) | Matches the rule. Web push is verified on the deployed origin only |

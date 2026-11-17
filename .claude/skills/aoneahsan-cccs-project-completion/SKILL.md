---
name: aoneahsan-cccs-project-completion
description: 'The standard that decides when a production project is 100% complete: its category (web app, browser extension, mobile app, package, or a new one), scored criteria, held items (extension, iOS, Android for an extension), hard gates (live, Supabase not Firebase, owner-confirmed store release, verified update flow), the live-evidence audit and the scorecard. Use when finalizing a project, asked what is left or how complete it is, or deciding whether extension, Android or iOS work may start.'
metadata:
  source: 'Owner request 2026-10-21 (LifeWell root, finalize-production-projects-1-at-a-time.md); master plan in aoneahsan/projects-finalization-record → plans/2026-10-21-master-finalization-plan.md. First proved on LifeWell.'
---

# Project completion

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

## Overview

A production project is **complete** when the product a user can reach is finished to one written standard,
not when its tracker says so. The standard depends on what the project **is**, so the category comes first.
Every point is earned with live evidence; held items are reserved, not earned; gates override the score.

## 1. Confirm the category — first thing, every finalization session

Ask the owner with `AskUserQuestion`, recommendation first from evidence:

- **Web app** (LifeWell) — the website is the product; Android follows; extension held.
- **Browser extension** (Video Controls Plus) — the extension is the product; a marketing web app beside it.
- **Mobile app** (Waylock) — the Android app is the product (any stack); a separate marketing website sells plans.
- **Package** (native-update, strata-storage, capacitor-auth-manager) — the npm package is the product.
- **Backend platform** (FilesHub) — a service our own apps use, on its own stack; its own table in `references/categories.md`.
- **Other** — the owner explains it; add the category to `references/categories.md` in the same task.

Record the answer in the scorecard row (`confirmed: true`, date). Never re-ask a confirmed category.

## 2. Held items — never start, never suggest, never ask

| Item | Held when | Starts only when |
|---|---|---|
| Browser extension | the category is not "browser extension" | the owner asks in a **new** session in that project |
| Android app | the category is "browser extension" | the owner asks in a **new** session in that project |
| iOS app | always, at **0 points** | the owner says an Apple Developer account exists (then 10–15 points, rebalanced) |

🔴 Do not mention a held item as a next step, a suggestion or a question. It is reserved, and the reserved
points count toward the 100.
🔴 An extension is never a subfolder of the app repo: it lives in a sibling `<project>-extension/` folder at the
container root and is backed up to an **`extension` branch** of the product's private repo.

## 3. Hard gates — any one failing means NOT complete, whatever the score

1. **Live and reachable by end users** on the production URL (and the store, where the category needs one).
2. **No Firebase backend.** Supabase with Drizzle migrations and `docs/database/SCHEMA.md`
   (`aoneahsan-cccs-supabase-schema-design`). A Firestore project is migrated first: fresh schema, then import.
3. **The owner confirmed the store release** ("it is live on Play"), proven on his developer page
   (`aoneahsan-cccs-store-presence`). 🔴 A **Play-excluded** project (ledger `projects-finalization-record/production/PLAY-EXCLUDED.md`,
   owner 2026-11-02) is never released on Play: gate 3 reads "the owner confirmed the signed sideload APK release is
   live" instead, and no Play work is ever suggested (`rules-detail/project-completion.md`).
4. **The update flow is verified** (owner, 2026-10-30, every category, no exception): layer 1 self-update and
   layer 2 release-record gate (urgent blocks now, normal from the next start), plus in-app update and review in
   a Capacitor app, proven per `aoneahsan-cccs-update-flow/references/verification.md`. It is a gate, not points:
   the owner's weights stay as they are.
5. **The Comparison Hub stands** (owner, 2026-11-07, every category except FilesHub): vision on record, brand kit in both places, hub live on the marketing and docs sites and both sitemaps, last checked within 30 days (`aoneahsan-cccs-comparison-hub`). FilesHub owes the vision record only. A gate, not points.

🔴 **No exceptions unless the owner typed one** (`00-house-rules.md`, 2026-10-30): a criterion or a standard that does
not hold scores zero and is a gap to close — never "accepted", never NA by choice. Only a row in the project's
`## Owner-typed exceptions` block (his ALL-CAPS words naming the thing and the exception) excuses anything.

🔴 **FilesHub readiness:** read `GET /api/public/v1/projects/{slug}/readiness`, close every agent-closable `missing` row (owner, 2026-11-09): `~/.claude/rules-detail/project-completion.md`.

## 4. Score with live evidence

Weights per category, and the shared standards every criterion is checked against:
`references/categories.md` · `references/standards-checklist.md`. How each row is proven:
`references/audit-procedure.md`. 🔴 A tracker, a green build or a DOM tree is never evidence.

## 5. Record it

The scorecard lives in `aoneahsan/projects-finalization-record` (local clone
`~/Documents/01-code/projects-finalization-record/`): one row in `production/SCORECARD.md` + `scorecard.json`
and one audit file `production/<project>.md`. Format: `references/scorecard-format.md`. The read-only
`aoneahsan-ccca-completion-auditor` agent may fill the audit file; closing gaps is main-session work.

## 6. Order of work after the audit

Anything broken for users → the update flow (gate 4, `aoneahsan-cccs-update-flow`) → the Firebase → Supabase move (gate 2) → the project's own open plan (resume its
tracker, never re-plan) → each gap in point order → both tour systems (`aoneahsan-cccs-guided-tours`) → the category's store listing set
(`aoneahsan-cccs-store-listing-assets`, every run) → deploy
(`deploy-verification.md`) → hand the owner his store/console chain → mark complete only after gate 3.
Every UI change is click-dummy first. Long actions follow `references/async-jobs.md`.

## 6a. One project, one session — `/finalize-project`

The owner runs `/finalize-project` in each production root, often in parallel sessions. Follow
`references/finalization-playbook.md`: where the state lives, the scoring arithmetic (held points count), the quick
wins every project had, the gate and deploy traps, the tour build order and branches, and the one batched round of
owner questions. Add each new lesson to that file in the session that learned it.

## 7. Sequence across the fleet

Production projects are finished **before** any idea project or new project starts
(`~/.claude/rules/idea-projects-frozen.md`). LifeWell proves the standard first; the owner then runs 2–3
production projects in parallel sessions. Lessons go back into this skill in the session that learned them.

**Related:** `aoneahsan-cccs-guided-tours` · `-extension-website-connect` · `-supabase-schema-design` ·
`-mobile-app-feel` · `-plans-entitlements` · `-fileshub-ai` · `-email-campaigns` · `-native-update` ·
`-strata-storage` · `-store-presence` · `-store-listing-assets` · `-click-dummy` · `-story-craft` · `-verification`

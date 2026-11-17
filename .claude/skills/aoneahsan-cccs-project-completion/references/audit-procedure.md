# Audit procedure — how each criterion is proven

**Last Updated:** 2026-10-21. 🔴 Every row is proven by something that would fail if the criterion were not
met. A tracker, a plan, a green build, a DOM tree or a previous session's claim is a pointer to where to look,
never the proof.

## Before scoring

1. Read the project's native guide, its status/remaining-work record, and only the active tracker slices
   (`aoneahsan-cccs-project-understanding`).
2. Confirm the category (`SKILL.md` §1). Load the matching column in `categories.md`.
3. Sweep each nested repository from inside itself (a recursive grep from a container root skips them).

## Evidence per criterion

| Criterion | Proof |
|---|---|
| Primary product live | Live URL opened in the automation browser at 1440 and 390: visible content in the screenshot, zero uncaught console errors, key routes load (`browser-automation.md`). Phone app view checked on home, dashboard, settings, sign-in, onboarding |
| Dummy parity | The project's copy/parity gate (LifeWell: `yarn verify:copy --required`) at 0 absent |
| Android on Play | The owner's developer page lists the app (`aoneahsan-cccs-store-presence`) |
| Extension stores | Each store listing URL answers and shows the current version |
| Store listing set | `app-publish-assets/` holds every image of the category's set as SVG master + PNG; each of the eight shots explains one real feature and matches the app's current strings, and the owner approved shot 1 (2026-11-09); the listing copy, declarations, Data Safety and release notes agree with the live app and legal pages; the pack README's export reproduces every PNG pixel-identical (`aoneahsan-cccs-store-listing-assets`) |
| Update flow (gate 4) | Layer 2 on the `test` channel: normal row → notice, reload → block; urgent row → block at once; equal row → clear; production channel has no row above the live version. Layer 1: an old tab takes a web deploy; an OTA development-channel build verifies against the shipped key; the owner's device row exists in `docs/MANUAL-TASKS.md` (`aoneahsan-cccs-update-flow/references/verification.md`) |
| Connect sign-in | A real link: start in the extension, approve on the website as a non-admin test account, the extension receives a session |
| Docs site | Live docs URL renders; its last deploy is newer than the last user-visible product change |
| Payments | Polar sandbox checkout end to end, the plan row changes, a limit is refused by the server; the consent line renders under each pay button |
| AI + Speak | One live AI call through the FilesHub route; usage reported (`POST …/ai/usage` count moves); Speak captures and saves |
| Email | A `[TEST]` transactional email from the branded composer arrives; the marketing sequence status read from FilesHub |
| File storage | An upload lands in FilesHub and reads back |
| Our three packages | `package.json` holds all three at current versions; `grep` for duplicates (`@codetrix-studio`, `@capacitor-firebase/authentication`, `@capacitor/preferences` used directly, other OTA/review plugins) returns nothing; raw storage APIs return nothing outside the storage wrapper; the in-app review and app-update calls exist in source |
| Supabase | No `firebase` / `firestore` import in source; `drizzle.config.*` exists; `docs/database/SCHEMA.md` has a current Mermaid `erDiagram`; the project's RLS/policy gate passes |
| Sitemap + feed | The four URLs answer 200 on the live host with truthful `lastmod` |
| PWA no caching + offline overlay | On the LIVE URL of every own React web app: `Page.getInstallabilityErrors` is `[]`; `/sw.js` has no `fetch` listener and this build's stamp; `caches.keys()` holds only `strata-storage-*`; offline emulation shows the blocking overlay at 1440 and 390 (app root `inert`); reconnect lifts it without a navigation entry; zero console errors (`aoneahsan-cccs-pwa-no-cache/references/verification.md`) |
| Guided tours | On the live site, as a non-admin: the hint shows once per page, a tour can be skipped, closed and jumped; the walkthrough page `?step=` deep link works. 🔴 **Repeated in the PHONE APP VIEW** (touch emulation on, `mobile` metric, 390 — never a narrow desktop window): the tour button is visible and starts the phone steps on the home page and every registered page, and a signed-out phone can reach the walkthrough. A desktop-only pass scores 0 (LifeWell, 2026-10-23) |

## Lessons from LifeWell (2026-10-22)

- **Run the project's database gate in every audit, and read a red one before trusting or skipping it.** LifeWell's
  `yarn db:policies` was red for three weeks. Behind it sat one real user-facing defect: every admin plan save had
  been refused since a new limit key reached the plan rows but not the key list the save functions check (ISSUE-015).
  The rest were stale instruments: a fixture assertion and three probes that read dated test-account state. Fix the
  instrument, prove the product by replaying the step alone in a rolled-back transaction, and record both.
- **A migration generated from a stale snapshot carries someone else's statements.** Read every generated line;
  remove what is already live, and say so in the migration's header.
- **Positioning lives in more places than the home page:** structured-data authors, `llms.txt`, `ai.txt`,
  `humans.txt`, `pricing.txt`, the manifest, the social image, boot messages, share texts, calculator bylines, blog
  bodies about the product itself, store captions. Grep the old premise across the app, the dummy and `public/`.

## Writing the result

Score each row 0 or full. A partial row is 0, with what is missing written beside it. List gaps in point order.
Write `production/<project>.md` and update the scorecard row (`scorecard-format.md`). State plainly what could
not be verified and why.

# Categories and scoring

**Last Updated:** 2026-11-17 (PWA no caching + offline overlay row = 5 in every column with a React web app; weights re-set by the agent per the owner's standing "adjust, never ask" answer) · 2026-11-13 (white-label + buyout row, 5 points from each primary-product row, owner) · 2026-11-04 (private notebook category confirmed for ahsan-notebook) · 2026-10-31 (package support-only payment criterion clarified) · 2026-10-26 (WordPress plugin + SaaS added, Empora; SaaS + package added, Native Update OD-001/002) · 2026-10-22 (Backend platform added) · Weights are the 2026-10-21 proposal; the owner may re-weight. When he does,
change this table only, and re-score every open scorecard row in the same task.

Each column totals 100. **Held** points are reserved: they count toward the 100 without work.
**Complete** = every non-held row at full points + every gate in `SKILL.md` §3 + the owner's confirmation.

| Criterion | Web app | Browser extension | Mobile app | Package |
|---|---|---|---|---|
| **Primary product live and working**: web app with approved-dummy parity and phone app view / extension live on Chrome, Firefox and Edge / Android app live on Play with payments / package published on npm | 10 | 15 | 21 | 25 |
| Android app live on Play | 15 | **10 held** | (in row 1) | — |
| iOS app | 0 (see note) | 0 | 0 | — |
| Browser extension | **10 held** | (in row 1) | 0 unless the owner names one | — |
| Extension ⇄ website connect sign-in (`aoneahsan-cccs-extension-website-connect`) | — | 5 | — | — |
| Marketing website / web app (click dummy, Story Bible, applicable checkout) | (in row 1) | 12 | 15 | 17 |
| Docs site, current and optimized | 5 | 4 | 5 | 13 |
| Payments: Polar checkout + plan set + limits + admin / package: support payments, one-time and recurring, choose-your-price | 10 | 10 | 10 | 10 |
| AI through FilesHub AI accounts, including the Speak feature | 10 | 6 | 6 | — |
| Email: FilesHub branded transactional templates + a marketing campaign / package: a release newsletter | 5 | 5 | 5 | 10 |
| File storage through FilesHub | 3 | 3 | 3 | — |
| Our three packages, with no duplicate package (native-update, strata-storage, capacitor-auth-manager) | 7 | 4 | 8 | — |
| Supabase + Drizzle + `docs/database/SCHEMA.md` (also gate 2) | 5 | 5 | 5 | — |
| Sitemap, feed and SEO | 3 | 3 | 4 | 5 |
| Installable PWA, no caching, offline overlay (`@capacitor/network`) on every React web app (`aoneahsan-cccs-pwa-no-cache`) | 5 | 5 | 5 | 5 |
| Guided tours: page tours + the walkthrough page (`aoneahsan-cccs-guided-tours`) | 7 | 8 | 8 | 5 (marketing website) |
| Public GitHub governance (open-source packages only; otherwise its points move to row 1) | — | — | — | 5 |
| White-label licence + source buyout through FilesHub (`aoneahsan-cccs-white-label`) | 5 | 5 | 5 | 5 |
| **Total** | **100** | **100** | **100** | **100** |

## Private notebook (owner, 2026-11-04 — ahsan-notebook first)

The owner confirmed **Other: private notebook**, with browser and Android access. It is a private knowledge base, not a product docs site. The criterion is earned only when its complete behavior is verified, and private content never becomes a public search surface. Firebase Hosting may serve the public sign-in shell; Supabase holds the authorization boundary and metadata, and FilesHub holds private files. Gate 2 means no Firebase backend for private data. Gate 3 is the owner's confirmation of the Android release.

| Criterion | Points |
|---|---:|
| Private access: server-owned membership, authorized content and asset delivery, revocation, no public private bytes or route inventory | 30 |
| Web reading and search: current content reachable by an authorized browser session | 15 |
| Android release and native sign-in: current version reachable and usable on a real device | 15 |
| Content integrity: routes, relative links, MDX and assets preserved; private discovery policy verified | 15 |
| Recovery: backup, export and a measured restore of representative content | 10 |
| Accessibility and performance: key web and phone journeys meet the fleet standards | 10 |
| Operations: current guidance, audit record, manual chain and production monitoring | 5 |
| **Total** | **100** |

Hard gates: live authorized access on both surfaces; no unauthenticated exposure of private content or route inventory; owner-confirmed Android release; both layers of the update flow verified. The Play listing set is checked with the Android row. Payments, AI campaigns and a separate public docs site are absent capabilities for this category, not completion rows. Search auditing checks the private boundary and the public sign-in/legal surface without advertising notebook content.

## Backend platform (owner, 2026-10-22 — FilesHub first)

A service whose main users are our own apps, kept on its own stack (FilesHub: Laravel + Nova + MySQL). Its own
table, because most rows above do not apply. Gate 2 reads **no Firebase backend** (Supabase is not required for a
platform with its own database); gate 3 does not apply (no store). A browser extension in the repo is not scored
unless the owner names it.

| Criterion | Backend platform |
|---|---|
| **Platform live and working**: every documented endpoint answers, dashboard + admin panel work, the deploy-version marker matches, no open high/critical reported issue | 25 |
| Docs site + API reference (OpenAPI, machine-readable, every route documented) | 15 |
| Public website (dummy parity, story voice, plan purchase) | 10 |
| Payments: Polar checkout + plan set + limits + the five plan-administration capabilities | 10 |
| Public API standard: hashed keys, scopes, rate limits, one response envelope, versioning (`aoneahsan-cccs-public-api-design`) | 10 |
| Security + data safety: backups with a proven restore, additive migrations, audit log, OWASP top 10 | 10 |
| Email: branded transactional templates + a marketing campaign | 5 |
| AI routing served to consumers (credit, leases, usage) + one AI feature of its own | 5 |
| Ops: server-side schedules with status in the dashboard, error tracking, uptime | 5 |
| Sitemap, feed and SEO | 3 |
| Guided tours on the dashboard | 2 |
| **Total** | **100** |

## SaaS + package (owner, 2026-10-26 — Native Update first)

A hosted SaaS (dashboard where people buy plans, backend API) whose product is also a published npm package
the customers install. The web-app rows plus the package's own. The backend may stay on its own non-Firebase
stack (Native Update: Laravel + MySQL); gate 2 reads **no Firebase backend**, and the backend row is earned
by a current `docs/database/SCHEMA.md` with an ERD. Gate 3 applies to the Android app.

| Criterion | SaaS + package |
|---|---|
| Web app live: approved-dummy parity, phone app view | 7 |
| npm package published and working | 15 |
| Android app live on Play | 10 |
| Browser extension | **10 held** |
| iOS app | 0 |
| Docs site, current and optimized | 7 |
| Payments: Polar plans + limits + admin, **and** a choose-your-price support page (one-time + monthly) | 10 |
| AI through FilesHub AI accounts, including Speak | 5 |
| Email: branded transactional templates + a release newsletter / campaign | 5 |
| File storage through FilesHub | 2 |
| Our three packages, no duplicate | 5 |
| Backend + `docs/database/SCHEMA.md` (Supabase + Drizzle when on Supabase) | 5 |
| Sitemap, feed and SEO | 3 |
| Installable PWA, no caching, offline overlay (`@capacitor/network`) | 5 |
| Guided tours: page tours + the walkthrough page | 6 |
| White-label licence + source buyout through FilesHub ($50,000 buyout, combined category) | 5 |
| **Total** | **100** |

## WordPress plugin + SaaS (owner, 2026-10-26 — Empora first)

A WordPress/WooCommerce plugin sold through the product's own SaaS dashboard (licences, plan purchase), with an
Android companion app and a backend on its own non-Firebase stack (Empora: Laravel 12 + Nova + MySQL). The free
edition ships on WordPress.org and the premium edition on CodeCanyon. Gate 2 reads **no Firebase backend**
(Firebase Hosting is a host, not a backend; Firebase Auth is a backend and moves to capacitor-auth-manager with
the API verifying the Google token). The backend row is earned by a current `docs/database/SCHEMA.md` with an ERD.
Gate 3 = the owner confirms the WordPress.org, CodeCanyon and Play releases.

| Criterion | WP plugin + SaaS |
|---|---|
| Plugin live on WordPress.org (free) + CodeCanyon (premium), activating and updating with its licence | 15 |
| Dashboard web app live: approved-dummy parity, phone app view | 10 |
| Android app live on Play | 10 |
| Browser extension | **10 held** |
| iOS app | 0 |
| Docs site, current and optimized | 6 |
| Payments: Polar plans + limits + the five plan-administration capabilities, consent line | 10 |
| AI through FilesHub AI accounts, including Speak (dashboard) | 5 |
| Email: branded transactional templates + a marketing campaign | 5 |
| File storage through FilesHub | 2 |
| Our three packages, no duplicate | 5 |
| Backend + `docs/database/SCHEMA.md` | 3 |
| Sitemap, feed and SEO | 3 |
| Installable PWA, no caching, offline overlay (`@capacitor/network`) | 5 |
| Guided tours: page tours + the walkthrough page | 6 |
| White-label licence + source buyout through FilesHub ($50,000 buyout, combined category) | 5 |
| **Total** | **100** |

## Desktop app + CLI (owner, 2026-10-30 — macleanup first)

The owner chose the category "Other: desktop app + CLI" for macleanup on 2026-10-30: a public npm CLI is the
engine, a desktop app (Tauri) runs it in a window and sells the plans, a marketing website and a docs site sit
beside them. Browser extension and Android do not apply to a macOS tool (0, not held); iOS 0.

| Criterion | Desktop app + CLI |
|---|---|
| Desktop app live: signed-updater installer on the public release channel, approved-dummy parity, launches and completes preview → run → receipt on a real Mac | 20 |
| CLI published on npm and working (`npx`), README, machine-readable output | 15 |
| Marketing website (dummy parity, story voice, download, pricing, legal) | 7 |
| Docs site, current and optimized | 6 |
| Payments: Polar checkout + plan set + limits + the five plan-administration capabilities, consent line | 10 |
| Supabase + Drizzle + `docs/database/SCHEMA.md` (also gate 2) | 5 |
| Email: FilesHub branded transactional templates + a release newsletter | 5 |
| Our packages that apply (strata-storage; native-update and capacitor-auth-manager are Capacitor-only → NA) | 3 |
| Sitemap, feed and SEO across website + docs | 4 |
| Guided tours: page tours + the walkthrough page | 8 |
| Installable PWA, no caching, offline overlay (`@capacitor/network`) on the marketing website | 5 |
| Public GitHub governance for the open-source CLI | 5 |
| Release channel: updater key backed up and restore-proven, release notes, stable download link | 2 |
| White-label licence + source buyout through FilesHub ($50,000 buyout, combined category) | 5 |
| **Total** | **100** |

AI through FilesHub is **NA** for this category's first project: the product promise is that file paths never
leave the Mac, so an AI feature over a cleanup would contradict it. Revisit only on an owner request. File storage
through FilesHub is NA (nothing user-owned is stored server-side).

## Notes per category

- **iOS:** 0 points until the owner says an Apple Developer account exists. Then it takes 10–15 points, taken
  evenly from the primary product and Android rows, and this table is updated that day.
- **Web app:** the browser extension is held. The project's nature is the web app; when everything else is
  done, the project is complete with the extension still held.
- **Browser extension:** Android is held. The marketing web app is a separate React + Supabase project with
  Google sign-in only; the extension signs in through it. Our three packages are scored on the web app.
- **Mobile app:** the app may be any stack (Flutter, native Kotlin). The marketing website is a separate React +
  Supabase project with Polar plan purchase. On Android, Play Billing is allowed beside Polar on the web.
  No browser extension unless the owner names one for that project.
  **Our three packages on a native app with no Capacitor host** (owner, 2026-11-06, NetCage first: "Website adopts
  them"): the marketing website adopts strata-storage for every storage write and capacitor-auth-manager for Google
  sign-in; the app keeps the native counterparts (Play in-app update and review, Credential Manager) plus the layer-2
  release gate. The row is scored on that split.
  🔴 **Play-excluded** members (`production/PLAY-EXCLUDED.md`: SMS App, CallVault; owner 2026-11-02): row 1's
  "Android app live on Play" is earned by a stable signed sideload APK release with physical-device proof and OTA;
  Play is never pursued beyond the untouched internal testing track. Weights unchanged.
- **Package:** AI, the three packages and tours do not apply to the package itself. A package with no on-site
  paid feature has **no plans or plan purchase**. Its marketing website carries voluntary support payments
  (one-time + monthly, a chosen amount) and the newsletter signup for major releases. Support never changes
  package access. If an on-site paid feature is introduced later, the plan-set rule applies to that feature.
- **White-label row** (owner, 2026-11-13): earned when the FilesHub offer is set for the groups the product ships, the pages are live on the marketing site and the docs section, both sitemaps list them, Terms + Privacy carry the clauses, and checkout is FilesHub's Wise/bank-transfer pay page, never Polar (owner, 2026-11-14), or the request form with its MANUAL-TASKS row while no payment method is enabled in Nova (corrected 2026-11-16). Backend platform (FilesHub) and private notebook carry no such row.
- **PWA row** (owner, 2026-11-17): earned when every own React web app of the root (product and marketing site) passes the live checks of `aoneahsan-cccs-pwa-no-cache/references/verification.md` — installable, cache-free worker behind the build gate, `@capacitor/network` overlay blocking while offline, reconnect without reload — with its `pwa-status.json` row. A column whose project ships no React web app moves these 5 points to row 1.
- **A new category** gets its own column here, worded by the owner, before its first project is scored.

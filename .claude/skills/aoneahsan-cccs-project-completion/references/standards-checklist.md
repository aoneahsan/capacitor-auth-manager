# Standards checklist — what each criterion means

**Last Updated:** 2026-10-30. Each line names the owning skill; the skill carries the depth, this file only the
bar a project must meet.

## Product surface

- **Click dummy first, approved by the owner** (`aoneahsan-cccs-click-dummy`), with the Story Bible behind every
  word (`aoneahsan-cccs-story-craft`). Tailwind v4 + React Aria, no component library, a palette unique to the
  project (`aoneahsan-cccs-frontend-design`).
- **Responsive 320 → 1920**, and on phones (browser or Capacitor shell) the important pages are real app
  screens, not a shrunk website: home, dashboard, account settings, sign-in and onboarding at minimum
  (`aoneahsan-cccs-mobile-app-feel`).
- **Installable PWA, no caching, offline overlay** (5 points, `aoneahsan-cccs-pwa-no-cache`, owner 2026-11-17): every
  own React web app (product and marketing site) installs on phone and desktop; its worker has no fetch handler, no
  precache and deletes only legacy caches; the `vite/pwa-no-cache.ts` gate fails the build on cache code;
  `@capacitor/network` drives one full-screen blocking overlay that lifts after a real `no-store` request, then
  refetches without a reload. No exception unless typed IN ALL CAPS in `## Owner-typed exceptions`.
- **Guided tours**: a page tour on every important page and the product walkthrough page
  (`aoneahsan-cccs-guided-tours`).

## Our three packages — mandatory, and nothing else doing their job

- **native-update** — OTA bundles, the app-update prompt and the in-app review prompt
  (`aoneahsan-cccs-native-update`). No other OTA, update or review plugin.
- **strata-storage** — every local storage, preference, cookie and URL-state write
  (`aoneahsan-cccs-strata-storage`). Zero raw `localStorage` / `sessionStorage` / `indexedDB` in source.
- **capacitor-auth-manager** — Google sign-in on the web and in the Android app. No
  `@codetrix-studio/capacitor-google-auth`, no `@capacitor-firebase/authentication`, no second auth package.

## Services

- **Payments:** Polar checkout on the product's own site (`zero-cost.md`). Products with on-site paid features
  owe the plan set, generous Free tier, server-enforced row limits, five plan-administration capabilities and
  referral programme (`aoneahsan-cccs-plans-entitlements`). A package with no on-site feature instead owes
  voluntary one-time and monthly support, with no plans or entitlements. Both paths owe NO REFUNDS copy only
  in legal pages and the one consent line under each pay button (`payment-copy.md`).
- **AI:** through FilesHub AI accounts, with the Spark/Pulse/Surge levels and usage reporting
  (`aoneahsan-cccs-fileshub-ai`); the **Speak** feature (voice capture into the product's own records) built as
  well as the product allows.
- **Email:** every transactional email from the project's one branded composer through FilesHub; a marketing
  campaign through FilesHub email marketing (`aoneahsan-cccs-email-campaigns`, `app-growth.md`).
- **File storage:** FilesHub (`aoneahsan-cccs-fileshub`). Never Firebase Storage.
- **Backend:** Supabase, Drizzle, RLS proven, `docs/database/SCHEMA.md` current
  (`aoneahsan-cccs-supabase-schema-design`). Filtering, sorting and aggregation run in the database, then the
  backend; the client receives what the person sees (`data-fetch-budget.md`). Long actions are async jobs
  (`async-jobs.md`).
- **Nova admin panel** (Laravel projects): the project's own main dashboard and palette, never the stock
  "Get Started" page, with its card test green (`aoneahsan-cccs-nova-dashboard`; owner, 2026-10-27). Sign-in is
  Google then an authenticator code, with the opt-in 7-day trusted browser (`aoneahsan-cccs-laravel-nova`; owner,
  2026-11-12).
- **Push:** OneSignal receive path where the product has notifications (`push-notifications.md`).

## Discovery and docs

- `/sitemap`, `/sitemap.xml`, `/feed`, `/feed.xml` truthful and current (`aoneahsan-cccs-sitemap`,
  `aoneahsan-cccs-feed`); SEO and AEO pass (`aoneahsan-cccs-react-seo`).
- A docs site on GitHub Pages at the derived domain, current with the shipped product (`docs-sites.md`).

## Release

- 🔴 App-view reach (owner, 2026-10-30, every web or mobile product): every place the web links to is two taps
  or fewer from any tab in the phone app view and the store app, through the web's own drawer or account list
  (`aoneahsan-cccs-mobile-app-feel`).
- 🔴 Update flow (owner, 2026-10-30, every product, no exception; hard gate 4): layer 1 self-update (SW takeover,
  native-update OTA, Play immediate in-app update, extension/Tauri auto-update), layer 2 release-record gate
  (urgent blocks now with the reason, normal announced at once and blocking from the next start), in-app review
  in every Capacitor app (`aoneahsan-cccs-update-flow`).
- Web: deployed per `deploy-verification.md` (seen rendering before and after, live bundle hash = local).
- Android: signed AAB and Play listing are the owner's; the agent hands over the stamped build and the list.
- 🔴 Android release health (owner, 2026-10-30, every finalization and completion run of a project that ships an Android app): every probe
  of `aoneahsan-cccs-android-release-health` prints nothing. A confirmed hit is fixed in place or by regenerating
  `android/`, proven on the Android Studio wizard path and on the command line, and recorded in its fleet-status
  row.
- 🔴 Store listing set (owner, 2026-10-27, every finalization and redevelopment): icon, feature graphic and eight
  framed real screenshots for Play, or the extension-store set for an extension, built from the project's own UI
  (`aoneahsan-cccs-store-listing-assets`). A package records NA.
- 🔴 Since 2026-11-09 (owner): every shot explains one real feature, custom-designed, never AI-looking; shot 1 is
  approved by him before 2–8; for Play the WHOLE package (copy, declarations, Data Safety, release notes, graphics)
  is made if missing, redone if stale and improved if weak, on every finalize and complete run and whenever he asks
  for "play store listing content".
- Browser extension: live on Chrome Web Store, Firefox Add-ons and Edge Add-ons.
- Package: published on npm behind the publishing gate (`publishing-compliance.md`).

# Checklist — security, access and data (lane: `aoneahsan-ccca-audit-security`)

IDs: **ARCH-01…04 · AUTH-01…06 · ACCESS-01…06 · APPSEC-01…09 · DATA-01…06**. Each check states the test, the
evidence and the acceptance condition. Every probe runs against the project's **own** origins, with seeded
synthetic accounts (`automation-test-accounts.md`, `t1+n` aliases, never admin) and bounded requests. 🔴 Never
brute-force, never touch real customer ids, never copy or validate a found secret. Record its location and type
only, as a P0.

## ARCH — identity, architecture, capability inventory (always applicable)

| ID | Test | Acceptance |
|---|---|---|
| ARCH-01 | Inventory the repos (sweep each **from inside itself**), the frontend/backend/mobile roots, Supabase project ref, edge functions, storage, auth, payment/email/AI providers, hosts, and env var **names** | Every production system has an owner and a test surface; missing access is listed |
| ARCH-02 | Map public site → app → docs → support → pricing → checkout → store links | Every link resolves to the intended product. No dead or cross-product link |
| ARCH-03 | Compare the live build id or bundle hash with the repo HEAD and the latest deploy record | Live equals the last deployed commit, or the drift is a finding |
| ARCH-04 | Marketing claims vs implemented capability (feature list, store copy, docs, `llms.txt`, JSON-LD) | Each claim maps to a reachable, enabled capability. A sandbox, a flag, a stub or an unsigned build is not "available" |

## AUTH — authentication and account lifecycle

| ID | Test | Acceptance |
|---|---|---|
| AUTH-01 | Sign-up, existing-account sign-up, login, logout, password reset/magic link, Google sign-in (web popup; native via the house auth package) | Each flow completes and is recoverable after a cancel, Back or a second tab |
| AUTH-02 | Callback/redirect handling: `redirect_to`/`next` params, OAuth state, allowlist of exact origins | No open redirect; tampered state is refused |
| AUTH-03 | Expired, reused or wrong verification/reset links | Refused with a recoverable path; one-time links cannot be reused |
| AUTH-04 | Session expiry, refresh failure, cross-tab logout, switching users | Revoked sessions cannot reach protected APIs or stale private views (cache cleared on logout) |
| AUTH-05 | Account enumeration and abuse limits on login, reset and sign-up | Error copy does not reveal account existence beyond the provider's design; limits exist and do not lock out legitimate users |
| AUTH-06 | Sensitive changes (email, deletion, plan) need a recent session or a re-auth where the design says so | Matches the stated design |

## ACCESS — authorization, tenancy, sharing

Build the matrix of **anonymous · owner · member/invited · read-only · admin · suspended · deleted · revoked**
× each sensitive resource × **list / detail / create / update / delete / export / search / attachment / share
link / background job**, using two seeded accounts and at least one forbidden row.

| ID | Test | Acceptance |
|---|---|---|
| ACCESS-01 | Swap object ids, nested parent ids, omit or forge tenant/owner ids in REST/RPC calls (PostgREST filters, edge function bodies) | Server/RLS refuses. 🔴 A `(200, [])` probe is vacuous unless a forbidden row exists |
| ACCESS-02 | Catalog truth: `pg_policies`, `relrowsecurity`, `information_schema.role_table_grants` / `column_privileges`, function `EXECUTE` grants **including `anon` granted by name via `pg_default_acl`** | Every table with user data has RLS + policies proven from their own filters. `SECURITY DEFINER` functions are revoked from `public, anon, authenticated, service_role` and granted back only to the intended roles |
| ACCESS-03 | `TRUNCATE`, upsert column grants, views (`security_invoker`), storage bucket policies, signed URL expiry | No bypass path. Signed URLs expire and match row access |
| ACCESS-04 | Admin APIs and admin routes called directly as a non-admin; client role flags modified | Refused server-side, not just hidden in the UI |
| ACCESS-05 | Share links and invites: scope, expiry, revocation, a copied link after revoke, preview unfurls, direct attachment URLs | Revocation propagates; anonymous access exposes only the approved fields |
| ACCESS-06 | `service_role` / server keys: grep bundles, `dist/`, env files of public repos, mobile assets | Never present in a client artifact (P0 if found) |

## APPSEC — inputs, outputs, files, browser boundary, supply chain

| ID | Test | Acceptance |
|---|---|---|
| APPSEC-01 | Malformed, oversized, Unicode and type-confused inputs; mass assignment; sort/filter injection; unbounded pagination | Server schemas (Zod/DB constraints) reject. Every list has a limit (`data-fetch-budget.md`) |
| APPSEC-02 | Script-like fixture strings in every user-content path (rich text, names, emails, PDFs, admin views, AI output) | Rendered inert. Tiptap/HTML is sanitised |
| APPSEC-03 | URL fetchers/importers/webhooks (mocked targets only) | Private/metadata destinations and redirects are refused |
| APPSEC-04 | Uploads: type/size/dimension limits enforced server-side, names, EXIF, FilesHub visibility (public vs private), content-disposition | Limits match the upload info shown to the user; private files are not public URLs |
| APPSEC-05 | Headers per environment: CSP, frame-ancestors, HSTS, referrer-policy, CORS on edge functions, mixed content | Tuned per route; no `*` CORS with credentials; OAuth and media still work |
| APPSEC-06 | Expensive actions (AI, exports, invites, sign-ups, emails) | Server-enforced rate/plan limits; bounded jobs |
| APPSEC-07 | Dependencies: `yarn npm audit --all --recursive` (Yarn Berry) or `yarn audit`, EOL runtimes, licences, banned packages | No reachable high/critical advisory without a recorded decision. Banned list (`00-house-rules.md`) is clean |
| APPSEC-08 | Secrets in source, bundles, git history of PUBLIC repos, `.env` tracked in a public repo, source maps shipped | None. `.map` absent in production (`build-test-quality.md`). Public-repo `.env` is P0 (rotation is the owner's step) |
| APPSEC-09 | Logging: `console.*` outside the logger, PII in logs, Sentry `dataCollection` categories off (`package-version-known-issues.md`) | Zero matches outside `logger.ts`; Sentry scrubs PII |

## DATA — privacy, consent, data lifecycle

| ID | Test | Acceptance |
|---|---|---|
| DATA-01 | Data inventory: each data class, purpose, storage (Supabase/FilesHub/device), processors (AI, email, analytics, Sentry), retention | One truthful table in the run's `MANIFEST.md`. Sensitive classes named (health, children, other people, location, voice) |
| DATA-02 | Privacy policy and Terms vs actual behaviour (fields, network destinations, AI providers, analytics defaults) | They agree. When one changes, fix the other in the same task (`legal-notice.md`) |
| DATA-03 | Leakage: private ids/content in URLs, referrers, analytics events, error payloads, link previews, search indexing; 🔴 **seeded test fixtures that are published, listed or counted on a dev-IS-prod database** (LabFlow 2026-10-29: two fixture "laboratories" in the public directory and in peer benchmarks) | None. Private routes are `noindex` **and** auth-gated; fixtures hidden by flag from every non-automation reader |
| DATA-04 | Export: every promised data type, attachments, relationships, format readable | "Full export" only when everything promised is included |
| DATA-05 | Account and data deletion (seeded account only): dependent rows, storage objects, shares, derived/search data, sessions; the web deletion route required by Play | Verified removal or documented retention exceptions. Both the in-app and the web path exist where a store requires them |
| DATA-06 | Backups/restore: scope, retention, whether deleted users can be resurrected | Documented. A restore rehearsal is owner-approved only |
| DATA-07 | 🔴 **The deletion EXECUTOR, not only the request** (LabFlow 2026-10-30): read every FK to `auth.users` from `pg_constraint` (`confdeltype` c/n/r). A hard delete either fails on a RESTRICT (a signer column) or CASCADE-deletes records that belong to someone else (a lab's requests, an applicant's application) and SET NULLs the name off signed work. Carry out only a request bound to the session (`auth.uid()`), never an email typed into a form | Personal rows erased, shared records kept with their name (memberships suspended, not deleted), sign-in removed by Auth's **soft** delete; the server enforces the stated waiting period; proved on a throwaway account: early → refused, non-admin → refused, form request → refused, then sign-in refused and the record still named |
| DATA-08 | 🔴 **Session replay starts from the RESOLVED ROUTE, never from the served file** (LabFlow 2026-10-30): a tag that starts at boot unless the served `<body>` is masked, plus a reload when a masked page finds it running, loops on any host that serves `index.html` for every path (`vite preview`, the Capacitor shell) | Render a signed-in route through `vite preview` before deploy: page renders, replay tag undefined, zero replay requests; on a public page the tag runs |

Fix guidance: reuse the project's policy helpers and migrations (Drizzle, forward-only, idempotent, additive;
`supabase-provisioning.md`). Add a pre-approved assertion when the failure is invisible. 🔴 A live policy,
grant or migration change on production follows the project's approval rules. A destructive SQL statement is
an owner decision.

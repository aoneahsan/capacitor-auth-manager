# House laws as checks (H01…H27)

The owner's own fleet laws, turned into checks that every run includes. 🔴 **Point, never copy**: the law lives
in the named rule, so read that rule when its check FAILs or the evidence is ambiguous. A project's recorded
decision (an OD or a `Per-Project Stack Override`) can make a check NA. Cite the decision.

| ID | Law (one line) | How to check | Rule |
|---|---|---|---|
| H01 | Every product ships a plan set (free + ≥ 1 paid); "no paid tier" is written nowhere | `grep -rniE "no paid (tier\|plan)\|free only\|completely free forever"` across src, public, docs, `llms.txt` | `00-house-rules.md` |
| H02 | NO REFUNDS lives only in Privacy + Terms; each pay surface carries exactly the consent line; no discouraging payment copy | grep `refund\|before you pay\|non-refundable` in pay-surface components; render each pay surface | `payment-copy.md` |
| H03 | Legal notice = one quiet bottom bar, Okay, once per browser + account, 10 s, `role="status"`, never a modal; **analytics on by default, told once by one line in that bar, no opt-out** (2026-10-30) | First visit in a clean profile; second visit; signed-in second device flag; no Privacy preferences panel, no analytics switch anywhere (footer, Settings, Privacy page), no consent gate before the analytics load; Privacy page and Data safety rows say the same (Rent Party 2026-10-30-2124) | `legal-notice.md` |
| H04 | No custom cursor (`cursor: none`, `cursor: url(`, follower layers, cursor theme axis) | `grep -rnE "cursor:\s*(none\|url\()\|custom-?cursor" src` | `frontend-ui-standards.md` |
| H05 | One theme control (header icon → one panel, every axis, pre-paint, dual persistence) | Render; check the pre-paint script and the axis registry | `radix-theme.md` |
| H06 | i18n: every visible string through `t()`, a missing-key gate exists | Run the project's i18n gate; grep JSX text literals | `i18n.md` |
| H07 | strata-storage is the only thing touching localStorage/sessionStorage/IndexedDB/cookies | `grep -rnE "localStorage\|sessionStorage\|indexedDB\|document\.cookie" src` outside the storage adapter | `react-mobile.md` |
| H08 | `/sitemap`, `/sitemap.xml`, `/feed`, `/feed.xml`, footer links, robots `Sitemap:`, truthful lastmod, real 404 | curl each; 3 invented paths → 404 | `project-config.md` |
| H09 | No `console.*` outside the logger; no source maps in production; zero-warning build | grep src; `find dist -name '*.map'`; build log | `build-test-quality.md` |
| H10 | No hardcoded secrets or client ids; no server secret in a `VITE_`/client var | `grep -rE "apps\.googleusercontent\.com\|sk_live\|service_role" src dist` | `00-house-rules.md`, `project-config.md` |
| H11 | Banned packages absent (Crashlytics, Firebase Performance, client-made packages) | grep `package.json` | `00-house-rules.md` |
| H12 | yarn only; one `yarn.lock`; latest stable deps; `docs/PACKAGES.md` current | `ls package-lock.json pnpm-lock.yaml`; `npx -y npm-check-updates` (read-only) | `package-management.md` |
| H13 | Zero-cost: no paid service, no new Cloudflare Worker, Supabase for backend, FilesHub for files/email | Inventory vs the allowed list | `zero-cost.md`, `services-integrations.md` |
| H14 | Supabase, not Firebase, for production backends (completion gate 2) | Dependency + config inventory | `project-completion.md` |
| H15 | Admin panel + both default admin emails seeded; admin features verified as a non-admin | Check seed/migration and the role gate | `00-house-rules.md` |
| H16 | External links follow the shared link policy (new tab, rel, do-follow/nofollow) | Sample the footer and body links | `frontend-ui-standards.md` |
| H17 | Uploads explain purpose/type/size/dimensions before selection; limits enforced server-side | Render each upload field | `frontend-ui-standards.md` |
| H18 | Keyboard shortcuts rebindable, clash-checked with a named message | Where shortcuts exist | `keyboard-shortcuts.md` |
| H19 | Share = WebShareModal on web, `@capacitor/share` on native; AbortError is silent | Click share on web | `share-feature.md` |
| H20 | Products speak as the team; no founder byline; Story Bible approved before reader-facing prose | grep first-person-singular maker lines; check `docs/story/` | `storytelling-content.md` |
| H21 | Both tour systems + phone app-view screens + our three packages (native-update, strata-storage, capacitor-auth-manager) where the category needs them | Completion checklist rows | `project-completion.md` |
| H22 | Capacitor: Trapeze trio present; iOS removed; `AD_ID` declared | `package.json`, `apps-config.yaml`, manifest | `capacitor-plugins-and-issues.md`, `ios-platform-removal.md` |
| H23 | No TODO/FIXME/"coming soon"/placeholder in shipped code or copy | `grep -rn "TODO\|FIXME\|coming soon\|lorem" src` | `00-house-rules.md` |
| H24 | Files ≤ 500 lines; no `.sh`/`.py`/`scripts/` added to a product repo | `find src -name '*.ts*' \| xargs wc -l \| sort -n \| tail` | `00-house-rules.md` |
| H25 | End users sign in with Google only: no email/password UI, and the public Auth API refuses a non-test email sign-up | `grep -rn 'signInWithPassword\|type="password"' src`; `POST /auth/v1/signup` with a non-test address must fail; the `t1+1` password grant must still answer 200 | `services-integrations.md` (2026-10-29) |
| H26 | No built utility tool ZTools already has: each links to its ZTools page, do-follow, and its old URL 301s there | routes and hub vs `https://ztools.zaions.com/sitemap.xml` | `ztools-only.md` |
| H27 | Every own product has disclosed ads for other products; no self-promotion or blanket no-ads claim | Inspect each claim-bearing page and placement, follow a promotion, verify roster self-exclusion and Contains ads on applicable listings | `00-house-rules.md`, `post-install-onboarding.md` |

Fixing a FAIL follows that rule's own procedure: UI changes are dummy first, copy goes through the story
system, package changes go through `-packages-up-to-date`.

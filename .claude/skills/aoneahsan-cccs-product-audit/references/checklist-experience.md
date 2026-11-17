# Checklist — journeys, accessibility, mobile, performance (lane: `aoneahsan-ccca-audit-experience`)

IDs: **UX-01…08 · A11Y-01…08 · MOBILE-01…09 · OPS-01…07**. Browser work uses the automation browser only
(`browser-automation.md`), its own CDP target, signed in as a non-admin `t1+n` account. Screenshots are taken
at **1440, 390 and 320** and contain synthetic data only.

## UX — core journeys and usability

Define the smallest valuable outcome first (the PROFILE names it). Walk: anonymous landing → CTA → sign-up →
onboarding → first saved value → return visit → share/export/purchase.

| ID | Test | Acceptance |
|---|---|---|
| UX-01 | The first-value journey on a fresh account | Completes without a dead end; the value persists exactly once after reload |
| UX-02 | Interruption matrix: double-click, refresh mid-save, Back/Forward, second tab, expired session, offline then online, modal cancel, unsaved changes | No duplicate writes; input kept on recoverable errors; no success toast before persistence |
| UX-03 | Empty, one-item and large seeded datasets; long text, emoji, non-Latin, RTL | Layout holds; empty states name the next action without fake data |
| UX-04 | Deep links before and after login; URL state for tabs, modals, filters (`aoneahsan-cccs-url-state-persistence`) | The URL restores the view; a refresh keeps the place |
| UX-05 | Feedback within 100 ms for every control; loading, error and success states (`aoneahsan-cccs-interaction-feedback`) | Present |
| UX-06 | Responsive 320 → 1920: no horizontal scroll at any width; 44 px targets; every screen uses its width (`frontend-ui-standards.md` §19) | `document.documentElement.scrollWidth <= innerWidth` at 320/390/1440 |
| UX-07 | Phone app view and Capacitor shell feel like an app (`aoneahsan-cccs-mobile-app-feel`) | App bar, thumb-zone action and bottom bar at phone widths; no flash at pre-paint |
| UX-08 | Both tour systems: page tours (one button, one-time hint, skip/close/jump) and the walkthrough page (`aoneahsan-cccs-guided-tours`) | Each works; nothing stray left on the page after a close |

## A11Y — WCAG 2.2 AA engineering baseline (never certified)

| ID | Test | Acceptance |
|---|---|---|
| A11Y-01 | Automated axe per key route and state (`tooling-commands.md`) | 0 serious/critical, or each is a finding mapped to its success criterion |
| A11Y-02 | Keyboard-only: every core journey, visible and unobscured focus, logical order | Completes without a mouse |
| A11Y-03 | Dialogs, menus, sheets: focus trap and focus restore, Escape | Correct (React Aria primitives, `aoneahsan-cccs-react-aria`) |
| A11Y-04 | Names and labels, error association, status announcements (`role="status"`/`alert`) | Announced |
| A11Y-05 | Contrast in every theme treatment and dark mode, including disabled and placeholder text | ≥ 4.5:1 text, ≥ 3:1 UI |
| A11Y-06 | 200% zoom, 400% reflow, text spacing, reduced motion honoured | No loss of function |
| A11Y-07 | Auth: paste allowed, password managers work, no cognitive puzzle | Passes |
| A11Y-08 | A screen-reader smoke test of the main journey (Orca/NVDA/TalkBack where available) | Understandable; mark BLOCKED when no screen reader is available |

## MOBILE — Android, PWA, store

| ID | Test | Acceptance |
|---|---|---|
| MOBILE-01 | Shipped platforms from source + the owner's developer page (`aoneahsan-cccs-store-presence`); iOS removed (`ios-platform-removal.md`) | Claims match reality; a built AAB is not "released" |
| MOBILE-02 | Merged manifest permissions vs Privacy, Terms and Data safety; `AD_ID` declared; no exact alarm (`capacitor-plugins-and-issues.md` ISSUE-005) | Every permission justified |
| MOBILE-03 | Edge-to-edge/safe areas, native Back, keyboard insets, deep/App Links, external-browser return | Correct (source + an owner device row when device-only) |
| MOBILE-04 | Trapeze kept: `@trapezedev/configure`, `apps-config.yaml`, the exact `sync:apps-config` script | Present (hard stop) |
| MOBILE-05 | OTA via native-update: signed bundles, downgrade guard, bridge-compatible (`native-update-package.md`) | Matches |
| MOBILE-06 | PWA: manifest, icons, installability. 🔴 **No service-worker caching** of private data (house standard: a PWA without caching) | Manifest valid; no stale-private-cache path |
| MOBILE-07 | Store listing: ≤ 1,500-char description, feature graphic rules, SVG master + PNG, account-deletion URL, privacy URL (`publishing-compliance.md`) | Matches the binary. Console edits are owner-only |
| MOBILE-08 | 🔴 Update flow (`aoneahsan-cccs-update-flow`, every product): layer 1 self-update wired and proven (SW takeover / OTA server holds a verified build / Play immediate update / extension or Tauri update), layer 2 release-record gate, in-app review in a Capacitor app | A `test`-channel urgent row blocks at once with its reason; a normal row shows the notice and blocks after a reload; no production row sits above the live version |
| MOBILE-09 | 🔴 App-view reach (`aoneahsan-cccs-mobile-app-feel`): every route the web header, account menu, drawer or footer links to is reachable from the phone app view and the store app in two taps or fewer | A list of every web-linked route, each opened from a tab at 390 touch; none needs a typed address |

## OPS — performance, reliability, operations

| ID | Test | Acceptance |
|---|---|---|
| OPS-01 | Lighthouse mobile (mid-phone throttling) on the key **public and signed-in** routes, cold and warm; the project's own budgets (`docs/PERFORMANCE.md` if present) | LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms, or a recorded exception with its OD. 🔴 An exception is not a pass |
| OPS-02 | Field data (CrUX/PSI API, keyless public endpoint when it has data) | Reported with window and percentile, or "no field data" |
| OPS-03 | Bundle: first-load JS, heavy imports at point of use, lazy routes (`aoneahsan-cccs-react-performance`) | Within the project gate |
| OPS-04 | Over-fetching: every list query is bounded; no client-side filtering of whole tables (`data-fetch-budget.md`) | grep and network sample are clean |
| OPS-05 | Error tracking: Sentry release tagging, error boundaries per route, branded error pages; real 404 for unknown paths, including nested leaf paths | `curl -s -o /dev/null -w '%{http_code}'` returns 404 on 3 invented deep paths |
| OPS-06 | Long actions run as async jobs with progress and a finish notification (`project-completion/references/async-jobs.md`) | Matches where long actions exist |
| OPS-07 | Deploy safety: the latest deploy matches HEAD, a rollback path exists, no dev surface in `dist/` (`build-test-quality.md`) | grep `dist/` for the dev-only hook returns 0 |

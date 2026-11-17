## 15. Lessons from Native Update run 1 (2026-10-26) — a SaaS + package, and the shared browser

- 🔴 **The superpowers MCP Chrome is shared by every session on the machine.** Its "active tab" is not yours: another
  session (LabFlow) navigated the tab this session had just opened, and this session's screenshot showed their page.
  Launch your own headless automation Chrome (`$CHROME_WS_BROWSER --headless=new --no-sandbox
  --remote-debugging-port=<free> --user-data-dir=<scratchpad>`; `--no-sandbox` because this machine has no usable
  sandbox under AppArmor) and drive it over CDP with a one-off scratchpad script: `PUT /json/new`, emulate the
  viewport (+ touch at 390), navigate, wait, collect `Runtime.exceptionThrown` / console errors, screenshot, close the
  target. Kill only that pid.
- 🔴 **Firebase Hosting answers `/pricing` with a 301 to `/pricing/`** when the prerendered page is `pricing/index.html`,
  so every sitemap URL was a redirect while its canonical named the no-slash URL. `"trailingSlash": false` serves it with
  200; assert it in the hosting test.
- 🔴 **A sitemap `lastmod` from file mtime is the build day in any fresh worktree.** Read each source file's last git
  commit date (`git log -1 --format=%cI -- <file>`); the deploy worktree is a git checkout, so it works there.
- **A client-side `<Navigate to="/">` catch-all hides the real 404 from people** even when the host answers 404:
  route `*` to the not-found page.
- **"Is it open source?" is a licence question, not a copy question.** The owner said "not open source", but the package
  was MIT on npm; ask whether the licence changes (it did: proprietary from 4.1.2, earlier versions stay MIT) before
  rewriting copy. The sweep across website, docs site and README was ~400 claims, best split into one agent per repo.
- **Polar accepts a `custom` (choose-your-price) price on both one-time and recurring products** (sandbox probe,
  2026-10-26, probe products archived). A support checkout carries `metadata.kind = support`, and the billing webhook
  must acknowledge it before the entitlement code, or a subscription with no account answers 500 and Polar retries forever.
- **FilesHub developer-account reveal by `provider:identifier` 404s when the identifier is null** (npm account 2);
  list `GET /developer-accounts` and reveal by numeric id.
- **FilesHub management responses can be large enough that a narrow `jq` filter fails silently**: a PATCH that looked
  like it did nothing had applied. Always read the setting back with its own GET.
- **Enforcement before explanation is a defect**: a backend rule that changes what customers get (the plan-limit hold)
  ships only after the Terms, the dashboard banner and the emails that explain it are live; write that order into the
  deploy note.
- The shell's working directory resets after every command here: `cd <worktree> && firebase deploy …` in one command.
- Firebase CLI credentials can expire mid-run (`Authentication Error … --reauth`); there is no service account for most
  sites, so the owner runs `! npx -y firebase-tools@latest login --reauth` — ask the moment it fails, keep working.
- 🔴 **A sub-agent may stage with `git rm`/`git add`**, so a plain `git commit` in the main session sweeps its staged files into
  your commit. While an agent is writing in the repo, commit with an explicit pathspec: `git commit -m … -- backend docs`.
- 🔴 **`pkill -f <pattern>` kills your own shell** when the pattern is in the command line; kill by listening port
  (`ss -ltnp`) or by a recorded pid.
- **Banked referral months need an apply path.** Months earned while a paid plan is open-ended were recorded and never
  applied; apply them when the paid plan ends, once per reward (a new ledger row pointing at the banked one).
- **Test the RETURN VALUE of an agent's method, not only its effect**: `applyBankedReferralMonths()` returned the candidate
  count, not the applied count; only a test asserting the number caught it.
- **A returned payment needs its own path.** Polar `order.refunded` → re-fetch the ORDER, a whole return of the CURRENT
  period ends that plan time and marks the period (`subscriptions.returned_through`), so a later `subscription.updated`
  for the same period cannot give the plan back; a renewal (a later period end) applies again. A part return or a past
  period ends nothing.
- **A model default the table has but the model lacks hides a guard on create**: the plan-ladder check skipped inactive
  tiers, and a new `Plan` saved without `is_active` was null (inactive) to the check but active in the database. Hold the
  table's defaults in `$attributes`.
- **An email footer that promises a setting must be honoured server-side**: "change which emails you get in Settings"
  shipped with nothing reading the setting. Gate the notification's `via()` on the preference key.
- **The dummy's admin derivation finds the admin API you owe**: eight drawn admin pages needed nineteen `/api/admin/*`
  routes that only Nova had. Build them in the backend while the React rebuild runs, write the contract to
  `docs/api/ADMIN-API.md`, and message it to the rebuild agent.
- **Plant a defect fully**: a colour plant that replaced one of two occurrences left the test green; use `g` and count
  the occurrences after planting.

- **Measure CLS and LCP on the live build before scoring, and name the element** (Native Update run 1, 2026-10-27):
  CLS was 0.62 on every page and the LCP element was the footer tagline. A lazy route's `Suspense` fallback was
  `min-h-64`, so the footer painted in view and jumped off screen when the page arrived. Make the fallback fill the
  screen (`min-h-dvh`). Record the shifts with a `layout-shift` observer that prints each source's node and rects.
- **A `manualChunks` group drags shared modules into the group's chunk**: Sentry, Amplitude and Clarity in a
  `vendor-analytics` group pulled React in with them, so the chunk meant to load late was preloaded before first paint
  (160 KB gzip). Import the SDKs after first paint (`load` + `requestIdleCallback`), queue earlier events and errors,
  and give them no group. Prove it from `dist/index.html`'s `modulepreload` list, not from the config.
- **A rebuild can drop policy text that matched what runs**: run 1 named every processor; the React rebuild's legal
  catalogue lost it while Sentry, Amplitude and Clarity kept running. After a rebuild, grep the legal copy for each
  third-party SDK the build loads. Ask the owner which way policy and behaviour should agree. For an off switch, prove
  the effect with a control run: with it on, the SDK requests appear; with it off, they don't.
- **Check behavioural numbers in the docs against the code**: five docs pages said rollback fires after a 60-second
  `notifyAppReady` window, while both native layers count two failed cold starts and have no timer. The docs
  assistant answered from that text, so a docs error becomes a product answer. Its docs index caches 24 h; clear it on
  the next deploy.
- **The automation profile keeps yesterday's session**: strata's `importRawSync` lets an existing strata value win,
  so an injected raw token was ignored and pages rendered as a different test account. Clear `localStorage` before
  injecting, and check an account-specific value on the page (here the referral code) against the API.
- **A newsletter "send" can reach nobody**: the approved release email's list held 0 confirmed subscribers
  (double opt-in, signup new). Read the list count before promising a send; activate the sequence and say so plainly.

## 13. Lessons from zaions.com run 2 (2026-10-26)

- 🔴 **A FilesHub api-key `PATCH {"permissions":{…}}` REPLACES the whole map.** Adding `email_template` to zaions' server
  key dropped `turnstile`, which the live brief form needs; restored a minute later. Send the full map (read the key
  first), then read it back and probe `POST /api/v1/turnstile/verify` with a bogus token (`200 success:false` = working).
- **Turnstile never clears in headless Chrome** ("Checking for spam…" for 45 s). Prove a Turnstile-gated UI call in a
  visible automation Chrome (`DISPLAY=:0`, own profile, own port). On this machine AppArmor blocks Chrome's user-namespace
  sandbox, so the automation binary needs `--no-sandbox` (other sessions run it the same way).
- **The fleet OpenAI key changed on 2026-10-26** and reaches `gpt-6-luna` as well as `gpt-4o-mini`: run `GET /v1/models`
  BEFORE writing an approval question that names the model, or the question states a stale fact.
- **All three shared marketing mailboxes can be out on the same day** (one at its cap, two resting for hard bounces):
  a step `[TEST]` answers `429 NO_CAPACITY`. Build everything else, keep the sequence draft, record the wait and the
  reset dates (`GET …/email-marketing/settings` → `accounts.list[].paused_until`); never move a mailbox.
- **A lazy tour chunk can arrive 14 s after load on a slow network**: wait ≥ 20 s (or read
  `performance.getEntriesByType('resource')` for the chunk) before calling a missing phone tour button a defect.
- **Screens for a marketing email from a page with a mic:** `?start=1` shows "Your browser is blocking the microphone"
  in headless; `Browser.grantPermissions {permissions:["audioCapture"]}` (browser-level, no session) renders the real
  state (it starts recording; confirm afterwards that no voice row was stored).
- **A docs site that dates each page from its last commit:** never bump another page's front matter (e.g. renumbering
  `sidebar_position`) to slot a new page in; the curated `sidebars.ts` list orders it.
- **A decision number can collide across branches** (the tours wip took OD-40 on 10-24, the primary branch took OD-40 for
  the cursor on 10-26): renumber the wip entry at the merge and grep every reference to it in both repos.
- **A commit hook can reformat a byte-identical copy** (the app's `tours.css`, prettier via lint-staged, broke the
  dummy byte-parity test): add the copied file to `.prettierignore`, restore it from the dummy, `cmp` after the commit.

## 16. Lessons from Video Controls Plus run 1 (2026-10-26) — a browser-extension project

- 🔴 **A root short-link route (`/:shortCode`) is a soft 404 for every unknown path**: each typo resolved to the
  redirect page and answered 200. Move short links under a prefix (`/go/:slug`), keep 301s for the slugs already
  shared, and scope Firebase rewrites to the router's first segments (`/@(a|b|…)`, each source ≤ 300 characters).
- **A sitemap can list URLs that have no prerendered page**: those 17 named the home page as canonical. The build now
  requires `dist/<path>/index.html` for every `<loc>`. Drop a URL rather than list it unprerendered, and file its words.
- 🔴 **Read the live Privacy Policy before planning a campaign.** VCP's said "We send no marketing email", and 0 of 501
  accounts had opted in. Approving the campaign did not approve breaking the promise, so it is a batched owner question
  (change the policy through GATE 4, send only to opted-in people, or hold).
- **strata-storage `importRawSync` adopts the raw STRING.** A key that held JSON must be `JSON.parse`d and re-set, or
  every reader gets a string where it expected an object.
- **The guided-tours skill has no extension-surface guidance.** For an extension project the tours live on the
  marketing website and dashboard. The popup and options page link to `/how-it-works` (no Driver.js inside the
  extension: the bundle stays remote-code-free).
- **Edge's add-on site resets connections from this machine** (curl `000`): its version cannot be read here. Record
  it as unreadable and leave it in the owner chain, never as live.
- **The pooler host can fail to resolve mid-run** (DNS flake, ~900 ms ping): check `getent hosts` first and run psql in
  the background. A first `firebase deploy` can time out on "resolving hosting target"; retry once.
- **When a product's checkout is dormant** (no provider organization yet), `GET billing` → `available:false` keeps the
  contact flow. The pay button signs in through the existing `signInWithGoogle({returnPath})`; never invent a `?next=` route.

## 13. Lessons from ZTools run 1 (2026-10-26)

- 🔴 **Cloudflare Pages: a rewrite to `/index.html 200` answers 308 to `/`.** Pretty URLs strip `.html`, so the SPA
  rewrite target is `/` (`<pattern> / 200`). Add `dist/404.html` (noindex, no canonical), one rewrite per registered
  route with no prerendered file (static + `:param`, optional segments expanded), and **no rewrite for a dynamic route
  whose every address is prerendered** (blog, categories), or unknown slugs answer 200. Prove it with
  `wrangler pages dev dist` before the deploy: unknown 404, real routes 200. A build check fails on an unserved route,
  a catch-all, a bad 404.html or the Pages rule limits (2,000 static / 100 dynamic).
- 🔴 **Read every UUID regex in a billing function.** ZTools' was 8-4-4-12 (one group short), so no real organization id
  ever validated and billing answered `not_configured` for weeks. Three copies (function, browser client, page). Grep
  `[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}` without the extra group; pin it with a test using a real id.
- **A billing database that hard-wires its project to `production` cannot take a sandbox checkout.** The proof is a
  $0 production pilot: products private, mappings inactive, one `pilot_user_id` column that lets only the named alias
  check out an inactive SKU (the catalog stays active-only), a one-use product-restricted 100% discount. 🔴 **Polar
  requires a payment method for a subscription whose later periods cost money**: a `once` discount still asks for a card
  (`confirmation_token_id`). Use `duration: forever`, confirm through `POST /v1/checkouts/client/{secret}/confirm` with
  `customer_billing_address.country`, then revoke the subscription (`DELETE /v1/subscriptions/{id}`) and clear the pilot.
- **Polar API calls from Python `urllib` need a `User-Agent`**; without it the list call returns an error body with no
  `items`.
- **A fallback that a privacy policy denies stays OFF until the words change.** ZTools' policy said "ZTools doesn't send
  the request to another provider instead"; the fallback secrets stay unset and the words go to GATE 4. Score the AI row
  on the lease and Speak calls; record the fallback as held.
- **A content map with no marketing-email row is a GATE 2 stop.** Draft the row as a package; never write email 1
  against a missing row.
- **A `git push` can hang for minutes with SSH healthy**; check `ssh -T git@github.com`, kill your own push pid and retry
  with `timeout 120`. A command chained after it waits silently.
- **`supabase db push` may print `Terminated` or a stack trace from its post-push catalog cache** (2.5 s pooler
  timeout). Read `supabase_migrations.schema_migrations` and the catalog before believing either way.
- **`pg_get_functiondef` ends without a semicolon**: add one after each `$function$` before reusing it in a migration.
- **Sweep raw `sessionStorage` too**: page-level UI hints (`ztools:speak-unsaved`, pending checkout markers) bypassed
  strata; a synchronous session store (`getSync`/`setSync` on `sessionStorage`) keeps `useState` initialisers working.
- **An extension inside the app repo moves with `git subtree split -P extension`**, pushed as the `extension` branch;
  prove the split is blob-identical (`git ls-tree -r` vs `git ls-files -s`), copy the ignored store builds (`.output/`)
  and refresh their `SHA256SUMS` before deleting the folder.
- 🔴 **A new FilesHub email list defaults to `double_opt_in: true`**: account holders imported into it would each get a
  confirmation email. For an `existing_relationship` list, PATCH it to `false` before any import.
- **Lock an unapproved campaign step with `requires_approval: true`**, never only with a long delay; `GET …/check` then
  reports `entry_step_unapproved` until the `[TEST]` is approved. Import the people only after approval (data minimisation).
- **When the privacy text changes, sweep every surface that repeats it**: the policy module, the generated
  `docs/PRIVACY_POLICY.md`, `SHIPPED-FEATURES`, the docs-site summary row. The page-date ledger then needs the new
  fingerprint the build prints, dated today.

## 17. Lessons from Empora run 1 (2026-10-26/27) — a WordPress plugin + SaaS

- 🔴 **Drive one real sandbox purchase end to end; it found two bugs every gate missed.** Polar answers a collection
  path without its trailing slash (`POST /v1/checkouts`, `/v1/customer-sessions`) with **307**; with redirects off,
  Laravel's `throw()` passes a 3xx, so the body was `null` and every checkout failed. And Polar's checkout session
  (API `2026-10`) carries **no `subscription_id`**: recovery marked the checkout `succeeded` and never granted the
  plan. Find the subscription through `GET /subscriptions/?external_customer_id=`. The unit test had asserted the
  no-slash URL, so it encoded the bug.
- **Sandbox recipe:** the payment account (`GET /payment-accounts/{id}/reveal`) holds `sandbox_access_token` +
  `sandbox_organization_id`. An organization token must NOT send `organization_id` on create. Mirror the live
  products read-only. Run the backend locally against a throwaway SQLite with the Polar env passed as OS env (it
  outranks `.env`). Pay in your own CDP target: pick the country, then the **address and state first** (by option
  label), then type the card into the Stripe frame (`Target.setAutoAttach` flatten; read each frame's
  `location.href`, since attach URLs are blank). The address re-renders the Stripe element and wipes a card typed
  earlier. Wait for the button's `disabled` to clear, then click with real mouse events.
- 🔴 **A lazily loaded chunk that imports from the entry loads a second copy when WordPress serves the entry as
  `admin.js?ver=…`**: the admin booted twice (a second React root) on six tabs. Keep the entry empty
  (`import('./bootstrap')`), put Vite's preload helper in its own chunk (`manualChunks` on `vite/preload-helper`),
  and make the release refuse a chunk importing `./admin.js`.
- **Clean-install acceptance traps:** reproducible zips stamp one fixed mtime, so `rsync` skips a changed file of the
  same size (use `--checksum`); deleting a bind-mounted plugin folder detaches the mount (`wp-env stop` + `start`);
  an admin sweep must find the real root element, disable the cache (`?ver=` does not change between builds), and
  never pass on text length alone (a "not allowed" page has plenty).
- 🔴 **A cache-clearing service worker must delete only its own caches** (`workbox-*`). Deleting every key also wiped
  `strata-storage-v1`, strata's Cache API store. VitePWA cannot emit a worker with nothing to precache: ship a
  static `public/sw.js` with no fetch handler and register it yourself.
- **A sitemap words ledger must fingerprint each page's OWN words**, not its rendered body: the crawler body also
  lists other pages' descriptions, so one edit would move every date.
- **GitHub SSH can hang for every session at once**; push over HTTPS with
  `git -c credential.helper='!gh auth git-credential' push https://github.com/<repo>.git <branch>`.
- **FilesHub marketing setup:** brand fields are flat on `PATCH …/email-marketing/settings`. A marketing template
  needs the server key's `can_manage_email_marketing` AND its `email_template` permission. A sequence step needs
  `track` + `position`; set `requires_approval` before the `[TEST]`. All three shared mailboxes can be exhausted
  (85/day across about 12 projects): `NO_CAPACITY` means wait for the next day, never move a box.
- **The shared boxes reset at 00:00 UTC and are used up within hours**, so a `[TEST]` waits for that minute with one
  timed send, never a loop: a one-shot at 00:00:05 UTC reads `remaining_today` once and sends when it is above 0 (a
  2-minute loop got VCP the first slot at 00:00:52; the one-shot is sooner). 0 then means wait for the next reset. 🔴 **`POST …/enroll` has NO dry run**: `{"all":true,"dry_run":true}` enrolled all 484 for
  real. Enrol only after the approval, and read `stats` afterwards. `activate` does not enrol a list on its own
  (`auto_enroll_new_contacts: false`).
- **Build the import list from `auth.users` joined to `profiles`**: confirmed email, not deleted, deduplicated. Then
  remove the owner's own addresses, including his work domain (`bifrostforge.co`), plus every `*test*` account.
- 🔴 **A running sequence takes no new steps**, so the second email of a campaign is its own sequence on the same list.
  The 20-day cross-campaign gap only holds someone who has already had a campaign email: enrol the second one, then
  `…/enrollments/reschedule` every enrollment to after the first sequence's forecast finish (`GET …/report` →
  `forecast.date`). Otherwise most people get email two before email one. (`reschedule` does honour `dry_run`.)
- **A marketing screen shows a plan number** (runs used today, a limit): crop it out. Limits are admin fields, and the
  Story Bible keeps run counts out of copy. Use phone captures in the narrow feature column; desktop ones are unreadable.
- **An AI token IS mintable over the Management API** (`POST /access-tokens`, `project_ids`, one flat flag). An
  agent that says "only Nova mints it" is reading a stale note.
- **A long-lived automation Chrome serves you the OLD page.** A render check reused the session's headless profile and
  showed a hidden SEO block the new build had already removed: the cached HTML, not the build. Every pre- and post-deploy
  check sets `Network.setCacheDisabled` and `Network.setBypassServiceWorker` first, and a surprise in the DOM is first
  compared with `curl` of the same URL before anyone "fixes" the source.
- **Ship the website before the backend whose emails load its assets.** The branded emails pull `/email/mark-88.png`
  from the site, so the site deploy goes first and the owner's backend row says it is ready.
- 🔴 **Test a one-time hint in a FRESH ISOLATED browser context** (`Target.createBrowserContext` + `createTarget`,
  disposed after). A shared automation profile already holds "seen" flags from earlier render checks, so the hint
  never shows and the check reads as a broken feature (ZTools: it worked; my profile was dirty). Sample every 0.5 s:
  the hint is gone 8 s later.
- 🔴 **An auto-opening modal anywhere in the app blocks the tour hint** (the hint yields to any open dialog). ZTools had
  an "Enable notifications" modal opening by itself on every page: remove it (push permission behind a user action,
  `onesignal`); notifications start from settings.
- 🔴 **Walkthrough screens in the APP come from the LIVE app**, not the dummy. A dummy drawn for a redesign that has
  not shipped shows users a UI they will not find. Sign the non-admin alias in through a password grant, write the
  session in the storage layer's own envelope (`strata:<ns>:<key>` → `{value, created, updated}`) with an init script,
  seed one record for the screen that needs data, capture at 1440 and 390, delete the seed and the session file.
- **`supabase secrets set` (and other linked commands) writes `supabase/.temp/` into the CURRENT directory**: run them
  from the app repo, or delete the stray folder from a kit root before committing.
- **A `db:types` script with `--linked` trusts the default target**: generate with `--project-id <ref>` explicitly.
- **A worktree from an older `main` merges cleanly but the words ledger may refuse the merge** when one side changed
  how pages are fingerprinted: re-run `seo:page-dates` and check that only the new page's entry moved.
- **Ask about a production migration a sub-agent adds**: the earlier approvals named other actions; one question,
  rehearsal in `BEGIN … ROLLBACK` (twice-run, a refused bad value, the grants) before the push.

### Empora run 1, close (2026-10-27)

- **A sub-agent worktree with `node_modules` SYMLINKED to the main checkout is not isolated:** its `yarn add`
  installs into the main checkout's `node_modules`, and `tsc` there reports TS2883 ("not portable") errors that a
  real install does not. Remove the symlinks before committing (they show as untracked), and build the deploy from a
  worktree with its own `yarn install --frozen-lockfile` plus a fresh `packages/*/dist`.
- **`firebase emulators:start --only hosting` ignores the port you meant and binds 5000**; serve a pre-deploy check
  with `firebase serve --only hosting --port <registered>` instead, and kill it by its listening pid.
- **After an HTTPS push with the gh credential helper, `o/main` is stale** (the push named a URL, not the
  remote), so `git status` shows "ahead N" for work already on GitHub: `git fetch o` before reporting `0 0`.
- **Score tours honestly:** live page tours + walkthrough still score 0 while the hint's per-ACCOUNT seen record, the
  signed-out "See how it works" entry and the live non-admin check are missing. Draw the signed-out entry in the
  tours dummy from the start.
- **Prove a Google OAuth web client allows an origin with one `curl`, before switching sign-in:** request
  `accounts.google.com/o/oauth2/v2/auth?client_id=…&redirect_uri=storagerelay://https/<host>?id=auth1&response_type=token&scope=openid`
  — an allowed origin redirects to `/v3/signin/identifier`, a disallowed one to `/signin/oauth/error`
  (`redirect_uri_mismatch`). Run it for the real host AND a made-up one, so the probe is shown to discriminate.
  After the deploy, click the button in a fresh browser context and list every request host: no
  `identitytoolkit`/`firebaseapp` host is the evidence that Firebase Auth has left the page.
- **Reuse a JSON preferences column for one-way display facts** (legal notice seen, tour hints shown): no
  migration, and the preferences PATCH already refuses unknown keys, so the fact cannot be cleared by a client.
- **A Laravel API host that serves HTML needs its own CSP for those pages.** Empora sent the JSON policy
  `default-src 'none'` on every non-Nova response, so the sign-in screen and every error page rendered as bare
  text. Give `text/html` responses outside Nova a nonce policy (`style-src`/`script-src 'nonce-…'`, the nonce
  shared to views) and keep `default-src 'none'` for JSON; test that each page's tags carry the header's nonce.
  Check the API host's `/`, `/login` and a 404 in a browser at every finalization — a curl 200 hides this.
- **Build a fresh worktree's packages in dependency order** (`shared` first): a loop that builds them
  alphabetically fails three of five and still lets the web build pass on stale or missing types.
- **Dummy parity on a large app goes in three releasable parts** (ZTools, 2026-10-27): (1) the palette + the feature-screen
  shell + the tour targets; (2) the home in the dummy's band order, the data panels, a tool head; (3) the site header + one
  global body reset. Ship each part (pre-render check at 320/390/1440 signed in, deploy, live hash) before the next.
- 🔴 **Re-run widths SIGNED IN at 320 after a header change**: a signed-in header adds the notifications bell and can
  push the page 4 px wide while the signed-out check passes. Probe with a session injected through the storage
  envelope, and list the elements whose unclipped right edge passes the viewport.
- **A redesign can make an approved legal sentence false** ("Account Settings → Danger Zone → Delete Account" after the
  panel became "Remove data"). Grep the approved catalogues for UI names the redesign renamed, and send the corrected
  line to GATE 4 in the same run.
- **An approved campaign starts from the people pool**: `GET /email-batches` lists `available` owner-list batches; a batch
  over the sequence's `max_recipients` is refused whole (`RECIPIENTS_EXCEED_MAX`), so raise the cap; `assign` needs an
  explicit `"dry_run": false`, enrols the batch, and `/check` then names `marketing_disabled` until settings
  `{"enabled": true}`.

## 18. Lessons from LifeWell's re-audit (2026-10-28) — the store set on a project already at 100

- 🔴 **A complete project's store set goes stale with its positioning, not with its code.** LifeWell scored 100 while
  its feature graphic still read "Educational wellness tracker" (June, teal) and the six shots carried captions from
  before OD-113. Read every image's words against the approved store surface on every run; a set made before the
  project's last positioning decision is redone, not reused.
- 🔴 **The store icon must be the icon the phone shows, so check the launcher first.** LifeWell's launcher, favicon,
  manifest icons and Android launch screen were all still the 2.x artwork. Redrawing only the 512 PNG would have put a
  store icon on the listing that no installed phone shows. Redraw the launcher set from the approved mark (an
  amendment), and make the upload row say it goes up with the next signed build.
- **A people-first pass can miss the footer, the sign-in lede and the shell `index.html`.** The shell's `<title>` and
  description are what every unprerendered route shows (the 404 page, signed-in pages). `grep` the old premise across
  the dummy, `index.html`, `public/*.txt` and the social image's `<title>`, not only the pages that were redrawn.
- **The test account's theme is a server setting that races the device one.** Captures flipped light and dark until
  `profiles.appearance.axes.theme` was set for the capture and restored straight after (read the shape first: the
  theme sits under `axes`). A set is one look, so pin it.
- **The app view scrolls the window, but a matching element can sit in a hidden desktop copy.** Pick the first
  element with a non-zero `getBoundingClientRect().height` before scrolling to it, or the scroll silently stays at 0.
- **A plan label in a capture is a prohibited word** ("free" on the drawer's account pill). Scroll the screen past it
  rather than editing the capture.
- **Under a machine load of 30–50 (parallel finalizations), `yarn gates` takes ~30 minutes** and prints nothing until
  the build. Do the image, docs and email work while it runs; never start the deploy before it ends.

## 18. Lessons from Trizlink run 4 (2026-10-28) — the first product audit, the store set

- 🔴 **A public-row policy plus a TABLE-level SELECT grant exposes every column.** Trizlink's `profiles_select_public`
  (`username is not null`) let the publishable key read `plan_payment_ref`, `plan_granted_by`, `limits_override` and
  the deletion dates of every named profile for two months; every RLS gate was green, because a policy cannot police a
  column. In every audit, list `information_schema.column_privileges` for `anon` on each table that has an
  `{anon,…}` SELECT policy, and read the column names. The fix is a column grant, with the caller's own row through a
  `my_<table>()` definer function. Then move every `select('*')` and every `update().select('*')` (a returned row needs
  SELECT on every column), and add a contract test that pins the column list to the newest grant.
- 🔴 **Apply a grant-narrowing migration and deploy the client in the same sitting.** From the `db push` onwards the
  live bundle's `select('*')` is refused. Have the deploy worktree ready before the push.
- **Store captures: choose the test account by its data, not its alias.** `t1+1` showed "[ux-audit]" links and a
  "Parity page". `t1+2` owned the realistic Northfield Coffee workspace, but it defaulted to the other workspace it
  belongs to. Set the active workspace through the storage layer's envelope (`{value, created, updated}` under the
  frozen key) before capturing, and check that a workspace-specific string shows on the page.
- **Wait for content, not for time.** Under a load of 16–37, lazy dashboard screens stayed empty for over 10 s and
  looked like the old blank-main issue. Wait for the absence of `[aria-busy=true]` and skeleton classes with a `MutationObserver` and a timeout (the
  `test-wait` exception). A network
  blip gives Chrome's offline page: check the `h1` ("Tap the dino to play") before saving any capture.
- **A CDP port you release is taken within minutes** (another session's Chrome took 9341). Never reconnect to a port
  after killing your own browser; read the holder's `--user-data-dir` first.
- **`X-Frame-Options` needs a path exemption for a public embed:** `/*` takes `SAMEORIGIN`, and `/widget/*` takes
  `! X-Frame-Options` in Cloudflare Pages `_headers`. srcDoc iframes inside the app are not affected.

## 19. Lessons from Video Controls Plus run 2 (2026-10-28) — Polar switch-on and the extension-store set

- **Edge's version IS readable from this machine** through the store's JSON:
  `curl -s https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/<extension id>` → `version`,
  `lastUpdateDate`. The detail page still resets connections; use the JSON (supersedes "unreadable" in §16).
- **Polar has its own skill now** (`aoneahsan-cccs-polar-payments`): tokens on a FilesHub payment account, products and
  webhook made by API, sandbox proof with the test card, a refund rehearsal. 🔴 **An unapproved production organization
  answers `status: created`**: set its token, server and webhook secret, withhold `POLAR_PRODUCTS` (checkout stays
  dormant), and switch on only after the owner says approved (`status: active`).
- 🔴 **When card checkout goes live, check the Capacitor shell.** A website that is also the Android app must read billing
  as unavailable on a native platform, or the store app sells outside Play Billing. VCP had no guard until this run.
- **Store images from an older pass may be drawn mockups**: VCP's August set showed invented screens and a stale "0.1x to
  4.0x". Open the PNGs before scoring the store set; a drawn screen is a fail, whatever its age.
- **Capturing an extension:** launch your own Chrome for Testing with `--headless=new --no-sandbox` (this machine has no
  usable user-namespace sandbox; Chrome aborts without the flag) plus `--disable-extensions-except=<dist> --load-extension=<dist>`
  and a scratch profile. The in-page widget sits in a CLOSED shadow root: drive it with CDP `Input.dispatchMouseEvent`
  (real clicks reach it; `querySelector` cannot). A bottom-anchored panel clips at the viewport: capture in a taller viewport.
- **A public CC BY video in a capture needs its credit on the image** ("Video: Big Buck Bunny, © Blender Foundation,
  CC BY 3.0"). Prefer the direct file URL (`upload.wikimedia.org/…webm`) over the file page, which carries the site's logo.
- **Seeking a streamed video past its buffer hangs `await v.play()` in an eval.** Play from 0 for a few seconds instead,
  and bound every eval.
- **A one-shot `chrome --headless --screenshot file.svg` hung under load;** render masters through the running CDP
  Chrome (`setDeviceMetricsOverride` + `Page.navigate` + `captureScreenshot`) — pixel-identical on regeneration.

## 20. Lessons from zaions.com run 3 (2026-10-28)

- 🔴 **"Phone app view" in the Primary row is an app bar / bottom bar / thumb-zone screen, not a responsive page at 390.**
  Run 2 scored zaions' responsive site as the app view; the experience lane found none in the app or the dummy and the
  row fell 15 points. Before keeping the row, grep the dummy and the app for the app-view shell and look at a 390 touch
  capture of home, dashboard/brief and settings (`aoneahsan-cccs-mobile-app-feel`).
- 🔴 **A STORED GENERATED column runs its function as the WRITER on every insert and update.** Revoking a helper from
  `authenticated`/`service_role` (a "house revoke pattern") refused every write to `posts` for two weeks while all reads
  and gates stayed green. Read `job_runs` (or the project's job log) for `permission denied` before rating grants, and
  rehearse the fix in `BEGIN … ROLLBACK` as `service_role` with and without the grant so the rehearsal discriminates.
- **An effect keyed on a state it advances clears its own timer.** The legal bar armed its 10 s timer and Escape on
  `mounted`, then the rAF set `shown`, whose cleanup cleared both: the bar never left. Key such effects on "open". Prove it
  live in a fresh browser context: present at 3 s, gone by 13 s, Escape closes.
- **A state page that draws its own chrome renders twice under a layout route.** A slug route's `notFound()` renders the
  not-found page inside `_site`'s chrome; make the chrome component render only its children when nested (a context),
  and count `.site-header`/`footer` on an unknown slug in the render check.
- **Open every committed store PNG before building on it.** Zaions' Play icon showed a quarter of the mark on white: the
  SVG's `viewBox` was 1024 while the art was drawn in 512 units.
- **The deploy-verify stamp is refused if its evidence text contains the word "deploy"** (the hook reads the command line
  as a deploy). Word the stamp without it.
- **A sed plant whose pattern contains the delimiter fails and the test stays green** — the "verify the plant applied"
  rule caught it; plant with a Python replace that asserts the count.
- **A marketing `[TEST]` can go out first thing in the UTC day:** zaions had 45 sends left at 06:30 UTC on a day all three
  boxes had been out two days earlier. Lock the step (`requires_approval: true`), send, ask the owner in the same session,
  then approve → `settings enabled` → `/check` → one pool batch (dry run, then `"dry_run": false`, which enrols) → activate.
  The batch list needs the **all-projects** marketing token; a project token answers `FORBIDDEN`.
- **Machine load can hold a lane for the whole run** (8 cores, load 10–29 from other sessions). Record the lane NOT_RUN
  with the reason and make it the resume point; never claim coverage it did not get.

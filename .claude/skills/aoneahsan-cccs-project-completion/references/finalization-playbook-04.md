## 32. Lessons from NetCage run 1 (2026-11-06) — native Kotlin app, first `/complete-project`, Firebase Hosting → Pages

- **`greatest`, `least`, `coalesce` and `nullif` are SQL keywords, not catalog functions.** A `search_path ''`
  hardening pass that wrote `pg_catalog.greatest(…)` applied clean (plpgsql bodies are checked only when run) and
  then failed every admin list and the account-deletion pager with `function … does not exist`. Only running the
  repo's persona script on the TEST project caught it. Qualify functions, never these four.
- **The shared TEST project may not be at baseline.** Another project's expired lease had left 39 tables, 109
  functions and one user. Census on lease, wipe only your own objects back to the found state, read it back, and
  record the leftovers for their owner; never clean another project's rows.
- **Supabase CLI 3 renames config and flags.** `[inbucket]` → `[local_smtp]`; `auth.email` / `auth.sms`
  `enable_signup` → `enabled`; `--db-url` is deprecated (use `--remote`); `functions deploy` needs `--yes` in an
  agent shell. Each command leaves a `supabase/.temp` link file: delete it after.
- **A strict `style-src 'self'` blocks React Aria's two injected `<style>` elements** (usePress's touch-action rule
  and the modal overscroll lock): one console violation on every page. Allow each by the sha256 of its exact text
  and keep a test that the bundle still injects those texts, so an upgrade that changes them fails the gate.
- **Firebase Hosting → Pages, prerendered site:** write flat `<route>.html`, not `<route>/index.html` — Pages
  serves a flat file at the slashless URL with 200, while a folder index answers `/route` with a redirect to
  `/route/`, which fights a slashless canonical. In `_headers`, `! Content-Security-Policy` under `/admin/*`
  detaches the `/*` value first; without it both policies are sent and both are enforced. `_redirects` wins
  over a file at the same path.
- **DNS swap via the API:** strip the CR from a record id read in a Windows shell (the first DELETE matched
  nothing and the old A record stayed: no outage, but the swap had not happened); a record comment over 100
  characters is refused. Keep the old values (A + `hosting-site` TXT) as the written rollback, and remove the
  Firebase custom domain only after the old TTLs have run out.
- **AND-006, wizard bundle vs an APK-reading release check:** a command-line `bundleRelease` passing proves
  nothing about Generate Signed Bundle; the wizard run is the proof (`aoneahsan-cccs-android-release-health`).
- **One-off scripts with backslashes go through the Write tool, never a bash heredoc:** a heredoc turned `\n` in a
  JS string into a real newline in source and `app\release\` into a carriage return in a doc. Read the diff after.

## 33. Lessons from Empora run 7 (2026-11-07/08) — plugin release acceptance, round four

- **A page that renders is not a feature that works.** 87 of 87 admin tabs swept clean while Import/Export imported
  nothing, never scheduled an export, and listed no problems (a MySQL 8 reserved word, `row_number`, unquoted).
  For every screen that starts a job or writes a file, run it end to end once: start, let the scheduler run,
  read the result, download it, import it back and diff (ISSUE-134).
- **A handler that builds its own copy of a stateful service sees an empty one.** Dynamic Pricing charged the right
  price while every order recorded no savings, because the cart and price-display handlers each made a new
  applier. Check the order meta and usage rows, not only the total; sweep modules for `new <Stateful>()` inside
  siblings (ISSUE-135).
- **Run Plugin Check on the premium build too**, even when WordPress.org never sees it: it found 90 errors the free
  build hid. Expected leftovers to state, never to hide: `plugin_updater_detected` (by design) and
  `array_is_list` (native in the PHP 8.1 floor).
- **A real upload catches what a sniff test hides:** `wp_handle_upload` with its type check refused valid XML.
- **The first click on a fresh admin lands on the one-time notice or the setup wizard.** Clear both before acting,
  or the harness reports a working control as broken and a capture shows the wizard.
- **Look at every store capture before framing it:** blank fields (an Email the plugin never stored), a stale
  licence banner, an update nag and generated words ("Supercharge … comprehensive toolkit") all only showed there.
- **Voice sweeps go string by string through the translation calls**, not by eye: 186 strings in one pass, then
  PHPCS (double quotes no longer needed) and the tests that pinned old words.
- **The shared automation browser on 9222 can be driven by another session**: an isolated context still had its tab
  navigated to another product mid-check, and a render proof showed that product's heading. Start your own headless
  instance of the automation binary on a free port with a scratchpad profile, and kill only that pid.
- **Measure a chunk before splitting it, and grep its CONTENTS, not its name:** the first look said Session Replay was not
  in the 423 KB Sentry chunk; `grep -c rrweb` said it was. Cause: `await import('@sentry/browser')` in a preload returns
  the SDK's whole namespace, so the bundler keeps every export. Preload your own module that takes named imports, load
  replay with its own dynamic import, and use Rolldown `codeSplitting` groups (`manualChunks` is deprecated and its groups
  pull dependencies in; a high-priority group needs `includeDependenciesRecursively: false`). 423 KB to 152 KB.
- **A turbo cache key must include the file the version lives in:** a root `package.json` bump replayed a cached web
  build with the old `version.json`, which the update flow reads. Add `package.json` to `globalDependencies`, and read
  `dist/version.json` after every release build.
- **A free tier inside a WordPress.org build must not be a locked paid feature:** gate "every field" on the build
  variant (`org` never) and the paid plan, so the .org zip only ever carries the core set.

## 34. Lessons from Rent Party run 5 (2026-11-10) — `/complete-project` after a testers' round

- **A catalogue key that exists can still print raw.** The table's push line and the chat's Report dialog read the
  `identity` namespace, which the online game route never loaded: every key existed, so the missing-key gate stayed
  green while players saw `push_nudge.line`. When a component that reads a feature namespace is placed on a new
  route, add that namespace to the route's loader in the same change, and look at the page signed in, not only built.
- **Only a two-account run finds the seated-player UI.** The phone stage's bar overflowed (8 buttons, Speaker at
  357–401 px on a 360 px screen) and the voice note sat bare over the board; renders signed out never reach either.
  Two origins of one dev server (`localhost` and `127.0.0.1`) keep two accounts apart in one Chrome; the test password
  goes through a temporary served file, fetched in the page and deleted at once, never through a command line.
- **The automation Chrome is shared with other sessions.** Tab indexes shift and another session may drive a tab you
  opened. Open your own tab, pass `tab_index` on every call after `list_tabs`, and start every `eval` with an origin
  guard (`if (location.host !== '<yours>') return 'WRONG TAB'`); it stopped two writes into another project's tab.
- **A hidden tab is an offline player.** The heartbeat runs only while the tab is visible, so the 2-minute rule
  forfeits a background account: drive one player in the visible tab and the other through API calls.
- **jsdom suites time out under host load 15–20.** Seven of 1,236 tests failed as timeouts only; re-run those files
  serially (`vitest run --no-file-parallelism <files>`) before calling anything a FAIL, and record both numbers.
- **Registry probes must match the project's own quoting.** AND-007's probe looked for `dir("outputs/apk")` and missed
  `dir('outputs/apk')`; the registry pattern now accepts both quotes.
- **A blanket "I APPROVE ALL" is not an owner-typed exception.** It approves the run's recommendations and actions;
  an exception still needs his own words naming the thing and what is excused (TASK-011 stayed open).

## 34. Lessons from zaions.com run 4 (2026-11-10) — `/complete-project`, the app view found half-drawn, Pages-only hosting

- 🔴 **Grep the dummy for an app-view layer before drawing one.** zaions' dummy already held `appview.css`/`appview.js`
  (drawn 2026-10-28, swept into a wip checkpoint, never recorded or approved). Record it as an amendment and audit it
  against the parity rule: it hid the web's only menu, so footer-only places (About, Blog, Contact, legal) were more
  than two taps away. Keep Menu last in the app bar and add the footer's groups to the same sheet in the app view.
- **Port an injected-DOM dummy layer as React pieces plus a tiny post-hydration runtime.** Tabs, the thumb CTA, the
  footer disclosure and the menu groups render from React; only the snap-row dots are inserted beside rows after
  hydration (attributes on React's nodes, own nodes removed on teardown). A byte-parity test pins `appview.css`.
- **A no-worker site with an install manifest still owes layer 1 on the web.** Ship a cache-free takeover worker at the
  old worker's address (it also retires vite-plugin-pwa caches), stamp the entry chunk into it at build, and prove it
  locally: a tab opened on build A, the server switched to build B, one in-app page change, then the next one loads B.
- **CSP on Cloudflare Pages: fill the inline-script hashes and frame hosts at build time** into `dist/_headers` and
  fail the build on a missing marker or a line over 2,000 characters (Pages drops it silently). Prove with
  `wrangler pages dev dist`: zero console errors across key routes at 1440 and 390 before the deploy.
- **`includeSubDomains` needs every subdomain on HTTPS first:** probe each zone record; six zaions hosts failed TLS,
  so it became an owner row instead of a header change that would lock browsers out.
- **`pkill -f <pattern>` inside a Bash call kills that call** (the pattern is in its own command line): exit 144.
  Kill by the PID you saved, or by the listening port's owner.
- **The shared automation Chrome serves other sessions' tabs, and `close_tab` acted on an index, not the id given:**
  it closed another session's tab. Launch your own Chrome for Testing on a free port with your own profile and drive it
  over CDP; never use the shared MCP browser while another session is live.
- **A store image may show no other company's trademark, and blog titles name tools** (Bubble.io, React): swap that
  shot for a page whose words are your own (zaions: `/compare`), and scroll each capture past the hero so the
  approved headline is not repeated by the page H1 inside the phone.
- **An approved content rule can make a search fix a no-op.** The hosted-document head strips the description for
  bare documents by design (machine.md §8.4, AD-07): read the whole function before "fixing" SA-P13, and turn a
  client document's change into an owner row.
- **Old "accepted exception" records are reopened, not carried:** run 1 recorded DB-backed slugs answering 200 as
  accepted; on Pages they are real 404s now, and the opposite trade-off (a new post 404s until the next deploy) is a
  finding with a next step.

## 34. Lessons from WindowSweep run 2026-11-10-0028 (2026-11-12)

- A readiness total can include a waiver: inspect each item. FilesHub showed 12/12 with Polar waived; actual linkage stayed an owner step.
- Ship a fresh desktop patch for a reproduced layout correction; never replace the already-published release assets. Prove the installed update with app, engine, executable and uninstall versions.
- Long plan forms need actions outside the scrolling body, with explicit form association. Verify New/Edit, invalid submit, pending/result feedback and focus without saving production plan changes.
- Verification HTML is code evidence, not Webmaster ownership. Count the served meta, then retain the owner Verify task; IndexNow acceptance is submission only.
- A performance result needs the required browser flags and a comparable host. A green render or an uncontrolled long-task observation cannot close a controlled TBT finding.

Evidence: WindowSweep run record and site-evidence/release-1.4.7/{layout-corrections,patch148-live,patch148-final-crawl}.json.

### WindowSweep performance follow-up, 2026-11-13

- Profile layout before changing the chunk graph: repeated full-document layout dominated this long Home page. Home-only content-visibility:auto reduced paired blocking medians998→95ms without removing content or analytics. Keep the hero eager, restore ordinary layout for print, and verify anchors, keyboard and phone app composition.
- A lazy CDP AX snapshot can prune off-screen content. Native renderer accessibility mode exposed all36 headings, equal to the visible-layout control; remove that forced mode before timing runs. This is not a screen-reader journey.
- A local IPv6 TLS reset is not a product speed result. A temporary browser-only IPv4 resolver mapping preserved HTTPS checks and made this run possible. Record the transport and removal trigger; never alter OS DNS to obtain a passing measurement.
- Keep all three final measurements and maxima, even when the saved gate uses medians. Warmup or incomplete navigations are excluded with the reason, not silently counted.

## 35. Lessons from linux-cleanup run 2 (2026-11-14) — a CLI whose release record lives on `main`

- **A release record read from the repo's default branch is live the moment that branch is pushed.** linux-cleanup
  copies read `release/stable.env` from GitHub `main`; an unpushed 2.1.0 commit had already bumped it while npm still
  served 2.0.0. Pushing it as a "checkpoint" would have told every 2.0.0 user an update was required and blocked them
  at the next start, with an update that reinstalls 2.0.0. Before any checkpoint push, `git diff o/main..HEAD --
  release/` (or wherever the record lives); a record change waits on a `wip/` branch until the publish succeeds.
- **Check a docs repo's Pages source before pushing `main`.** `gh api repos/<r>/pages` showed `source: main /`, so a
  push publishes the raw Docusaurus tree; held words go to a `wip/` branch and the publish goes to a built `gh-pages`.
- **The automation browser's active tab is shared with other sessions and can move under you.** An `eval` landed in
  another session's Polar sandbox tab. Open your own tab, then `switch_tab` by your URL before each action and start
  every eval with `if (location.host !== '<yours>') return 'WRONG TAB'`.
- **Prove a CSP before shipping it:** serve `dist/` with `wrangler pages dev` (it applies `_headers`), plant an inline
  `<script>` and a `style` attribute and see both reported as violations, then hash-check every page's inline script
  against the policy. Generate the hash in the build from the built shell so it cannot drift. Wrangler survives a
  task stop: kill the PIDs you launched.

## 36. Lessons from ZTools run 2026-11-16 — `/complete-project` when the owner says a backend is live

- **"It's live, finish that part" means: verify from outside, then from the product, then close every tracker row.**
  Outside: the refusal probes (key, origin, identity, session, rate window) take one curl each. Inside: every tool that
  depends on the backend, run end to end as the plain alias at 1440 and spot-checked at 390. Then flip the product's and
  the backend's trackers together and tick the owner's "deploy it" row with the evidence.
- **Check which plan family owns a feature before asking about tiers.** ZTools has two families (ZTools Pro, core;
  Growth Suite, `plans`). The first question offered the Growth plan keys for a core feature and had to be re-asked the
  same session. Read `billing_product_map.family` (or the project's equivalent) first.
- **An idle callback without a timeout is a hidden dependency on painting.** `requestIdleCallback(cb)` never fires in a
  window the browser is not painting (behind other windows): ZTools sat on its full-page loader for over two minutes and
  its update worker never started, while the main thread was idle. Signed-out fresh windows hid it. Probe: in the tab,
  `requestAnimationFrame` within 2 s; if it does not fire, idle callbacks will not either. Fix: `{ timeout }` on every
  deferred start-up callback.
- **Layer 1 proof needs the page to find the new worker by itself.** A manual `registration.update()` proves the
  takeover, not the discovery. Keep one tab on the old build across the deploy and use only ordinary navigation.
- **The shared automation browser is shared.** Another session navigated this run's tab mid-check. Launch your own
  instance of `$CHROME_WS_BROWSER` on your own port and scratch profile, with the plugin's flags (`--no-sandbox` is
  required on this Ubuntu: AppArmor blocks user namespaces). Turnstile refuses headless Chrome, so run it headed.
- **Auth hooks: confirm with a GET, never from the PATCH reply.** On the Management API a PATCH sending
  `hook_custom_access_token_enabled: false` together with an empty URI was silently not applied; `enabled: false` alone
  worked. Prove a token hook on the shared TEST project first, including a broken lookup (the token must still issue).

## 21. Lessons from Rent Party run 3 (2026-10-28) — a single-project backend, a coach under its own dialog

- 🔴 **Polar sandbox proof on a backend that serves dev and prod from ONE project** (Rent Party): there is no separate
  environment, so the proof is a **short window**, asked as an owner question first. Before switching, write the four
  production values (`POLAR_ACCESS_TOKEN`, `POLAR_SERVER`, `POLAR_PRODUCTS`, `POLAR_WEBHOOK_SECRET`) to `~/.secrets/polar-<slug>/`
  and prove each one's sha256 equals the digest `supabase secrets list -o json` shows; only then set the sandbox values, run
  checkout → `order.paid` → granted → refund by API → `order.refunded` → returned (+ an unsigned 403), set production back and
  compare the digests again, then open one live checkout page (no payment). The window took under 3 minutes. The production
  `POLAR_PRODUCTS` held a third key (`coins`) no doc listed: rebuild it from `GET /v1/products` on the production token.
- **The vault's `general` reveal nests values at `data.services.general.values`.** A flat lookup finds nothing and reads like a
  missing secret.
- **Polar's API refuses Python's urllib user agent with a non-JSON error page**; `curl` with the same token works.
- 🔴 **A guided coach can be dead by touch while every desktop check passes.** Two causes on one page: a `position: fixed`
  ring rendered *inside* a container whose children get `pointer-events: auto` took every tap (render it on `<body>`, as the
  dummy did), and the scene's own dialog (`z-index` 5) covered the coach card at its buy/auction steps (raise the card, dummy
  first). The probe that finds both: at 390 with touch, `document.elementFromPoint` at the centre of Next, every step; then
  press it by coordinates (`Input.dispatchMouseEvent`), never `.click()`, which goes through anything.
- **Check a deploy in a fresh browser profile as well as a used one.** A profile whose Cache Storage was cleared by hand while
  its service worker stayed registered fails every non-home navigation (`net::ERR_FAILED`; Workbox's
  `createHandlerBoundToURL` throws on a missing precache entry). It is a test artefact until proven otherwise, but it names a
  robustness gap worth a finding: fall back to the network when the shell is missing. Never clear caches in the profile you
  verify with.
- **The docs row goes stale with every user-visible decision, not only big features.** At the start of a run, list the
  `D-` numbers since the docs' last commit and give each new behaviour a page (Rent Party: replays for every game, D-205).
- **The store set's freshness is per string.** Grep each framed capture's visible strings in the current catalogue: a
  changed menu label (*Replay the tour* → *How the game screen works*) makes one shot stale while seven stay current; recapture
  only that one at the other captures' viewport so the scale matches.

## 22. Lessons from aoneahsan.com run 4 (2026-10-28)

- 🔴 **A previous audit can score the phone app view without one existing.** The 10-26 audit gave the primary row
  15 with no app-view layer in the dummy or the app (`grep -rliE 'app-?view|bottom-?bar|tabbar'` → nothing). Grep for
  the layer and look at 390 touch before keeping the row; a responsive website is not an app view.
- 🔴 **Read a vendored font's `name` and `post` tables.** The site shipped Public Sans **Thin Italic** for three months
  (italicAngle −8, so every body line was slanted) while its README said roman; a woff2 magic-number check passed.
  `fontTools`: `name` id 4 and `post.italicAngle` for every face, dummy and app.
- **A `/**` rewrite is needed only above a dynamic segment.** `/auth/**` (only `/auth/callback` below) and `/admin/**`
  (static pages only) both answered 200 for any path. List static families exactly and test: a `/**` source must have a
  `$param` route below it (watched failing on `/admin/**`).
- **Hiding catalogue rows (`is_active = false`) breaks vacuity floors and the frozen URL contract.** Lower each floor
  with its reason, and record the retired URLs in a file the contract test reads (retired = must 404, and a retired URL
  still served fails), never by loosening the contract for everything.
- **A paid AI fallback the privacy policy does not name goes OFF at once** (unset the model secret; the broker then
  pauses), and back on only after the GATE 4 line is live.
- 🔴 **Sub-agents of one session share its scratchpad**: one killed another's Chrome through a shared `chrome.pid`.
  Give each agent `<scratchpad>/<agent>/` and its own CDP port in the brief. A session restart gives a NEW scratchpad, so
  a stopped agent's half-made work is gone; brief agents to write finished deliverables into scope as they go.
- **A pooler DNS flake fails `psql` silently inside `comm`**: the "difference" printed every version. Check
  `getent hosts <pooler>` and the psql exit before reading a ledger comparison.
- **A FilesHub sequence can be active with nobody to mail**: the list had 1 contact, 0 confirmed. `auto_enroll_new_contacts:
  true` makes each confirmed subscriber receive it; score the email row on the running sequence and say plainly that
  no one has been mailed.
- 🔴 **Prove self-delete with an account that OWNS FILES.** Three live deletions passed with empty accounts; the first one
  holding a stored file answered 500, because the disposal queue gave `service_role` no INSERT (only a trigger wrote it).
  Seed a voice note or file on the throwaway account before calling deletion proven.
- **`drizzle-kit generate --custom` snapshots the PREVIOUS schema**, so a schema edit made with it shows up as a pending
  migration. Copy the next generated snapshot into the custom one (keeping its `id`/`prevId`), drop the duplicate, and
  re-run `generate` until it says no changes.
- **FilesHub `erase` is FilesHub-wide** — a project-scoped token can wipe the person from every product's lists. For
  "remove from this product's newsletter" use project `unsubscribe`.
- **A button inside a closed `<details>` can keep a layout box** (the card's CSS sets its display), so a focus cycle built on
  `getClientRects()` stalls on it; also require `closest('details:not([open])') === null` (summary excepted).
- **Agents that share one Drizzle journal must not create migration files in parallel.** Have each write its SQL as a draft
  in its own scratch folder; the main session generates, rehearses and applies them in order.

## 23. Lessons from Empora run 2 (2026-10-28)

- 🔴 **A row earned last run can fall to a live defect the next day.** The sitemap row (scored on 10-27) was 0 on
  10-28: every prerendered page answered **301 to a trailing slash** (§15's trap, missed on a WordPress-plugin
  project), and the docs row went stale within hours of a home-page change. Curl every `<loc>` without `-L` and
  compare the docs' last commit with the product's last user-visible commit at the start of every run.
- 🔴 **A security header can switch a product feature off.** `Permissions-Policy: microphone=()` on `**` denied the
  microphone to the Speak feature being built that same run. Grep the hosting headers for every browser capability a
  new feature uses (microphone, camera, clipboard, payment) before calling it done.
- **A FilesHub sequence PATCH that touches `steps` re-creates them and clears `approved_at`**: approve LAST. Order:
  fix the step (`is_final`), send a fresh `[TEST]` (`POST …/steps/{key}/test`), approve, `settings enabled`,
  `/check`, assign a pool batch (dry run, then `"dry_run": false`), activate.
- **Interpolation in this fleet's `t()` sits under `values`** (`t(key, { values: { … } })`); a bare object is a TS
  error, not a runtime one. Copy the call shape from a sibling component.
- **A signed-in page can be render-checked before the deploy with the API mocked over CDP `Fetch`**: seed the
  storage envelope (`aiowc:<key>` → `{value, created, updated}`) with `Page.addScriptToEvaluateOnNewDocument`, and
  answer the CORS preflight (`OPTIONS` 204 + `Allow-Headers`/`Methods`), or every call reads as a network error.
- **Release archives stop reproducing when a shared package changes**, even with no plugin edit: rebuild from a
  clean worktree (packages first, `turbo run build --filter='./packages/*'`), compare with the approved hashes, and
  re-run the clean-install acceptance before asking the owner about new ones.
- **The hosting-budget gate reads `release` / `dist` in a compound command as a deploy**: create the worktree in one
  command and build in another, with literal paths.

## 24. Lessons from ClearHire run 4 (2026-10-28) — the app view built in one run, and grant fixes that break readers

- 🔴 **Before pushing a column revoke, grep every reader of that column, invoker-rights SQL functions included.**
  ClearHire's approved `revoke select (headline, location) … from authenticated` would have refused `talent_search`
  (a `security invoker` function) for every company user, while every gate stayed green. The fix-wave writer found it
  by grepping `supabase/migrations/` for the column names, not only `src/`. Re-ask the owner with the narrowed change
  (anon only) rather than shipping the approved one.
- 🔴 **A `select('*')` breaks the moment a role holds column grants instead of a table grant.** Narrowing anon on
  `employment_links` turned two public reads (`usePersonLinks`, `lookupRecord`) into 42501. Name the columns in every
  public read in the same change, and check the approved public pages (here `/id-lookup`) against the new column set
  before asking: the owner's "company, title, dates" answer conflicted with a page that prints the confirmer.
- **A column revoke over a TABLE-level grant changes nothing.** `anon` held table SELECT on `employment_links`: revoke
  the table grant, then grant back the column list. Rehearse it in `BEGIN…ROLLBACK` with a refused column read as the
  discriminating line.
- **FilesHub `/email-sequences/{seq}/enroll` ignores `"dry_run": true`** (2026-10-28): the dry run enrolled 964 for
  real. Activating a sequence does not enrol its list; `{"all": true}` does. Only send `enroll` when you mean it, and
  read the sequence stats after.
- **A docs `createSitemapItems` guard that throws on an undated URL also catches an uncommitted page.** The git date
  does not exist until the commit, so commit the docs repo before the build that verifies them, and push only after the
  render check (the push is the deploy).
- **A lane's count can be an instrument bug:** `grep -c '<lastmod>' sitemap.xml` counts lines, and Docusaurus writes
  the sitemap on one line. Use `grep -o … | wc -l` before believing "1 of 26".
- **A heredoc redaction of a secrets file can print the secret.** A `sed` that masks by pattern missed a line and
  printed the shared test password (no rotation is owed for a transcript, OD-103). Read the one line into a variable
  and never display the file, even "redacted".
- **The phone app view fits in one finalization run** with one heavy writer: dummy first (pre-paint snippet, chrome,
  tab bar, sheet, five screens, a review page in `reviewPages`), then the app, with a byte-for-byte parity test. First
  load grew 2.1 kB. Afterwards, put the head snippet on every other dummy page too, or those pages switch after paint.

## 24. Lessons from Empora run 3 (2026-10-29) — four agents on one dashboard, a live non-admin session on a cookie app

- **Split a whole-product parity build by FILE, with the shell first.** Wave 1 (one agent) built the app-view shell and
  the dummy's shared ornaments and reported their API; wave 2 ran two page agents on disjoint route/component sets plus
  one on the theme sheet and tours; the catalogue (`en.ts`) had ONE writer (the main session added every approved
  word and the parity test before any agent started). No agent ran a build into the shared `dist`: each built into its
  own scratch `--outDir`. Zero merge conflicts across four writers.
- 🔴 **An eagerly loaded stylesheet that declares `@layer components` can land before Tailwind's reset** and unstyle the
  whole app on a real build, while every per-page check against a dev server looks right. Start every layered sheet
  with `@layer theme, base, components, utilities;`.
- **A web app on a Sanctum cookie session gets a live non-admin session without UI:** call the secret-gated test route
  with curl as a stateful SPA request (`Origin`/`Referer` of the site + XSRF, cookie jar), then `Network.setCookies`
  into a fresh browser context plus the cached user summary the route guard reads. The test header is deliberately not
  in CORS, so an in-page fetch cannot do it. Refresh the summary before checking per-account one-time hints, or a stale
  seed re-shows them.
- **A $0 production pilot through Polar:** a one-use, product-restricted 100 % `forever` discount, applied with the
  checkout client API (`PATCH …/checkouts/client/{secret}` `discount_code` + billing country, then `/confirm`); no card is
  required at $0; the webhook grants; `DELETE /v1/subscriptions/{id}` and delete the discount straight after.
- **Turborepo replays a cached build without touching `dist`'s mtimes**, so the deploy-verify gate refuses a deploy after
  any tracked file (store PNGs included) changed later. Rebuild with `--force` before the stamp.
- **Yarn 1 cannot link a second copy of a package nested under a dependent** ("could not find a copy of vite to link
  in …/vitest/node_modules"). The durable fix is ONE lock entry serving both ranges: delete the stale entry and
  reinstall, never a `resolutions` override. Do the same to relock a vulnerable transitive whose range already allows
  the patch (seroval, re2js).
- **A dependency bump inside a shared package changes the plugin archives' bytes**: re-run the clean-install acceptance
  before asking the owner to approve hashes, and build the archives in a FRESH worktree (a partly-failed first build in
  the same worktree gave a pair that no clean build reproduced).
- **The owner's server steps go in the backend's deploy notes** (Empora D-147): his server Claude session follows them;
  the agent only asks him to deploy. A curl that "proves" a route can be a false negative — the server session corrected
  ours (a test route answers 404 to a caller without the secret by design).

## 25. Lessons from ClearHire run 5 (2026-10-29) — a waived row, and a phone sweep after the deploy

- **A row no provider can serve is waived by the owner, never left at 0 or faked.** ClearHire's payments row had no
  provider that accepts a job-board product (Polar: category; Dodo: currency; Paddle: AUP "job boards"). The owner's
  answer *"Waive it, build plan requests"* counts the 10 points as **waived** with the OD beside them, in the audit file,
  the `SCORECARD.md` cell and a `"waived"` array in `scorecard.json`. The product still gets a real path to a paid
  plan (a request filed into the admin queue, one pending per person by a partial unique index), proven live as a
  non-admin. The waiver names its end condition (a provider that accepts the product).
- **Sweep every sitemap URL at 390 with touch AFTER the deploy, and test the unlisted share pages too.** All 122
  listed URLs fit, but `/r/<slug>` (not in the sitemap) widened to 473 px: a `flex-wrap` row whose text child was
  `min-w-0 flex-1` with no basis, so it shrank to one word per line instead of wrapping. The dummy had the same
  markup. Fix: give the text child a basis (`basis-64`). Measure `innerWidth` after load under `mobile: true`
  emulation; it grows past the device width exactly when something overflows, which `scrollWidth` alone misses.
- **Read the live grants before trusting a migration's comment.** The plan-request migration said the insert grant
  "was missing"; the catalog showed the baseline had granted it (plus `payment_ref`) all along, so the real change was
  the unique index. The new live-only grant test was written against the comment and would have gone red.
- **Scope a JSON row edit to its own object.** `"status": "owner chain", "completeOn": null` appears in more than one
  row of `scorecard.json`; a whole-file replace with a count check refused, as it should. Slice the project's object
  first.
- **A sitemap guard that refuses undated URLs also refuses the tag pages a first `tags:` front-matter creates.** On a
  docs site with no tags yet, adding tags to one page adds `/tags` and `/tags/*` listings with no date; drop the tags or
  date the listings.

## 26. Lessons from Empora run 5 (2026-10-29) — the first `/complete-project`, a content batch closed without new prose

- **A crawler-body "content batch" can close with no new words.** Build each prerendered page's record from the catalogue
  lines its route already renders (sentences, `feature*` bullets, `…Q`/`…A` pairs), and hold every key to the source with
  a contract test (`'<key>'` must appear in non-catalogue source). Empora went 1/86 → 56/86 pages; the test also found a
  catalogue line no page rendered (deleted, not excluded). Ask the owner once ("reuse approved words") instead of
  scheduling a ~1000-words-per-page batch.
- **Enriching crawler words moves the page's truthful date.** A words-fingerprint ledger re-dates every enriched URL; plan
  for one `lastmod` change per page and send IndexNow for exactly those URLs after the live check.
- **Draft GATE 4 words against the code before asking, then cut — never reword — a step the code contradicts.** The
  drafted "a badge for each milestone" was wrong (a badge per friend); the approval said "cut", so the step went.
- **Mid-tour captures lie.** On a scrolled page a Driver.js tour's ring animates between targets and the plugin's
  screenshot can show a white band; settle ≥ 1.5 s and compare `.tour-ring` with `.driver-active-element` rects, or take a
  raw `Page.captureScreenshot` without `clip` (a clip resizes the window and flips a phone app view to the web view).
- **"Re-measure on a quiet host" is answered by the LCP phase breakdown, not by waiting.** Empora's 6.2 s LCP was ~4.5 s
  render delay behind ~570 KiB of JS: code, not load. Record the cause and the fix shape instead of deferring again.

## 27. Lessons from ClearHire run 6 (2026-10-29) — `/complete-project` on a project already at 100

- **A complete project still had a search defect the scorecard could not see.** 27 public routes left out of the sitemap
  (`indexed: false`) answered 200 with the bare SPA shell and no robots signal. "Not in the sitemap" is not a directive.
  The fix is one signal per route from the HOST, so a crawler needs no JS: `X-Robots-Tag: noindex` for utility pages and
  `Link: <twin>; rel="canonical"` for aliases. Pin it with a contract test against the registry and the BUILT sitemap
  (database-driven URLs are not registry routes). Never `Disallow` as well.
- **A fleet rule that lands mid-run can decide an owner row recorded "decide later".** Read new rule text when the harness
  shows a change. ClearHire's F-SEC-008 (email sign-up) became the Google-only hook the same day. The project's production
  gate still applies, so ask once for the exact actions (migration + Auth config PATCH), then prove all three facts live:
  stranger refused, `t1+` password grant 200, Google untouched.
- **Never re-dump a shared record JSON.** `json.dump` of `scorecard.json` re-wrapped another project's inline array. Edit
  your own row as text (or check that a dump of HEAD reproduces HEAD byte for byte before using one).
- **Count from the registry, not from your probe list.** The first probe of unsubmitted routes listed 22 by hand; the
  registry held 27. The fix and test used the registry, but four records first said 22. Derive any count you write.
- **An empty PENDING-TASKS.md is a known false positive for the context gate**, and deleting it is wrong: the file
  holds fleet idempotency markers, and without them the next fleet pass re-appends closed work. Record it in the context
  tracker note and move on.

## 26. Lessons from HabitForge run 4 (2026-10-29) — the first merged `/complete-project` run on a project at 100

- 🔴 **A project already at 100 still had five live false claims.** The docs site said "not on Google Play" in eleven
  places for four days after the owner confirmed production (OD-170), because the claim switch (`PLAY_LISTING_LIVE`)
  was never flipped. When a store or payment fact changes, flip the project's claim switch the same day and let its
  gate name the surfaces. A gate that scans only Markdown misses a docs home-page component: the docs' built-output
  gate caught `src/components/HomepageFeatures` that the app-side source gate could not see.
- 🔴 **The shared `use_browser` MCP drifts between parallel sessions.** Its "active tab" moved to another session's
  tab mid-run and a navigate landed there. For render checks launch your OWN headless Chrome (`$CHROME_WS_BROWSER
  --headless=new --remote-debugging-port=<free> --user-data-dir=<mktemp>`; on Ubuntu 24 add `--no-sandbox`, or it dies
  "No usable sandbox"), drive it over CDP, and kill it by its port when done. A background target in the shared
  browser throttles `Page.captureScreenshot` to minutes per shot.
- **Remove files by literal path.** `rm -rf "$(cat file)"` is refused by Claude Code's safety check; print the path,
  then remove it.
- **A lane that reads focus right after opening a lazy dialog reports a false "focus not moved".** Wait for the chunk
  and the dialog, then read `document.activeElement` (theme panel and account menu passed on a second read; the tour
  card truly failed: driver.js moves focus to its own hidden popover — take it back in `onHighlighted`).
- **Firebase `/section/**` rewrites are soft 404s for every unknown child.** List one rewrite per real route
  (`/habits/new`, `/habits/*/edit`, …) and assert in the hosting test that `/habits/zz/zz` is not served.
- **A second deploy in a session that approved one:** the owner's later "finish everything, don't ask" is the
  approval; record it as its own decision (OD-188) rather than stretching the first.

## 28. Lessons from LabFlow run 3 (2026-10-29/30) — `/complete-project` on a project already at 100, dev IS prod

- **A 100 can rest on an SEO row whose evidence checked the wrong thing.** LabFlow's 10-26 row proved a real 404 and the
  sitemap pair; it never compared each page's canonical with its sitemap `<loc>`. Every Group B page named the bare path that
  Hosting 301s. Run the search-audit `canon-sweep` (canonical == `<loc>`, answers 200) before re-scoring the SEO row.
- **On a single dev-and-prod Supabase project, every seeded fixture that is PUBLISHED, LISTED or COUNTED is public.**
  LabFlow's drive fixtures (two "laboratories") sat in the live directory and in real labs' peer benchmarks for seven weeks.
  Keep the drives' premise and hide them by flag: `automation_fixture` + an `is_automation_caller()` check on the caller's
  JWT email, in every policy and definer function that reads the published set. Prove both sides live (anon 2 → 0, the
  automation alias still sees them).
- **The Google-only sign-up hook does not run for admin-API creation** (observed live): an invite path that creates email
  users keeps working without an exemption; probe the stranger case through the public `/auth/v1/signup`.
- **A failed `git add` of an already-staged path aborts the whole add**, and the commit then holds only what was staged
  before. Read `git show --stat HEAD` after every commit; never amend or force-push a pushed one — commit the rest and say so.
- **The approved dummy can carry designer rationale into the product** (LabFlow: ~100 strings with a 🔴 marker, visible
  to staff). Sweep `grep -rn '🔴' src/content` on every run; it is an owner-gated dummy pass (GATE 4 diff), never a quiet edit.
- **Store captures from fixture data show fixture names** ("Automation Beta"). Seed a store-capture laboratory with natural
  fictional names, flagged like the other fixtures, before framing; never edit a capture.
- **This machine's stub resolver can SERVFAIL for one host while the site is fine** — verify with `dig @8.8.8.8`, then pin
  (`curl --resolve`, Chrome `--host-resolver-rules`) and record that the live check was pinned.

## 28. Lessons from Native Update run 2 (2026-10-30) — `/complete-project` on a SaaS + package, prerender + hydrate on React Router

- **Prerender + hydrate on React Router 7 (data router) without a framework:** split the route tree (`routes.tsx`) from
  `createBrowserRouter`; render each public route at build with `createStaticHandler` + `StaticRouterProvider` inside the
  same providers, through React 19 `prerenderToNodeStream` **with `progressiveChunkSize: Infinity`** (otherwise large
  Suspense boundaries are outlined behind an inline `$RC` script and cannot hydrate in place). Pages load through the route
  `lazy` property, and the browser hydrates after `router.state.initialized`. 🔴 `React.lazy` pages in `<Suspense>` were
  discarded and client-rendered silently — no warning even in a development build. Prove hydration by tagging the
  prerendered `<h1>` before boot and checking it is the SAME node afterwards; a green build and a clean console are not proof.
- **Hydrate only the state the HTML was rendered in:** read the session token synchronously on the web; a signed-out
  visitor hydrates, a signed-in one renders fresh. Storage reads must return the default when there is no `window`
  (one guarded helper pair), or strata logs on every build.
- 🔴 **A rewrite to `/index.html` serves the PRERENDERED HOME** once the home is prerendered: every private route answered
  `index, follow` with the home canonical. Rewrite private families to a noindex `app-shell.html` and add `X-Robots-Tag`.
  The template `index.html` carries no page metadata at all (a hand-written JSON-LD there was copied onto every page).
- **LCP after prerendering:** an element that enters from opacity 0 is recorded at its first visible frame, which hydration
  delays (home median 2.9 s → 0.81 s, live A/B). Also fetch the app's scripts at low priority and the fonts at high priority
  on prerendered pages. Measure five runs and read the median; one run is noise under host load.
- **Store captures:** disable the browser cache in the capture driver (a shot showed the pre-fix bundle), capture the
  sign-in page SIGNED OUT (signed in it shows the account email), wait for the page's own `main h1` and the absence of
  skeleton classes, and seed the test account with real data through the product's own APIs (an app, releases, a key,
  device reports) rather than framing empty states. The capture itself found a defect ("277 byte").
- **The finalization record repo is shared, and run ids collide** (LabFlow used `2026-10-29-2229` too) and other sessions
  leave uncommitted hunks in `scorecard.json` / `SCORECARD.md`. Stage only your row: build the file from `HEAD` plus your
  edit and `git update-index --cacheinfo` it, so their working-tree changes stay theirs.
- **A fleet rule can land mid-run and reverse a project decision** (legal-notice analytics, 2026-10-30, against OD-023 of
  2026-10-27). It is one question, asked before the last deploy so both ship together.


## 29. Lessons from Rent Party run 4 (2026-10-30) — `/complete-project` the day three fleet laws landed

- 🔴 **A build flag typed on the command line is a deploy trap.** Every live City Editions build ran
  `VITE_CITY_EDITIONS_ON=true yarn …`, and the tracked `.env` never had it: a clean-worktree build from the repo shipped
  the shop with 3 tabs instead of 13, while every gate stayed green. Before each deploy, compare the preview of the clean
  build with the live site on the feature surfaces (here: the shop's tab count). The fix is the flag in the tracked `.env`
  (private repo) and its vault backup read back equal, never another inline variable.
- **The "no exceptions" law reopens every PROFILE "Accepted exceptions" row the same day.** Classify each against the
  law's actual text before calling it a finding: a stale record (Rent Party's "precaching" worker was already
  network-only), a decision inside the law (a Monopoly mention kept out of store metadata), a conforming default (no paid
  AI fallback = pause), or a real deviation (own push instead of OneSignal: a question with compliant options only).
- **The legal-notice analytics law removes a whole surface, not a sentence:** the footer panel, every switch (Settings,
  Privacy page), the consent store and its load gate, the parity tests that pinned them, the Privacy page's opt-in
  paragraph (its date moves, and a word-fingerprint ledger then needs the post-date fingerprint), the docs line that
  described the switch, and the Data safety rows that analytics alone collect (Optional → Required, an owner row).
- **A skill added to the brain repo the same day may not be linked on this machine yet** (`android-release-health` was
  only under `custom-skills/`): read it from the source path and say so; the next `/sync-all` links it.
- **"Approved words only" docs pages:** headings may reuse approved labels; every body sentence is copied verbatim. Re-read
  the rendered page for a connective sentence slipped in while assembling it (one was, and was cut before the push).

## 25. Lessons from Strata Storage run 1 (2026-10-30, Package category, first of its kind)

- 🔴 **`git add a b missing-path` stages NOTHING when one pathspec is missing**, so the commit that follows carries only
  what was staged before (here a `git mv`/`git rm`), and a push ships a broken tree. Read `git status --short` after
  every `git add` and before the commit: no ` M`/`??` line may remain for a file you meant to ship. The repair is a
  follow-up commit (never a force-push); a tag you pushed on the broken commit is deleted and re-cut on the good one.
- **On GitHub Pages the live bundle hash never equals a local build's**: Docusaurus `createData` module ids embed the
  build machine's absolute path. Prove the deploy with the Pages run's commit = HEAD and a bundle diff showing only that path.
- **A package's update flow** is deprecate-a-bad-release + migration notes + the release newsletter; its website and docs
  site still owe layer 1 and layer 2 (`aoneahsan-cccs-update-flow/references/package.md`). Layer 2 needs a backend, so a
  package with no Supabase project is owner-blocked on gate 4 until one exists.
- **`aoneahsan-cccs-android-release-health` was not installed on linux-ahsan at the start of the run** although
  `/complete-project` names it (a later sync the same day installed it); the probe intent ran through `-android-finalization`.
  Run `/sync-all` (or `setup-machine`) before a finalization that needs it.


## 30. Lessons from Trizlink run 5 (2026-10-30/31) — `/complete-project` on a project at 100, four laws landing mid-run

- **A wave found built but uncommitted is checkpointed, merged and gated BEFORE its migration is applied.** Trizlink's
  2026-10-28 audit wave sat in 24 files with an unapplied migration while upstream moved to 2.17.0. Order: commit it as a
  checkpoint, fetch + merge (never stash), full gate, rehearse the migration in `BEGIN … ROLLBACK`, then `db push`.
- 🔴 **An "accepted" record without the owner's caps-typed exception is reopened, not honoured.** Two such lines in the decision
  log (open email sign-up, 1-hour tokens) became the Google-only `before_user_created` hook and `jwt_exp` 600 in this run.
- 🔴 **Before deploying any Supabase function, compare its live `verify_jwt` with `config.toml`.** `webhooks-deliver` ran with the
  gateway check off but had no config entry; a plain deploy would have switched it on and refused every delivery.
- 🔴 **Revoking new-object defaults needs the GLOBAL `PUBLIC` revoke for functions.** Postgres grants EXECUTE to PUBLIC by
  built-in default; a per-schema `alter default privileges … revoke … from anon` changes nothing (rehearsal proved it).
- 🔴 **The update flow's lazy half must share no module with the entry chunk.** A lazily loaded service that imports the
  Supabase client or the error wrapper — or that dynamically imports an entry-resident module (`ota.ts`) — split those
  modules out of the entry (19 modules against a budget of 16). Load the gate after `load`, talk to entry modules through
  window events, read the public release view with `fetch`, and bisect in a clean worktree of the last green commit.
- 🔴 **Cloudflare Pages `_headers`: one block per path.** A second `/widget/*` block silently undid `! X-Frame-Options` and
  customer embeds were refused for ~15 minutes. Probe the detached header on the live host after every `_headers` change.
- **The zone's Browser Cache TTL overrides a Pages `Cache-Control` on the apex** (pages.dev kept `no-cache`); register the
  service worker with `updateViaCache: 'none'` rather than trusting the header.
- **Layer 2 verification recipe that worked:** a `VITE_RELEASE_CHANNEL=test` build on the registered port, the non-admin alias's
  session written into `sb-<ref>-auth-token`, releases published through the audited RPC as the superadmin actor via the
  Management API, `Network.setBlockedURLs` for the failed-read cases, and a final `0.0.0` test row. Web layer 1: one Node
  process holds an open tab, runs the build + deploy, then dispatches `visibilitychange` and an in-app page change.
- **Docs now deploy by hand** (owner 2026-10-31): `git worktree add --orphan -b gh-pages <workspace>/temp/<repo>-gh-pages`,
  copy the verified `build/`, commit,
  push the new branch, `PUT /pages build_type=legacy source gh-pages /`, `POST /pages/builds`. A fleet session may push your
  local docs commits for you when it sweeps workflows — check `git log o/main` before assuming a push is owed.

## 31. Lessons from macleanup run 2 (2026-11-02) — `/complete-project` resumed three days after the run stalled

- **Render every transactional email and probe every href and src in it.** All five primary buttons pointed at
  `<site>/app`, a page that never existed (the dummy's plain-text emails carried the same dead URL), and the logo
  URL 404'd because no `EMAIL_LOGO_URL` secret was set and the website never shipped the PNG. Source review and a
  green "email sent" status both passed. Render the composer under Node 26 with a `Deno` env shim, then `curl` each link.
- **An email the product sends must lead to a screen that acts on it.** The invite said "Accept the invite", the
  backend had `team.accept`, and no app screen called it; RLS also hid the team name from the invitee. Trace each
  email's call to action to a reachable UI before scoring email or plans.
- **When Chrome for Testing hangs on a Mac** (`CVDisplayLinkCreateWithCGDisplay failed`, no screenshot), a WKWebView
  snapshot compiled from a `swiftc` heredoc in the scratchpad renders real 390 and 1440 viewports. Use a
  non-persistent data store (a once-only legal bar otherwise vanishes on the second shot) and call
  `document.getAnimations().forEach(a => a.finish())` first, because an off-screen window never advances CSS
  entrance animations and the hero reads as blank.
- **No-Actions migration, docs:** after the first `gh-pages` push and the `legacy` source switch, the builds API stays
  404 while the site does publish; prove it by the live `last-modified` and a file only the new tree has
  (`/.nojekyll` 200), then by the bundle hash on the next content change.
- **`git add` with a path already removed by `git rm` aborts the whole add**, and the following commit carries only the
  deletion. Stage deletions and edits in separate calls, and read `git show --stat HEAD` after each commit.

## 25. Lessons from Empora run 6 (2026-11-06)

- 🔴 **Measure first-load JavaScript per module before calling LCP a redesign.** Empora's "critical path" problem was 637 KiB gzipped: observability SDKs in the entry chunk (500 KB raw), a manual chunk that took Vite's preload helper with it so background removal shipped on every page, and one `export` on a route component that stopped code splitting. A scratchpad `--config` wrapper dumping `chunk.modules` found all three in one build.
- **Vite 8 / Rolldown:** a `manualChunks` rule for a library loaded only through `import()` can capture `\0vite/preload-helper.js`, and every dynamic import then statically imports that library. Drop the rule. Grep the dist for who imports the chunk.
- **Static first paint:** a hero in `#root` needs two more things or it flashes: skip the boot loader when it exists, and `await router.load()` before the first render.
- **Lighthouse against `python -m http.server` is misleading:** no compression. Use a compressing server for before and after, on the same machine.
- **A cron-only host still meets the no-polling law:** broadcast through Supabase's REST endpoint; the publishable key is enough, so no secret lands on the host. Rate-limit the re-read, because that key is public.

## 32. Lessons from CallVault run 1 (2026-11-06): a Flutter, Play-excluded project

- 🔴 **A TEST lease lasts 3 hours and a long run outlives it.** Mine lapsed, the next session took the project without a wipe, and my Auth hook kept refusing its sign-ups. Wipe and release before leaving TEST idle, or take the lease only for the minutes it's needed.
- 🔴 **A new build-side APK prune deletes the owner's signed APK on the next debug build.** Hold it until after your last build, not only around the proof.
- **An Auth config PATCH takes a minute or two to reach the running service.** A probe right after it sent a real confirmation email through the old path. Wait, then probe.
- **Deploy a new CSP to a preview branch first.** It blocked Google's sign-in script here, and only a browser network check showed it.
- **An audit can falsify approved words:** "Nothing leaves" and "may train on free accounts" both failed once analytics landed. Grep promises before adding a processor.
- **`drizzle-kit pull` also loses regex backslashes and empty-string defaults, reorders unique columns and prints an overflowing identity bound.** A catalog diff in an isolated Postgres found all of it.
- **A Firebase `/:path*` redirect misses `/`.** Add `/` as its own rule.
- **FilesHub:** `can_manage_email_marketing` is a top-level key field, not in `permissions`; `email_template` is in `permissions`. Marketing templates exist only on the data plane.
- **Dummy screens carry prototype bars and demo buttons.** Crop to the product card for marketing images.

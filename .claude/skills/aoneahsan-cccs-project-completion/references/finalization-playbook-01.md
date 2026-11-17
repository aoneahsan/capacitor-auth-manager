# Finalization playbook — one project, one session (`/finalize-project`)

**Last Updated:** 2026-10-28 (§24, ClearHire run 4; §23, Empora run 2; §22, aoneahsan.com run 4; §21, Rent Party run 3; §20, zaions.com run 3; §19, Video Controls Plus run 2; §18, LifeWell re-audit: the store set and the launcher icon); 2026-10-26 (§13, zaions.com run 2; §12, LifeWell re-audit); 2026-10-25 (§10, HabitForge run 3; §6c, ClearHire run 3; §6a, LifeWell's close) · Written from the fleet pass of 2026-10-24 (HabitForge, LabFlow, ClearHire, AChat,
aoneahsan.com, zaions.com, Trizlink) — every rule below is a mistake already paid for once.

## 0. Where the state lives

| What | Where |
|---|---|
| The score, the gaps in point order, the run log | `~/Documents/01-code/projects-finalization-record/production/<project>.md` |
| The fleet table | same repo, `production/SCORECARD.md` + `scorecard.json` (2-space indent, keyed by project id) |
| The deep quality audit (security, a11y, performance, SEO/AEO, trust, competitors) and its findings | `/product-audit` → same repo, `product-audits/<project>/<run>/`; open P0/P1 findings are gaps here |
| Work held for the owner's GATE 4 | branch `wip/guided-tours` in the app repo + `wip/root-guided-tours` in the kit (`project-root`) |
| The owner-only chain | the app's `docs/MANUAL-TASKS.md` |
| Decisions | the kit's `DECISIONS-LOG.md` (next OD number) + `CLICK-DUMMY-APPROVAL.md` (an amendment per UI change) |

🔴 **Read the audit file's last run-log lines first.** A run that stopped mid-task writes its resume point there.

## 1. Scoring arithmetic

- Every row is full or zero, earned only with live evidence (`audit-procedure.md`).
- 🔴 **Held points count toward the score.** Web app: score = earned + 10 (the held extension). Four audits on
  2026-10-24 first forgot this and under-reported by 10; the heading reads "N / 100 (earned E + the held
  browser extension's reserved 10; iOS 0)".
- A row the owner waived in writing (aoneahsan.com docs site, OD-108) is counted and marked **waived** with the OD.
- Built-but-held work (tours on a wip branch) earns **0** until it is live.
- Update the audit file, `SCORECARD.md` and `scorecard.json` in the same commit. Edit only your own project's
  row; the repo is shared by parallel sessions, so fetch + merge before the push and resolve a conflict by keeping
  every other session's rows.

## 2. Quick wins every project had — check these first

| Gap | Fix that worked | Proof |
|---|---|---|
| **Soft 404** (`/nope-404-x` answers 200) on Firebase Hosting | replace the `**` rewrite with scoped globs of the router's first segments (`/@(a|b|…)` and `/@(a|b|…)/**`) and write `404.html` from the build (the shell with `noindex`, no canonical); a test parses the generated route tree / route registry and asserts every route is served and an unknown one is not, watched failing with one segment removed | live `curl` 404 after the deploy |
| **No `docs/database/SCHEMA.md`** | generate it from `npx drizzle-kit export` (offline): a module map, one Mermaid `erDiagram` per schema file with PKs, FKs and the owner column, RLS counts, an empty change log | tables/modules/RLS counts in the commit message |
| **Raw web storage** (a logger level, a consent flag) | through strata (`getSync/setSync`, `{ storage: 'localStorage' }`); a lazy import when the storage module imports the logger; a value written raw before adopted once with `importRawSync` into a NEW key on strata < 3.1.1 (ISSUE-14) | the vendor-owned keys stay raw and are named as the sanctioned exception |
| **No web manifest** while an "Install" control exists | `manifest.webmanifest` + 192/512 PNG icons rendered from the mark, linked in `index.html`, no caching worker | `Page.getInstallabilityErrors` → `[]` on the live page |
| A stored token printed raw (`{{liveProjects}}`) | fill it the way the page that already works does | read the live value |
| **Docs row gone stale** after tours (or any feature) shipped (Rent Party, 2026-10-25: earned on 10-24 by "same day as the last product change", stale the moment tours went live that evening) | one docs page per new user-visible feature, built from already-approved lines (GATE 4 still asked); a docs site that dates pages from git must be **committed before it builds**, or the sitemap plugin refuses the page | the docs' last commit is newer than the product's last user-visible merge; the page answers 200 and is in `sitemap.xml` |
| **Tour hint squeezed to one word a line on phones** (Rent Party, 2026-10-25) | a `position: fixed` popover placed before it is measured shrinks to the room left at that first spot, and the second measure reads the narrow width back: give it `inline-size: max-content` under its `max-inline-size` cap, dummy sheet first. To see the hint in a fresh browser, visit once, wait for the legal-notice bar to leave (it suppresses the hint), then load the page | the hint's box at 390 and 320 sits inside the 16 px gutter and its text is wider than ~120 px |
| Horizontal scroll at 390/320 | find the element whose **unclipped** right edge passes the viewport (ignore descendants of a scroller); an absolutely positioned visually-hidden label escapes `overflow: auto` unless the scroller is `position: relative` | `document.documentElement.scrollWidth === innerWidth` at 320 and 390 |

## 3. Gates and tooling traps

- 🔴 **Never run Prettier over files in a repo that does not format with it** (no config, or a different one).
  ClearHire's fix commit carried 1,400 reformatted lines for a 79-line change and had to be restored. Format only
  the files you created, with the repo's own config; compare `git diff --stat` against the change you meant.
- Run the project's own full gate (`yarn gates` or its equivalent) before every commit; a new test is watched
  failing on a planted defect, then the plant is removed.
- Strict parity suites (aoneahsan.com: text parity with a debt baseline, chrome parity, URL contract, SEO
  registry, reachability, the four-capture parity proof) fail on a new page until it is registered everywhere.
  Read each failure; extend the baseline with a one-line text insert, never a whole-file JSON re-dump (that
  reformats unrelated lines).
- A recapture can expose defects older captures hid (stale proof). Fix them — they are live bugs — rather than
  restoring the old images.
- A dummy `check` script can rewrite tracked review screenshots as a side effect: `git checkout` them before the
  commit.
- 🔴 **Parallel finalization sessions overload the machine** (Rent Party 2026-10-25: load 25–44 on 8 cores). Heavy
  simulation tests then time out at their own limits. Confirm a timeout touches nothing you changed, re-run when
  `uptime` drops, and commit only on a fully green `gates` run. Never raise a test's timeout to get past it.
- 🔴 **An OAuth client id the owner gives as "the Android one" can be the web client.** Compare it with the app's
  `VITE_GOOGLE_WEB_CLIENT_ID` and the Supabase list **before** writing it anywhere. With `serverClientId` = the web
  client, Supabase needs only the web id; Google needs the Android client to *exist* (package + SHA-1), or native
  sign-in fails with error 10.

## 4. Deploys (standing grant, `01-authorizations.md`; the project guide may require per-deploy approval — HabitForge and LabFlow do)

1. A clean detached worktree of the primary branch in the workspace's one `temp/` folder
   (`git worktree add --detach <workspace>/temp/<repo>`, `~/.claude/rules/one-temp-folder.md`), copy the tracked `.env`,
   `yarn install --immutable`, the project's build.
2. Serve that exact `dist` with the host's rules (`npx -y firebase-tools@latest serve --only hosting --project <id>`)
   and load it at 1440 and 390: visible content, zero uncaught errors, the 404 page, the fixed defect.
3. 🔴 **Stamp in its own command** — the gate hook reads the command line before anything in it runs, so a
   stamp and a deploy in one command are refused.
4. Deploy, then prove the live bundle hash equals the local one and look at the live pages again.
5. Remove the worktree; record the deploy (commit, bundle, what was checked) in the audit run log.

## 5. Guided tours (dummy first, held for GATE 4)

Follow `aoneahsan-cccs-guided-tours` and its `~/.claude/skills/aoneahsan-cccs-guided-tours/references/implementation.md` (lessons section). Order:

1. Read the dummy's header code and the app's header; the button goes directly before the appearance/theme
   trigger everywhere that trigger is drawn.
2. Pick 3–6 important pages whose targets exist in both dummy and app (headings by id; add `data-tour` hooks to
   both where ids differ or a selector list `'#a, #b'`). Words from approved lines first.
3. Dummy: `tours.js` (+ the project's catalogue convention), `tours.css` on the dummy's tokens, the walkthrough
   page (six steps, screens captured from the dummy at 1440 and 390 with review controls hidden), loaded from the
   dummy's shared script. Rebuild the dummy CSS.
4. App: a slot rendered only after hydration, a lazy button+hint chunk importing the byte-identical `tours.css`,
   a runner on Driver.js 1.10.2 (overlay only), the walkthrough route registered wherever the project registers
   routes (prerender list, SEO registry, sitemap, parity manifest, rewrites), events, keys in the catalogue
   (literal keys where a gate refuses assembled ones), a parity test watched failing on one changed word.
5. Records: an approval amendment, a decision (next OD), the GATE 4 package (`docs/story/…` — outside a
   drafts folder whose test requires database front matter), the content-map row, `run-state.json`
   `awaiting-approval`, story lint clean.
6. 🔴 **Branches:** the app work on `wip/guided-tours`; the dummy and records on the kit's `wip/root-guided-tours`,
   because the app's primary-branch parity tests read the dummy. Never leave the dummy change on `project-root`.
7. After the owner approves GATE 4: merge both wip branches, re-run the gates, deploy, update the audit.

## 6. Owner questions — batch them, then hold

Ask once, in one `AskUserQuestion` round (recommendation first), the moment the gap list is known:
the GATE 4 approval of the tour words · a deploy where the project guide requires approval · FilesHub hourly
leases · email marketing (`can_manage_email_marketing` on the project's key + a postal address) · a payment
provider/switch · any credential. Re-ask verbatim if the answer is "continue". Record every answer in the
project's `DECISIONS-LOG.md`.

## 6a. Lessons from LifeWell's close (2026-10-25)

- 🔴 **Read a held state from its live system before asking about it.** The tracker title said "A1 waiting"; FilesHub's
  sequence showed A1 approved and A2 waiting, so the first question named the wrong email and had to be re-asked.
  Read the sequence (`GET …/email-sequences/{seq}`) first, then ask about the step that is really held.
- 🔴 **Releasing a held step releases the one after it.** Shortening an approved step's delay lets people flow to the
  next step on its normal delay. Raise the next unapproved step's `delay_hours` FIRST, read it back, then release.
- **The FilesHub hourly-lease move is a port, not a design:** copy Rent Party's plane (`monopoly` migrations
  `20261024104910` + `…104929`, `ai-lease.ts`, `ai-lease-math.ts`, `ai-ledger.ts`) and adapt the feature names, the
  idempotency prefix and the hourly sweep. Dry-run both migrations plus every RPC's success path inside `begin … rollback`
  on the live database first; read ledger rows as the owner role (`service_role` has no table grant by design). A new
  table with a `user_id` trips the project's export-coverage gate: export it or exclude it with a reason. A
  `409 AI_UNAVAILABLE` on the first live call means FilesHub has no usable credit (check `GET …/ai/route` agrees), not a
  code fault: record the refusal path as the proof and say a measured receipt waits for credit.
- **A Play listing's "Updated on" date can lag a release the owner confirms.** Gate 3 rests on his confirmation; write
  the listing's date beside it rather than doubting either.
- **A gate probe that pins a timezone can go red on a clock window.** LifeWell's summary probe pinned UTC and failed
  every Sunday 00:00–06:00 UTC against a correct "no summary before 06:00 on its Sunday" rule. Before calling a red
  probe a regression, ask which instant and zone it ran in.
- **A project's registered CDP port can be held by another session's Chrome** (LifeWell's 9223 ran HabitForge's
  profile). Check `ss -ltnp` for the owner of the port and its `--user-data-dir`, and launch your own Chrome on a free
  port with your own profile instead.
- **Never re-dump a JSON record with a different indent.** Detect the file's own indent (round-trip it) or make a
  targeted text edit; a whole-file re-serialisation buries a four-line change in hundreds.

## 6b. Lessons from ClearHire's second run (2026-10-25)

- 🔴 **A soft-404 fix can turn every SPA route into a hard 404 while each page still looks fine.** ClearHire's single
  911-character `/@(…)` rewrite matched nothing in production (LifeWell's 704-character one does). `404.html` is the
  app shell, so `/login`, `/dashboard` and the rest still **rendered**, only with HTTP 404. Keep each rewrite source at
  **≤ 300 characters** (split the segment list), assert the bound in the hosting test, and after the deploy **`curl` the status
  of three unprerendered routes**. A screenshot cannot show a status code.
- **Read every word of a GATE 4 package against `payment-copy.md` before asking.** A tour step had *"How paying works,
  before you choose a plan."*, a duplicated title with a "before you…" framing. Offer the corrected line in the question.
- **A new dummy page must be in `PARITY-MANIFEST.json` and the app's copy-parity corpus in the same change.** Both gates
  refused the walkthrough page a day after it was built. A step-card `<li>` holding a heading and a nested list reads as one
  joined claim; declare those container runs, but only once each part has been seen to pass on its own.
- **Walkthrough screens captured from the dummy must hide each page's own review controls**, not only the prototype bar.
  ClearHire's profile carried a state switcher and a note to the reviewer, live on the walkthrough for a day. Look at every capture.
- 🔴 **An upsert on a table whose key column holds no UPDATE grant is refused for every user** (`permission denied for
  table`). PostgREST's `on conflict do update` needs UPDATE on every column sent, `user_id` included. An INSERT-only
  grants gate cannot see it. ClearHire's AI consent, analytics choice and Drive setting had never saved. Route writes
  through update-then-insert, and keep a census test that fails on any upsert to that table.
- **Probe a FilesHub feature as a live user before scoring it**: a re-audit that turns a setting on as the test alias finds
  refusals no code read shows.
- **A marketing `[TEST]` needs a mailbox assigned to the project.** All three shared senders can be taken (`NO_CAPACITY`);
  never move one away from another product. 🔴 Owner, 2026-10-25: *share the mailboxes we have* — do not ask; until
  FilesHub supports shared assignment, keep list, signup and drafts ready and record the wait (`-email-campaigns`).
- **The project's registered port can be held by another session's stale server** (ClearHire's 7364: a nine-hour-old
  `firebase serve` whose directory was gone). Never kill it; serve on a free unregistered port.

## 6c. Lessons from ClearHire's third run (2026-10-25)

- **A fleet task appended to `PENDING-TASKS.md` can turn a generated-state gate red** (ClearHire `PROJECT-STATE.json`
  lists open tasks; TASK-051 was appended without `yarn state`). Before blaming your change, read the diff of the
  generated file; regenerate after you close the task, then run the full gate.
- **Closing a fleet task keeps its marker.** The marker sits inside the task block; leave
  `<!-- fleet:<slug> --> (closed as DONE-NNN, date)` in the file, or the next idempotent fleet pass re-appends the task.
- **A shared fleet tracker can hold another session's uncommitted hunk.** Stage only your row: write HEAD's copy plus
  your change to a scratch file, `git hash-object -w`, then `git update-index --cacheinfo`; leave their hunk in the tree.
- **Name every production touch in the approval question**, the read-only ledger `select` included, when the project
  guide puts `SUPABASE_DB_URL` behind written approval. "One live proof call" does not plainly cover reading the row.
- **"Share the mailboxes" is not "move it back".** Every move rests the mailbox in FilesHub; leave an assignment where
  it is and borrow for each send until FilesHub ships shared assignment.
- Never `grep` a secrets file with a regex "redaction" to look at its layout: a line the pattern misses prints the
  secret. Read the line you need straight into a variable.

## 6d. The update flow is checked first, every run (owner, 2026-10-30)

Rent Party had a correct OTA client that had never received a build (0 builds on the server), and no in-app update,
no in-app review and no fallback gate. A green build hid all of it. Every run now checks, before anything else:
the server holds a proven build, the Play/extension/desktop self-update is wired, and the layer 2 release-record
gate blocks on a `test` row. Never ask whether a project needs it: every product does (`aoneahsan-cccs-update-flow`).

## 7. Never

Start, suggest or ask about a held item (extension for a web app, Android for an extension) · sign anything with
an AI name · `git stash`, rebase, force-push · write outside this project's root and the record repo · run a
dev server or browser target another session owns (open your own CDP target, use the project's registered port).

## 8. Lessons from HabitForge run 2 (2026-10-25)

- 🔴 **Read the newest commit messages before re-scoring.** The owner's own commit (`c576c4d`, "Play already serves
  1.5.0") moved the Android row between two audits; one question then earned 15 points and gate 3.
- 🔴 **A first-load budget can sit exactly at its ceiling** (617/617 kB). Any eager byte fails the build; a component that
  waits for auth anyway (the notice bar) is lazy decision and all, mounted under `Suspense` in the root layout.
- **Signed-in tours on production with no test hook:** copy the test account's strata session key
  (`<prefix>auth-session`) from a signed-in local origin to the live origin in your own CDP target. It is the same Supabase
  project, and the account stays non-admin.
- **A lease move is three answers asked together:** the move, the additive migration on the shared database, and the
  owner's provider-side spend-stop attestation (the ledger refuses every call without it). Rehearse both migrations and
  every new RPC's success path inside `BEGIN … ROLLBACK` as `service_role` before the push.
- **FilesHub credit can expire mid-session** (`ai-accounts/3` `credits.status = expired`): AI rests and spends nothing.
  Read `GET /ai-accounts/{id}` before calling it a product defect, and retry after `refresh_after`.
- 🔴 **Marketing mailboxes are shared, never moved** (`app-growth.md`). Parallel sessions moved one between three
  projects in minutes. A `[TEST]` borrows one for one send and restores it in a `finally`.
- **Check the email's real structure before the `[TEST]`:** the block library's "template body" includes the
  `<tr><td class="bg-card px">` wrapper and the team sign-off; render it inside the layout at 390 × 844 first.
- **Live test-account data reads as test data in marketing screens** ("Probe A (test account)", AI "resting"); use the
  approved dummy's sample data at 2× and say so in the draft.
- **A dummy server from the previous run can still be listening** (orphaned to systemd). Kill what the project left behind
  at stop-work, and check `ss -ltnp` for the project's ports at start.

## 9. Lessons from aoneahsan.com run 2 (2026-10-25)

- 🔴 **Score the AI row only on a live call.** The 10-24 audit gave 10 points to an AI that answered `paused:true` on
  every call (no `FILESHUB_PAT`); the score was 10 too high. Probe `GET ai` as a non-admin and make one real task call.
  And read FilesHub's `ai-accounts/3` credit state: an expired grant pauses every project's lease at once. The OD-115
  paid fallback (global OpenAI key, `OPENAI_FALLBACK_MODEL` = the cheapest model `GET /v1/models` lists) is what keeps
  AI and Speak live through that, so wire it, never ask.
- **The FilesHub Management API mints access tokens now** (`POST /access-tokens`, release `2026.10.23.3`): a MANUAL-TASKS
  row saying "only Nova mints tokens" is stale. The plaintext arrives once, in `data.plaintext_token`; a missed
  plaintext is recovered with `POST /access-tokens/{id}/rotate`, never by asking.
- 🔴 **`firebase serve` silently takes the next port** when the registered one is held (here LifeWell's Vite on 5901), so the
  first render check looked at ANOTHER PROJECT's site. Read the `Local server:` line, and confirm the listening process's
  cwd (`/proc/<pid>/cwd`) is your worktree before trusting a single screenshot.
- **A deploy worktree outside the root breaks the parity gates**: the tests read `../<dummy>` and kit files such as
  `../02-FROZEN-CONTRACTS.md`. Symlink each beside the worktree (grep the tests for `'..'` and `join(KIT,`).
- **Polar: one organisation per product.** A second product on another product's org has its subscription events
  reach the first product's webhook, which fails on them (and can be disabled), and customers are org-wide. Ask the
  owner for the product's own org; build the checkout dormant (`GET billing` → `available:false`) meanwhile.
- **Copy parity cannot match an interpolated value** (`{{price}} a month…`): draw the number as its own element in the
  dummy and the app. A script-built dummy line written with `innerHTML` keeps its tags in the unit; build it from text
  and link nodes.
- The local Deno (2.1.4) rejects `Uint8Array<ArrayBuffer>`; plain `Uint8Array` works on both it and Supabase's runtime.


## 10. Lessons from HabitForge run 3 (2026-10-25)

- 🔴 **Find every function that bundles a shared module before naming deploy targets in an approval.** The AI broker
  sat behind `ai` and `ai-status` by name, but `voice` and `ai-tick` reached it through `_shared/voice-propose.ts`. Grep
  the transitive importers (`grep -rln "<module>" supabase/functions`, then each importer's importers) and name them all
  in the one question. Otherwise a second approval round is needed, or the functions run different broker code.
- **The global OpenAI key's project allows only `gpt-4o-mini`** (`GET /v1/models`, 2026-10-25). FilesHub's `fallback`
  block names `gpt-6-luna`, which that key cannot call. Set `OPENAI_FALLBACK_MODEL` from what `/v1/models` lists, and
  point the owner at LifeWell MANUAL row 66 rather than inventing a new ask.
- **A fallback is proven without forcing an outage:** while the lease answers, prove the lease path with its ledger
  row, and the fallback with one direct provider call carrying the broker's exact request body (shape, schema,
  length fields) on the same key.
- 🔴 **A sed "redaction" of the test-accounts file printed the password** (the pattern expected `Password:` but the line
  reads `**Password (ALL aliases …):**`). Never display that file's lines. Extract the value straight into a variable
  (`sed -n '6p' … | grep -oE '`[^`]+`' | tail -1`) and print only a yes/no.

## 11. Lessons from AChat run 2 (2026-10-25)

- 🔴 **A previous run's audit row can be stale in the owner's favour.** The 10-24 audit gave Android 0 ("1.8.0 built, not
  uploaded"); Play already served **1.9.0**, a version only the rebuild carried. Read the listing's version
  (`curl` the Play page, grep the quoted versions) and ask the owner to confirm, before scoring the store row.
- **A session that stopped mid-task leaves its work uncommitted, not lost.** Check `pgrep` for live sessions in the root
  first; then split the leftovers by what is already live (commit on the primary branch) and what is not (a `wip/` branch
  pushed at once), and restore the review PNGs the dummy checks rewrote.
- **A token file can start with a comment line**: `$(cat file)` puts it in the header and curl fails with `(43)`.
  `grep '^fh_pat_' file`.
- **FilesHub marketing endpoints take the project's `public_id`** (`01K…`), not the numeric id the AI route accepts;
  `projects?per_page` caps at 50, so page 2 holds the rest when mapping which project holds a mailbox.
- **`OPENAI_FALLBACK_MODEL` must win over FilesHub's `fallback` block** when the shared key is model-restricted
  (it reached only `gpt-4o-mini`): otherwise every fallback call is a `model_not_found`. Prove the shape with one direct
  call on the key.
- **A record saying a secret is "already set" is a pointer, not proof**: `supabase secrets list` showed no `FILESHUB_AI_PAT`.
- **A paid fallback is a data recipient.** If text can reach OpenAI when the lease is refused, the Privacy copy must name
  it; the story fact-checker caught it against the broker code.
- **The deploy gate reads the session's working directory, not a `cd` inside the command**: `cd` into the worktree in its
  own command (or run the deploy as `cd <wt> && …` from a directory without its own `dist`). Keep the deploy worktree
  outside the kit, or the kit sees it as untracked.
- 🔴 **`kill $(cat npx.pid)` does not stop `firebase serve`** (the child keeps the port); kill the listener's pid from
  `ss -ltnp`, and confirm `/proc/<pid>/cwd` before trusting a render check — the stale server served a deleted directory.
- **Sitemap `<lastmod>` = build time on every URL is a gap even when every route answers 200**; the fix is the
  words-fingerprint ledger (`aoneahsan-cccs-sitemap` → formats.md), checked by the build. Seed with
  `git log -1 --format=%cs -S'"<key>": "<value>"'` (the full catalogue line; a bare sentence dates short labels wrongly).
- **A `[TEST]` before FilesHub shares mailboxes = move one in and back in the same command** with a `trap … EXIT` that
  restores it, and read the holder's `sending: true` afterwards.
- **Marketing email screens from the dummy:** clear the origin's storage before each capture (the dummy persists a sent
  message across pages), hide `.demo-dock`, `.demo-note`, `.tour-hint` and any not-yet-approved controls.
- **Activating a campaign: run `GET …/email-sequences/{seq}/check` first** (GET; POST answers an HTML 405). It named two
  blockers no earlier step showed: `marketing_disabled` (`PATCH …/email-marketing/settings {"enabled":true}`) and
  `template_missing_text` (the marketing template needs a plain-text part: `PATCH /api/v1/emails/templates/{slug}
  {"body_text":…}` with the project key **and an `Origin` of the project's host**, built from the approved words only).
  Then assign the pool batches to the still-draft sequence (`POST /email-batches/{id}/assign`, all-projects marketing
  token, dry run first), which enrolls them, and activate.

## 10. Lessons from aoneahsan.com run 3 (2026-10-25/26) — the prerender-into-`#root` move, and content claims

- **Prerender into `#root` + hydrate is a few hours, not an architecture rewrite** — when the app already prerenders:
  a Vite SSR build of an `entry-server.tsx`, a step in the existing prerender that fills each `#root` and writes the
  dehydrated query cache as `<script type="application/json">` (CSP-safe), `hydrateRoot` after `router.load()`. Live
  mid-phone FCP 3.4 s → 1.6 s. Reference: aoneahsan.com `src/entry-server.tsx`, `build-seo/ssr.ts`, `docs/PERFORMANCE.md`.
- 🔴 **Fetch data by rendering, pass after pass, and read each query's `enabled` option — never `isDisabled()`.** With
  no subscribed observer (every query on the server) `isDisabled()` calls any never-fetched query disabled; the build
  then shipped pages WITHOUT their data and still hydrated cleanly, because the client's first render was just as empty.
  🔴 **A hydration gate cannot see an empty render** — add a build guard that names what a page must contain
  (`/projects` must link every project) and watch it fail on the planted regression.
- 🔴 **TanStack Router picks server or client branch from an export condition**, not the `isServer` option: the
  server branch omits the Suspense boundary the client wraps code-split routes in, so all 132 pages mismatched. Alias
  `@tanstack/router-core/isServer` to its `client.js` in the SSR build, bundle the router (`ssr.noExternal`), give it
  an `origin`, and define `self` in the renderer.
- **Three more mismatch sources, each found by the gate:** a query returning a `Map` (JSON makes it `{}`; tag Map/Set/
  Date on both sides), relative times ("1 hour ago" vs "59 minutes ago"; a build clock read through
  `useSyncExternalStore`'s server snapshot), and a `DOMParser`-built body (give the renderer happy-dom's). Invalid
  nesting (a link inside a link) becomes a hydration failure too.
- **The hydration gate:** load every sitemap page at 1440 and at 390 touch, fail on any "hydrat" warning or console
  error; run it once on a development build to read React's diff.
- 🔴 **Node 26.1's bundled `fetch` crashes a build on a reset socket** (uncaught `TypeError: terminated`, no frame of
  ours, HTTP/2 and 1.1 alike); route the build through the `undici` package's `fetch`. Ledger: package-version-known-issues.
- 🔴 **A branch switch makes the verified build stale** — the deploy gate compares source mtimes. Build AFTER the merge.
- **Content claims live in more than one table.** A keyword sweep of `long_description`/`faq` missed sentences that
  describe a feature without naming it (autofill, Focus Mode) and a whole notebook-synced table (`tagline`,
  `highlights`) — read each edited row whole, render the page, and file the synced layer at its source.
- **A marketing `[TEST]` on a borrowed mailbox:** move it, send, restore it in a shell `trap` so the restore runs on any
  failure, read both projects back. The test counts against the holder's day.

## 12. Lessons from LifeWell's re-audit (2026-10-26)

- 🔴 **A complete project's docs row goes stale on the next user-visible product change.** LifeWell scored 100 on
  10-25 with the docs last committed 10-22, while 3.25.0 and four amendments had shipped on 10-23/24. A re-audit compares
  the docs repo's last commit with the product's last user-visible commit before keeping the 5 points. The fix is one
  changelog entry plus a section per new feature. Keep the scorecard at 100 only once it is live again.
- 🔴 **`/seg/**` for a segment with no deeper route is a soft 404.** The 2026-10-21 fix gave every top-level segment
  both `/seg` and `/seg/**`, so `/auth/x` answered 200 with the in-app not-found screen. Keep `/seg/**` only where
  `routesByPath` has a path below the segment, and add a test that fails on a `/**` rewrite with nothing below it.
  Grep source, native config and the frozen contract for links under a leaf segment first. LifeWell removed 39.
- **Porting Rent Party's docs `site-pages` plugin into a site with a home page and generated category indexes:** `/`
  takes the newest date like `/sitemap`. A generated index at `/category/<slug>` need not share its pages' folder
  (`get-started` vs `getting-started`), so date it from the pages the sidebar lists under it, recorded while the
  content loads, never from a path guess. Set `i18n.localeConfigs.en.htmlLang` to the project's locale (`en-GB`), or
  the feed prints US dates. On GitHub Pages, `/sitemap` serves `sitemap.xml` until a `sitemap.html` exists.
- **A FilesHub `fallback` block names a model the key may not reach.** Try the block's model first and the secret
  second; move on only on a 404 or `model_not_found`. OpenAI answers a restricted project with **403 `model_not_found`**
  (not 404), so match the code, not the status. Prove it with one direct call per model on the key.
- **`PATCH /api/v1/emails/templates/{slug}` with `{}` returns the full template**, which is how to read a marketing
  template's live HTML (there is no GET). It needs a key with the `email_template` scope: the project's server key,
  not its browser key.

## 12. Lessons from Trizlink run 3 (2026-10-26)

- 🔴 **Run the project's FULL gate before `supabase db push`, not after.** Trizlink's `revoke-shape` test refused the
  text of a migration that was already applied (`revoke … from public, authenticated` without `anon`); an applied
  migration cannot be rewritten, so the only way out was an audited allowlist entry with the catalog proof beside it.
- 🔴 **An append-only audit trigger plus an `on delete set null` FK blocks account deletion for every actor.** The
  cascade is an UPDATE; the trigger refused it, and a sweep that deletes all due accounts in one statement failed
  whole. Rehearse `delete from auth.users where id = <an actor>` inside an aborted transaction during every audit.
  The fix allows exactly one edit (identity → NULL, `detail` to a subset, under a transaction flag), a `before delete`
  trigger on `auth.users` to forget the person, and a `before insert` guard — the membership cascade writes new audit
  rows about the person AFTER the forget runs.
- **A lazily loaded catalogue chunk is not referenced from `index-*.js`**, so scanning the index's chunk list misses a
  string that IS live. Grep the local `dist/assets` for the file name, then `curl` that exact chunk on the live host.
- **Signed-in live checks with no test hook in production:** a Supabase password grant as the non-admin alias, then write
  `sb-<ref>-auth-token` (supabase-js's default key, the session JSON) into the live origin's `localStorage` in your own
  CDP target. Verify `/dashboard…` at 390 touch the same way as public pages.
- **FilesHub sequences:** `activate` does not enroll anyone when `auto_enroll_new_contacts` is false —
  `POST …/email-sequences/{seq}/enroll {"all":true}` (reply: `enrolled`, `refused_suppressed`). `…/steps/{key}/approve`
  needs an `approval_reference` of ≥ 8 characters and an accepted `[TEST]` newer than the step and its template.
- **Never `git push -q`:** it hides the `Bypassed rule violations` line the rule says to quote.
- **The fleet trackers notice you:** a fleet session marked Trizlink's cursor row "in-progress-elsewhere" because this
  session's edits were uncommitted. When you finish that work, update the row in their tracker but leave committing an
  untracked tracker file to the session that created it.

## 14. Lessons from LabFlow run 2 (2026-10-26)

- 🔴 **A soft-404 fix built BEFORE §6b's lesson still carries the over-long glob.** LabFlow's 10-24 fix had 722- and
  725-character `/@(…)` sources; `firebase serve` matched them, production did not, and every signed-in route answered 404
  for ~15 minutes after the deploy. **Measure every rewrite source in `firebase.json` before EVERY deploy**, whoever wrote
  it and whenever, and `curl` three unprerendered routes live straight after. Split by first segments into sources
  ≤ 300 characters, and add the length bound to the hosting test, watched failing on the old config.
- **The Play listing's version can already be the rebuild's** (2.6.0 from the rebuild vs the old app's 1.3.0): one question
  earned the Android row and gate 3. Compare the listing's version with each tree's `versionName` history first.
- **A GATE 4 package can still carry a banned pay-surface line** ("How paying works, before you choose a plan."). Offer the
  fix inside the GATE 4 question, from a line already approved elsewhere, so one answer approves and corrects.
- **The no-custom-cursor law (2026-10-26) reaches theme panels:** LabFlow's dummy drew a cursor layer and the app shipped
  only the axis, a "Custom cursor" switch wired to nothing. Remove the axis from every registry (dummy `AXES`,
  `prepaint.js`, the head table, the app registry), the layer and its CSS (dummy first, byte-copy after), the tokens, and
  fix every "ten axes" count, including the cookie policy row that lists the stored preferences.
- **A paid AI fallback is a new processor:** the policy must name it before the secret is set. Ask the row's words as GATE 4
  in the same round as the deploy approval (dummy legal page first; the app's extracted copy is parity-tested).
- **The automation browser's captures come back blank below the first viewport**, on any site. Check deep positions from
  the DOM (rects, opacity) and, for marketing screens, hide the sections above the target at scroll 0. A tall viewport
  works, but captures are capped at 1800 px, which costs the 2×.
- **FilesHub's marketing layout shows the hero at 70% and feature images at 60% of a phone's width**, so wide desktop crops
  are unreadable there. Use the product's phone app-view screens at 2× (390 px, `deviceScaleFactor: 2`), or a crop of the
  two or three columns the block is about.
- **A docs site whose sitemap lists bare URLs that Pages 301s:** set `trailingSlash: true` and convert relative page links to
  `./file.md` links (the build then resolves them by file, under either setting); `onBrokenLinks: 'throw'` finds every one.
- **The fact-checker earns its dispatch on marketing email:** it caught an onboarding sequence that skipped the laboratory's
  setup step, and an unsourced "Both land in one list". Give it the exact sent text and the live pages it may fetch.

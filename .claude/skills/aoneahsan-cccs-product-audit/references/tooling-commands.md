# Tooling — direct commands per check family (no scripts, ever)

Everything here is a direct command or an `npx -y` one-off of a free tool. 🔴 Never add a script file or a
`scripts/` folder (`00-house-rules.md`), and never add an audit tool as a project dependency. Pin a version that
is at least two weeks old, record the version in the evidence, and run tools against the project's **own**
origins only. Use one request at a time with a pause on live origins; this is not a load test.

## HTTP, headers, redirects, 404

```bash
B=https://<origin>                                   # from projects/project-live-urls.json
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' "$B/"            # status + first hop
curl -sSIL "$B/pricing" | grep -iE '^(HTTP|location|x-robots-tag|content-security-policy|strict-transport|referrer-policy|x-frame|cache-control)'
for p in /zz-not-a-page /blog/zz-nope /people/zz/zz; do curl -s -o /dev/null -w "$p %{http_code}\n" "$B$p"; done   # expect 404
curl -sSI "http://${B#https://}/" | head -3          # http → https
```

## robots, sitemap, feed, canonical, meta

```bash
curl -sS "$B/robots.txt"
curl -sS "$B/sitemap.xml" | xmllint --noout - && echo sitemap-valid
curl -sS "$B/sitemap.xml" | grep -oE '<loc>[^<]+' | sed 's/<loc>//' | head -40 > /tmp/urls   # sample
while read u; do curl -s -o /dev/null -w "%{http_code} $u\n" "$u"; sleep 0.3; done < /tmp/urls
curl -sS "$B/feed.xml" | xmllint --noout - && echo feed-valid
curl -sS "$B/<route>" | grep -oiE '<(title|link rel="canonical"|meta name="(description|robots)"|meta property="og:[a-z:]+")[^>]*>'
curl -sS "$B/<route>" | grep -o '<script type="application/ld+json">.*</script>' | sed 's/<[^>]*script[^>]*>//g' | jq . >/dev/null && echo jsonld-valid
```

Use the scratchpad for `/tmp/urls` when the session lists one.

## Performance (mid-phone)

```bash
npx -y lighthouse@12 "$B/<route>" --only-categories=performance,accessibility,seo,best-practices \
  --form-factor=mobile --throttling-method=simulate --output=json --output-path=<run>/evidence/lh-<route>.json \
  --chrome-flags="--headless=new" --quiet
jq '.audits["largest-contentful-paint"].numericValue, .audits["cumulative-layout-shift"].numericValue, .audits["total-blocking-time"].numericValue' <run>/evidence/lh-<route>.json
```

Point `CHROME_PATH` at the automation Chrome binary (`browser-automation.md`). Use 3 runs per route and report
the median. Signed-in routes are measured through the automation browser's Performance trace instead,
because Lighthouse cannot sign in without the DEV hook. Field data: the PSI API `runPagespeed?url=…` (keyless,
low volume).

## Accessibility

```bash
npx -y @axe-core/cli@4 "$B/<route>" --chrome-path "$CHROME_PATH" --exit --save <run>/evidence/axe-<route>.json
```

Signed-in states run axe inside the automation browser page (inject `axe.min.js` from the project's
`node_modules` when present, or report BLOCKED). Keyboard and screen-reader checks are manual. Record them as
steps.

## Layout and screenshots

In the automation browser, use your own target at 1440, 390 and 320. Evaluate
`document.documentElement.scrollWidth - innerWidth` (must be ≤ 0), then save a screenshot to `<run>/evidence/`.
Use synthetic data only.

## Database (Supabase) — catalogs over the pooler, read-only

Run with the DEV project ref from the FilesHub vault (`supabase-provisioning.md`). Never print the credentials.

```sql
select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'public' and not rowsecurity;
select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public';
select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated');
select p.proname, p.prosecdef, array_agg(a.grantee) from pg_proc p join information_schema.routine_privileges a on a.routine_name = p.proname where p.pronamespace = 'public'::regnamespace group by 1,2;
select defaclrole::regrole, defaclobjtype, defaclacl from pg_default_acl;
```

Use the project's own policy instrument when it has one (LifeWell: `yarn db:policies`). For an RLS behaviour
probe, call PostgREST as two seeded users against a forbidden row.

## Code sweeps (from inside each repo)

```bash
git -C <repo> rev-parse --short HEAD; git -C <repo> status --short | head
command grep -rnE "localStorage|sessionStorage|indexedDB|document\.cookie" <repo>/src | grep -v storage
command grep -rnE "console\.(log|info|warn|error|debug)" <repo>/src | grep -v logger
command grep -rnE "service_role|sk_live|BEGIN (RSA|EC) PRIVATE" <repo>/src <repo>/dist 2>/dev/null
find <repo>/dist -name '*.map' | head
yarn --cwd <repo> npm audit --all --recursive --json 2>/dev/null | head -c 4000    # Yarn Berry; classic: yarn audit --json
```

## DNS (read-only)

```bash
dig +short TXT <domain>; dig +short TXT _dmarc.<domain>; dig +short TXT <selector>._domainkey.<domain>
```

## Lessons from runs (keep each to its one trap)

- **Soft 404 per public prefix, not just at the root.** Probe `<prefix>/zz-nope` for every public segment with a
  `/seg/**` → `/index.html` rewrite. A prerendered-only segment (posts, feature pages) needs no deep rewrite at all,
  and with one it answers an invented slug with the home page's `index, follow` head (LifeWell 2026-10-26).
- **Private link paths need a header, not only a JS `noindex`.** `curl -sI <origin>/share/zz | grep -i x-robots-tag`.
  A rewrite to the shell serves the shell's `index, follow` until the client swaps it.
- **Google-only UI, open email provider.** Read `GET <supabase>/auth/v1/settings` (anon key): `external.email` true
  with `disable_signup` false means anyone can sign up with a password past the UI. When a test hook needs the
  provider on, the fix is a `before_user_created` hook that allows only the test aliases.
- **A background gate's exit code is the wrapper's.** In `cmd > log; echo exit=$? > f`, the task reports 0 whatever
  happened. Read the recorded `exit=` line, never the notification.
- **Signed-in browser without a DEV hook:** let Node fetch the session and write it into the app's own storage key
  over CDP, so no token or password reaches the transcript. CDP `Emulation.*` overrides end with the CDP session,
  so set the viewport inside every connection.
- **Duplicate-write checks use trusted input.** Two `el.click()` calls in one frame can both submit before React
  re-renders. Use `Input.dispatchMouseEvent` (clickCount 1 then 2, ~80 ms apart) before calling it a FAIL.
- **"No usable sandbox"** from a headless Chrome in a restricted shell: use an audit-owned instance with
  `--no-sandbox`, a scratch profile and your own origins only, and kill it by its pid.
- **axe `target-size` "partially obscured"** at a scroll position under a fixed bottom bar is an artefact. Scroll the
  target clear and re-run before filing it.
- **The crawler's copy can contradict the rendered page.** MOBILE-02/DATA-02 compare the merged manifest with the
  PRERENDERED HTML and its FAQ JSON-LD (`curl` the live page), not only the React page. LifeWell's rendered
  `/permissions` named the microphone while its SEO record told Google "never requested" (2026-10-26).
- **Separate what ships from what builds:** `yarn npm audit --all --recursive --environment production`, then
  `yarn why <pkg>` for each hit. A transitive fix inside its declared range is `yarn up -R <pkg>` (only `yarn.lock`
  changes), followed by `tsc -b --force` and the full gate.
- **Read the product's own switches before rating a payment finding.** An unwired provider behind a switch that is
  off and labelled is a P2 gap, not a broken P1 purchase (`platform_settings.play_billing_on`).
- **Contrast in every theme:** set the theme axes' `data-*` attributes on `<html>` directly, run axe
  `color-contrast` per combination, report `incomplete` beside the violations, and plant one grey-on-grey element to
  prove the sweep can fail.
- **Deletion proof uses a disposable alias created through the admin API** (`email_confirm: true`), seeded through
  the API as that user, deleted through the product's own endpoint, then counted in the catalogs (rows, profile,
  `auth.users`, `auth.sessions`). Also try the endpoint with a forged body id and the anon key.
- **A deploy-gate stamp is its own command.** A hook that checks the stamp runs before the command, so
  `stamp && deploy` in one call is refused.
- **Census the service role before trusting an Edge Function's admin read.** Where a baseline revoked
  `service_role` (house migrations do), `has_table_privilege('service_role', …, 'SELECT')` across `public` lists
  the tables an `adminClient().from()` can never read; grep the functions for `.from('<table>')` on that list.
  It fails CLOSED (a 500 or a silently skipped email), so no probe of the forbidden case ever shows it — probe the
  OWNER's happy path too.
- **Verifying a fix runs the next step of the flow.** The upload fix was only half the journey: removing the
  photograph then failed on the table's own CHECK. Exercise create → read → remove → remove-again before
  calling a storage flow fixed.
- **An "attempt" event is not activation.** A generic `form_submitted` cannot tell a refused submit from a saved
  record; look for a success event on the mutation, and capture the wire to prove it.
- **Count a manifest from the merged file, never from memory.** `processReleaseMainManifest/AndroidManifest.xml`
  in the build output is the truth; a contract test over app and plugin manifests cannot see Gradle-library
  permissions.
- **Grep analytics payloads for a marker you typed, not for the brand.** The domain contains the brand, so a
  brand grep reports a false PII leak on every page URL.
- **Decide "mine or pre-existing" with a baseline worktree, not a guess.** `git worktree add <workspace>/temp/<repo>-baseline <deployed sha>`,
  symlink `node_modules`, run the dev server on a spare port and point the same gate at it (`LW_E2E_ORIGIN`). Identical
  failures on the deployed commit are pre-existing; a failure only on the new tree is yours. Remove the worktree after.
- **A gate that depends on the calendar is a fixture defect.** Values computed from the date (`112 + day*7 mod 20`) and
  dates relative to `current_date` (+5 lands in a different week by weekday) pass on some days and fail on others; pin
  the drawn values and date the row to the week, not the day.
- **React Aria `Tabs` builds a collection from its children**: a collection component (Breadcrumbs, ListBox, Table)
  rendered inside `Tabs` but outside a `TabPanel` throws. Keep the page head outside `Tabs`.
- **Never `pkill -f` from the session shell** — the pattern matches the shell issuing it and kills the command. Stop by
  listening socket (`ss -ltnp`) or a recorded, verified pid.
- **Measure performance with the project's own instrument, not Lighthouse alone** (Rent Party, 2026-10-28). Lighthouse's
  simulated throttling loads the analytics a project's recorded vitals exclude, and its TBT tracks the host's real CPU:
  the same page read 116 / 1,322 / 4,788 ms as other sessions pushed the load from 2 to 9. Read the project's method
  (`docs/PERFORMANCE.md`: devtools CPU 4×, Fast 3G, worker bypassed, analytics blocked, width, a load ceiling) and reproduce it
  over CDP; record the 1-minute load beside every run, and call nothing a regression until a run under the project's own
  load ceiling repeats it. Lighthouse also returns runs with no metrics: parse with `.get()` and report the count of valid runs.
- **A service worker can fail every navigation without throwing.** On a precache miss, Workbox's
  `createHandlerBoundToURL` fetches the shell's file name; a host that redirects `/shell.html` to `/shell` hands back a
  redirected response, which a navigation must reject (`net::ERR_FAILED`). Fall back to `fetch(event.request)`. Reproduce by
  emptying Cache Storage while keeping the registration (delete each entry, not the registration), then navigate.
- **Check the approved dummy's own files for damage when a lane reports the dummy "looks wrong".** An edit meant to append can
  replace a file's tail (`git show <commit> --stat` with deletions far above additions). Restore from the parent commit with a
  block-size rule (a large replaced block keeps both sides, a small edit keeps the new side) and prove every restored selector
  against the app's translated copy.
- **A resumed agent continues from its saved transcript**: after a session restart, `SendMessage` the stopped agent with the
  instruction to read its files on disk first; never re-dispatch the same task (duplicate work, two writers on one file).
- **A lane agent writes its lane file incrementally** (header at once, then each section as it closes). LifeWell
  2026-10-28: two lanes that planned to write only at the end lost everything when the session ended; the one that wrote
  as it went survived and was not re-run.
- **Python's `RobotFileParser` is first-match**: with `Allow: /` first it says every path is allowed. Read the group by
  eye, or test with the longest-match rule Google uses.
- **A shared `UPDATED` constant behind several routes freezes their sitemap `lastmod`.** Compare each `<lastmod>` with
  the last commit that changed that route's own words (its SEO block and its catalogue section, `git log` per object),
  and treat shared chrome (a footer) as not moving a page's date.
- **The Play listing drifts apart from the binary**: an "Updated on" date proves an upload, not a listing refresh. Fetch the
  public listing text and diff it with the approved listing every run.
- **Docusaurus minifies attributes without quotes** (`name=description content=…`, `rel=canonical`): canonical and meta
  sweeps need the optional-quote form.
- **Grep the AI prompt builders' `.from('…')` reads against the privacy page's "what it sees" sentence.** LifeWell's said
  "nothing else from your record" while Speak sent medicine, condition and baby names (F-SEC-010, P1).
- **A keyword grep can call an approved label missing**: "badge" and "billing" found nothing because the approved words
  were "A count on the app icon" and "Google Play purchases". Check the source registry and the rendered page before
  filing, and split rendered vs crawler copy (only the crawler copy was stale).
- **A trusted double press** is `Input.dispatchMouseEvent` press+release, then again 80 ms later with `clickCount: 2`;
  count `POST`s from `Network.requestWillBeSent` and read the rows back. React Hook Form's `isSubmitting` does not stop it.
- **The copy gate refuses a declaration whose words left the dummy** (a moved date): delete the dead exemption; do not
  re-add the old words.
- **Trace an LCP or CLS problem before fixing it** (LifeWell F-EXP-016, 2026-10-28): record every LCP entry's element,
  classes and size, every layout-shift source with its rects, and the `h1` box every 250 ms. The first theory (the web
  hero's box differed) was wrong; the trace showed the phone renders a different screen (the app view), and the shift
  came from the footer during an empty first commit. A fix made from the theory moved nothing.
- **A phone and a desktop can render different screens for one route** (app view vs web view, chosen pre-paint): a
  prerendered first paint has to match the one each will actually show, or the swap makes a second LCP candidate.
- **`lazy()` suspends for one turn even when its module was preloaded by the loader**, and TanStack Router's code
  splitting does not share a route file's module-level variables between the loader and the component
  (`… is not defined` in the console). Remember the module in its own small file that both halves import.
- **The project's own vitals script can hang** (its Chrome held a blank tab for 25 minutes). Drive the same profile
  with a PerformanceObserver script and say so in the record; never report a hung run as a measurement.
- **Re-check a medium-confidence lane finding before fixing it**: Escape-to-close failed 2/5 in the lane and 0/10 when
  re-run with `rawKeyDown` + `windowsVirtualKeyCode: 27`; recorded as not reproduced, no code change.
- **A fix that does not take effect is reverted, not shipped** (`?step=99` stayed after two `beforeLoad` redirects):
  restore the file from the parent commit, prove the diff is empty, keep the finding open with the evidence.
- **TanStack Router merges the RAW search into the match.** A `validateSearch` that returns `{}` for a bad value leaves
  it in `useSearch()` (`?step=99` stayed for two fixes). Always return the key (`{ step: undefined }`), then replace a
  stray raw key after mount (LifeWell F-EXP-015a, 2026-10-29).
- **A CSP added by CDP `Fetch.continueResponse` is ignored by Chrome** (header visible in `Network`, zero violations
  even for `script-src 'none'`). Use `Fetch.getResponseBody` + `Fetch.fulfillRequest`, read `Audits.issueAdded` and a
  `securitypolicyviolation` listener, and plant a dropped hash before trusting a clean sweep.
- **Zod 4 probes `Function("")` and JIT-compiles object parsers** — a strict `script-src` reports `eval` on every page.
  `z.config({ jitless: true })` in a module is too late (schemas are built at module scope in chunks evaluated first);
  an inline `globalThis.__zod_globalConfig={jitless:true}` before the module script is not.
- **Prerendered SPA, mid-phone LCP = FCP and the sheet finishing late:** ~70 modulepreloads share the throttled link
  with the one render-blocking stylesheet, so "asked for first" is not "served first". Inline the entry CSS in each
  prerendered page (LifeWell 2026-10-29).
- **axe `label-content-name-mismatch` does not match a label inside brackets** ("Your profile (AM)" fails, "Your
  profile, AM" passes), and an sr-only name inside an `aria-label`led link counts as its visible text.
- **A live signed-in sweep without a DEV hook:** a password grant on `/auth/v1/token` for the test alias (password
  read at runtime), written into the app's storage key in the app's OWN envelope. strata-storage ignores an envelope
  that carries only `value` (LifeWell signed in only with `created`, `updated`, `encrypted: false`, `compressed: false`).
  Revoke it afterwards with `POST /auth/v1/logout` (204) and delete the token file.
- **CSP and OneSignal web push:** the v16 SDK loads a JSONP sync from `api.onesignal.com` as a SCRIPT, so `script-src`
  needs it beside `cdn.onesignal.com`. The SDK loads only once notification permission exists, so the sweep must grant
  it (`Browser.grantPermissions`) and open the push settings, or the path is never exercised (LifeWell 2026-10-29).
- **Every SPA rewrite answered with the prerendered home page** (`index.html`): a private address then carries the
  home canonical and `index, follow`. Point rewrites at a `noindex` app document with no canonical.
- **TBT on a busy host:** A/B the before and after builds served side by side, runs alternated, and compare medians
  and the longest task; three identical single runs read 2.2 to 4.8 s.
- **Contrast on `oklch()` colours (HabitForge 2026-10-29):** a lane reported dark sidebar labels at 2.91:1; read through a
  1×1 canvas (`fillStyle = computedColor` → `getImageData`) they were 7.69:1. Convert computed colours to sRGB that way
  before calling a contrast FAIL, and quote the two sRGB triples beside the ratio.
- **Tailwind v4 focus ring:** `outline-none` sets `--tw-outline-style: none`, so `focus-visible:outline-2` draws nothing.
  The check is the computed `outline-style` of `document.activeElement` after a real Tab key; the fix is
  `focus-visible:outline-solid` in the shared ring token.
- **Google-only auth (H25):** `GET /auth/v1/settings` showing `external.email: true` is a FAIL unless a
  `before_user_created` hook refuses non-test email sign-ups; prove it with one refused `POST /auth/v1/signup` (403) and
  one working automation password grant (200).

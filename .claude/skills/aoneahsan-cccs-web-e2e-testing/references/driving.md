# Driving the browser, multi-user isolation, and the regression matrix

Depth behind `SKILL.md`. Read when setting up the run, or when a flow needs more than one account.

## 🔴 First, prove which browser you are driving

Automation runs in a **dedicated Chrome for Testing install** under a **dedicated profile**, never the owner's
browser (`~/.claude/rules/browser-automation.md`). Before the first navigation:

```jsonc
{"action": "get_profile"}    // must be "ahsan-automation"
{"action": "browser_mode"}   // note the port; profile must match
```

Then confirm the process itself — the profile name alone does not prove the binary:

```bash
ps auxww | grep -- --remote-debugging-port | grep -v grep | grep -v -- --type=
# the path must contain "Google Chrome for Testing", NOT /Applications/Google Chrome.app
```

🔴 **Never hand-roll a launch** (`spawn`, a Playwright `executablePath`, an ad-hoc `--remote-debugging-port`)
pointed at a system Chrome — that bypass has been found in the wild and is exactly what the rule forbids.
Point every launcher at `$CHROME_WS_BROWSER`. And **never kill a browser you did not launch**: check its
`--user-data-dir` first; it may be another session's or the owner's.

## The hook, in full

```ts
// src/services/test-auth.dev.ts
// DEV ONLY. Its absence from dist/ is a build gate.
import {supabase} from '@/services/supabase';          // the app's REAL client
import {deleteAccountData} from '@/services/account';  // the REAL production deletion path

async function signIn(email: string, password: string) {
  const {data, error} = await supabase.auth.signInWithPassword({email, password});
  if (error) {
    // 🔴 Enumeration protection returns 'invalid-credential', NEVER 'user-not-found'.
    // Catching only the latter means auto-provisioning silently never fires.
    const missing = /user.not.found|invalid.credential|invalid_credentials/i.test(error.message);
    if (missing) return signUp(email, password);
    throw error;
  }
  return data.user;
}

async function deleteAccount() {
  // Reuse the production path, so deletion is genuinely exercised — not simulated.
  await deleteAccountData();
  return supabase.auth.admin === undefined ? supabase.auth.signOut() : undefined;
}

export function installTestAuth() {
  window.__lwTestAuth = {signIn, signUp, signOut, getUser, deleteAccount};
}
```

```ts
// main.tsx — the dynamic import is what keeps it out of the production bundle
if (import.meta.env.DEV) {
  void import('./services/test-auth.dev').then((m) => m.installTestAuth());
}
```

```ts
// vite-env.d.ts
interface Window {
  __lwTestAuth?: {
    signIn(email: string, password: string): Promise<unknown>;
    signUp(email: string, password: string): Promise<unknown>;
    signOut(): Promise<void>;
    getUser(): Promise<unknown>;
    deleteAccount(): Promise<void>;
  };
}
```

## Signing in without the password touching a transcript

The secret travels shell → CDP. Node ≥ 22 has a global `WebSocket`, so no dependency is needed.

```bash
node --input-type=module -e '
const fs = await import("node:fs");
const pw = fs.readFileSync(process.env.HOME + "/.secrets/test-accounts/automation-accounts.md", "utf8")
             .match(/`([^`]+)`/)[1];

const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
const page = targets.find(t => t.type === "page" && t.url.includes("localhost:5900"));
const ws = new WebSocket(page.webSocketDebuggerUrl);

await new Promise(r => ws.onopen = r);
ws.send(JSON.stringify({id: 1, method: "Runtime.evaluate", params: {
  awaitPromise: true,
  expression: `window.__lwTestAuth.signIn("aoneahsan.apps.t1+1@gmail.com", ${JSON.stringify(pw)})`,
}}));
ws.onmessage = (m) => { console.log(JSON.parse(m.data).id === 1 ? "signed in" : ""); ws.close(); };
'
```

Two details that matter: `JSON.stringify(pw)` so shell-hostile characters survive, and `awaitPromise: true`
so the evaluate resolves rather than returning a pending promise handle.

**Never** put the password in a tool argument, a URL, an environment variable dumped by `env`, or a file in
the repo.

## The leak gate, before every commit

```bash
# Read the prefix at runtime — quoting the literal in a committed file makes the
# gate match its own documentation and pass forever.
PREFIX=$(head -c 6 ~/.secrets/test-accounts/automation-accounts.md)
grep -rn "$PREFIX" . --exclude-dir=node_modules --exclude-dir=.git && echo "🔴 LEAK"
```

## Multi-user isolation

Two accounts need two isolated storage origins. Three options, cheapest first:

| Method | How | Note |
|---|---|---|
| **Two origins** | `localhost:5900` and `127.0.0.1:5900` | Different origins ⇒ different storage. **Vite binds only `localhost` by default** — start with `--host 127.0.0.1` or the second origin does not serve at all. |
| **Two browser profiles** | separate `--user-data-dir` | fully isolated, heavier |
| **An incognito context** | CDP `Target.createBrowserContext` | clean, no disk profile |

Verify server state **between** steps with the admin key — that a message left A is not evidence it arrived
at B.

## Seeding through the admin API

Create users through the backend admin API with the email **pre-confirmed** — never the UI signup flow, which
needs a real inbox.

```bash
curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE" \
  -H 'Content-Type: application/json' \
  -d '{"email":"aoneahsan.apps.t1+2@gmail.com","password":"'"$PW"'","email_confirm":true}'
```

Then verify the signup trigger created its dependent rows (a `profiles` row, a default settings record).
A user that exists in `auth` but not in `profiles` produces failures that look like permission bugs.

## Proving an RLS policy

A policy is proven by a **403-vs-200 pair against seeded data, as a non-admin** — never by reading the policy.

```
1. Seed a row owned by t1+1.
2. As t1+1  → expect 200 with ≥ 1 row.
3. As t1+2  → expect 403, or 200 with 0 rows if the policy filters rather than refuses.
4. As t1+1 with the ownership filter REMOVED from the query → expect 403.
```

Step 4 is the one that gets skipped, and it is the one that proves the policy is enforced by the *server*
rather than merely matched by the client's own filter.

## The regression matrix

Keep one per project at `docs/testing/BROWSER-TEST-RUNBOOK.md`. Every pass covers, in order:

**sign-in · sign-up · sign-out · account deletion · profile management · then the feature that changed.**

Record per row: date, account used (and whether it was admin), the assertion made against the server, and the
result. A row that does not name the account is not evidence — that ambiguity is exactly how the
admin-account trap survives a review.

## 🔴 When a screenshot disagrees with the DOM, suspect the screenshot

A wrong capture produces a **false defect report** — the most expensive outcome of a verification pass,
because it sends someone to fix a page that was never broken. The two known failures:

| What you see | What is actually happening |
|---|---|
| The element you scrolled to is "missing" | A **viewport capture after a programmatic scroll returns the page top**. Use a clipped capture with `captureBeyondViewport`, or capture the element |
| A dialog looks transparent, page bleeding through | The capture **caught the enter transition mid-flight**. Wait for it to settle, or assert the computed style instead of photographing it |

**Confirm against the live tree before writing the finding** — `getComputedStyle`, `elementFromPoint`, a
measured value. Same discipline as the admin-account row above: name what you measured, not what you appeared
to see.

🔴 **Full note, with the measurements and why each one fooled a reviewer, lives once at**
`~/.claude/rules-detail/browser-automation.md` § *Two ways a capture reports something that is not on the
page* — the tooling record owns it; this table is the working summary.

🔴 **The mirror of it:** the auditing account is part of the instrument too. Sweeping an **admin** surface
while signed in as a non-admin measures the *gate*, not the screens — every admin page truthfully renders its
"not an admin" state and the audit reports clean. Re-run admin surfaces as the owner, exactly as user flows
are re-run as a plain user (`../../aoneahsan-cccs-platform-admin/references/safety.md` §4).

## Signing in on a LIVE production build (no DEV hook) — windowsweep, 2026-11-05/06

A production bundle has no test hook, and Google sign-in cannot be driven headless. When an approved live check
needs a signed-in user:

1. Create the test alias through the Auth admin API (`email_confirm: true`); a Google-only `before_user_created`
   hook still refuses strangers who sign up themselves.
2. Get a session with `POST /auth/v1/token?grant_type=password` and the publishable key, inside the program
   (password read from the file at runtime, token never printed).
3. Give each account its own `Target.createBrowserContext`, so storage never mixes, and open the origin there.
4. Put the session JSON where the app's Supabase client reads it (`sb-<ref>-auth-token`, or the app's adapter key;
   windowsweep's strata adapter adopts the raw key once), then navigate. The app boots signed in.
5. For a write you must not let through (a plan, a badge), block it in the browser with `Fetch.enable` on the
   function URL and `Fetch.failRequest` for that action's body. Count what was blocked: 0 proves the refusal
   happened in the page.
6. Afterwards dispose the contexts, demote, delete the users, and read the counts back to the baseline.

## Measured on windowsweep, 2026-11-07

- **A fresh WebView2 profile is a production write.** Its first launch signs in anonymously and creates a user and device row. Reuse a profile that already holds a session for repeated release proofs. If a fresh profile was necessary, match its Local Storage identity to the server rows before deleting exactly those rows, then read back their absence (2026-11-08).

- **A production bundle has no test hook and no source modules.** Sign the test account in by taking a password-grant session
  from `/auth/v1/token?grant_type=password` (publishable key) in node and writing it raw under supabase-js's default key
  `sb-<ref>-auth-token` on the origin (a static file such as `/robots.txt` first), then load the page. A strata `importRawSync`
  adapter imports it. On a Vite dev server, `await import('/@vite/env')` before importing a source module, or `define` globals
  such as `__APP_VERSION__` are undefined.

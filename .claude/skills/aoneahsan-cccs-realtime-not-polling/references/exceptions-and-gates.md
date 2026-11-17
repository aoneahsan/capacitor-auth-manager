# Exceptions, markers, gates, and finding hidden polls

## The four exceptions

A line qualifies only when **every** condition in its row holds. Anything else is a polling bug.

| Kind | When it applies | Required properties | Examples |
|---|---|---|---|
| `no-push-remote` | The remote offers **no** webhook, callback, SSE or socket for this state (checked in its docs, with the date in the marker) | Runs on a **server, CLI or CI**, never in browser UI · exponential backoff · a ceiling (attempts or time) · stops on the terminal state · the result is then **pushed** (written to a row clients listen to) | A store or OTA management API's job status (`--wait` in CI), an Instagram media container's status, a provider batch-job status endpoint |
| `platform-no-connection` | The runtime **cannot** keep a connection open | The platform's own scheduler at its **longest acceptable** period · one read on open, wake or resume · never sub-minute without a stated reason | MV3 service worker (`chrome.alarms`; Chrome's minimum is 30 s since Chrome 120) · a suspended mobile app (background fetch) |
| `local-timer` | The timer **never asks for data**: it drives display, or writes a keepalive on an already-open push connection | Cleared on unmount · display only, or the open stream's heartbeat | A clock, a countdown, "3 min ago", a carousel, an animation, a debounce, a stream heartbeat or socket ping |
| `test-wait` | Test or harness code waiting on **local** state | Prefer `MutationObserver` or CDP events · a timeout · never in product code | E2E waits for an element, `aria-busy` cleared |

## The marker

Put it on the line, or the line above, in the file's own comment syntax:

```
// polling-exception: no-push-remote — Instagram container status has no webhook (checked 2026-11-03)
-- polling-exception: platform-no-connection — MV3 worker sleeps; alarm every 6 h + read on popup open
# polling-exception: test-wait — waits for the job row in the harness, 60 s ceiling
```

Grammar: `polling-exception: <kind> — <reason>`. The kind is one of the four above. A marker without a reason, or
with any other kind, fails review.

## Enforcement 1: ESLint, where lint gates CI

```js
// eslint.config.js (flat). If the project already sets no-restricted-syntax, MERGE these selectors into its array:
// a later config object replaces the whole rule, so a second entry would silently drop the first.
const noPolling = 'No polling: push the change (aoneahsan-cccs-realtime-not-polling). A true exception: ' +
  'eslint-disable-next-line no-restricted-syntax -- polling-exception: <kind> — <reason>';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "Property[key.name=/^(refetchInterval|refreshInterval|pollInterval)$/]", message: noPolling },
        { selector: "CallExpression[callee.name='setInterval']", message: noPolling },
        { selector: "CallExpression[callee.property.name='setInterval']", message: noPolling },
      ],
    },
  },
];
```

- **An approved exception:**
  `// eslint-disable-next-line no-restricted-syntax -- polling-exception: local-timer — the clock in the header`.
  ESLint accepts a description after `--` in directive comments.
- **What the rule cannot see:** a self-rescheduling `setTimeout` that fetches. Review catches it. The red flags in
  `SKILL.md` name it.

## Enforcement 2: a ratchet, where lint does not gate CI

A ratchet is a verify step that counts polling sites per file against a committed baseline:

- **Fail** when a file's count rises, or a file not in the baseline has a site, unless that line carries a
  `polling-exception:` marker.
- **Shrink the baseline in the same change** when a count drops, so it only ever goes down. Print the new counts.
- **Tie each baseline entry to its fix ticket,** so the baseline is also the backlog.

The form depends on the project's conventions:

- **A repo that already keeps `scripts/verify-*` tools:** a verify script, with a JSON baseline beside it, run in
  CI.
- **The owner's own projects** (no script files): ESLint (enforcement 1) is the gate, since those projects lint
  in CI.

**The plant test before trusting either gate:** add one `refetchInterval` in a scratch file, see the gate fail,
remove it, and see it pass.

## Grep patterns that find polls

| Stack | Pattern (ERE) | Look for |
|---|---|---|
| JS/TS | `refetchInterval\|refreshInterval\|pollInterval` | TanStack, SWR, Apollo intervals |
| JS/TS | `setInterval\(` | then read the callback: a request for data means poll; display, or a keepalive on an open stream, means `local-timer` |
| JS/TS | `setTimeout\(` in a function that also calls `fetch\|rpc\|select\|invoke\|axios` | self-rescheduling fetch |
| JS/TS | `while \(.*(done\|pending\|ready\|status)` | wait loops |
| Dart | `Timer\.periodic\|Stream\.periodic` | periodic refresh |
| PHP/Laravel | `sleep\(` inside a loop · `->everyMinute\(\)` scanning a queue table | wait loops, queue-scanning schedules |
| SQL / pg_cron | `cron\.schedule\(.*'\* \* \* \* \*'` whose job selects `queued\|pending` | a queue scanned on a timer |
| Python | `while True:` with `time\.sleep\(` | loops |
| Extensions | `chrome\.alarms\.create` and the `periodInMinutes` | sub-hour alarms need a reason |

Then classify each hit: a **data poll** (fix it), **exception** (mark it), or **local timer** (mark it
`local-timer`).

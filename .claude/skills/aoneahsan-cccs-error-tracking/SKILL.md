---
name: aoneahsan-cccs-error-tracking
description: 'Error tracking with Sentry: environment and release tagging, symbolication when production source maps are banned, PII scrubbing for health data, per-route error boundaries with a branded fallback, breadcrumb hygiene, noise filtering, the free-tier budget. Use when wiring error reporting or chasing an unreadable stack trace.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Error tracking

**Sentry, gated on its DSN** — an empty `VITE_SENTRY_DSN` means error tracking is fully off, so a project
ships ready and the owner switches it on.

## 🔴 Sentry is the record — and the error goes to the analytics destinations too

Owner directive, and R-023 in the master rules: **four destinations, not one.** Sentry alone means a spike is
invisible next to the usage it broke, and nobody notices for a week.

| Destination | Gets |
|---|---|
| Sentry | the full record — stack, breadcrumbs, tags, redacted |
| Amplitude | an `error_reported` event — **the only destination that acknowledges ingestion**, so it is the one you can prove landed |
| GA4 | its standard **`exception`** event: `description` = the error class, `fatal` = not handled |
| Clarity | `upgrade('error')`, so the replay of the session that broke is kept and findable |

*(R-023 calls the third one "Firebase error tracking". There is no such product — it means GA4's `exception`
event.)*

🔴 **The fact, never the message.** Analytics carries the error **class**, where, whether it was handled, and
the route *pattern*. An error message is free text and free text is unbounded — on a health app a database
error can interpolate a reading into its own message. A bounded-token guard on analytics properties makes this
structural rather than a habit.

**Fan out inside the report function itself**, never at the call sites — otherwise the next caller forgets,
and the failures that skip analytics are exactly the ones nobody is watching. **Share the rate limiter**: a
suppressed Sentry event must not still emit three analytics events, or one render loop drains a monthly quota
and a session cap together.

**In a browser extension there is no analytics half** — GA4 and Clarity load remote code, which is a store
rejection. Bundled Sentry is the whole story there.

## 🔴 Symbolication without shipping source maps

The house rule bans production source maps: no `.map` files, no `//# sourceMappingURL` in shipped assets. A
minified stack is unreadable. Both are satisfiable — **generate maps, upload them, then delete them before
the artifact is published.**

```ts
// vite.config.ts
export default defineConfig({
  build: {sourcemap: true},                    // generated for the upload…
  plugins: [
    sentryVitePlugin({
      org: '…', project: '…',
      authToken: process.env.SENTRY_AUTH_TOKEN,   // server-side only — never VITE_
      sourcemaps: {
        assets: './dist/**',
        filesToDeleteAfterUpload: ['./dist/**/*.map'],   // …and removed from the artifact
      },
      release: {name: process.env.APP_VERSION},
    }),
  ],
});
```

**Verify both halves**, because getting one is easy and getting both is the point:

```bash
find dist -name '*.map' | head            # must be empty
grep -rl 'sourceMappingURL' dist/ | head  # must be empty
```

A release with no uploaded map produces stacks like `a.b.c (index-4f2a.js:1:88213)` — technically an alert,
practically useless.

## Tag the release, or you cannot tell what is fixed

```ts
Sentry.init({
  dsn: env.SENTRY_DSN,                     // empty ⇒ never initialised
  environment: import.meta.env.MODE,
  release: __APP_VERSION__,                // must MATCH the uploaded map's release
  tracesSampleRate: 0.1,
  beforeSend,
});
```

Without a matching release name, the map and the event never meet.

## 🔴 PII scrubbing for a health app

```ts
function beforeSend(event: Sentry.ErrorEvent) {
  // Known noise — an extension or a cancelled navigation, not our bug
  if (/ResizeObserver loop|Non-Error promise rejection|Load failed/.test(event.message ?? '')) return null;

  // URLs carry ids and search terms in query strings
  if (event.request?.url) event.request.url = event.request.url.split('?')[0];

  // Never let a form value or a health reading ride along
  delete event.request?.data;
  event.user = event.user?.id ? {id: event.user.id} : undefined;   // id ONLY — no email
  return event;
}
```

Send the **user id and nothing else**. No email, no name, no health values, no note text, no search query. An
error report is a debugging aid, not a data export.

## Boundaries per route segment

One boundary at the app root turns any error into a blank app. **One per route segment**, plus one around each
independently-failing async region, so a broken chart does not take down the page around it.

Each renders the **branded fallback** — the product's voice, a way back, and a retry — never a white screen
and never a raw stack. See `aoneahsan-cccs-react-ui-ux`.

## Handled vs unhandled

Both belong, tagged differently. A caught-and-recovered failure (a retried fetch) is signal, not an incident;
mixing the two makes the unhandled ones impossible to find.

```ts
Sentry.captureException(err, {tags: {handled: 'true'}, level: 'warning'});
```

## The free-tier budget

**5,000 errors/month.** One error inside a render loop or a reconnect handler exhausts that in an afternoon
and blinds you for the rest of the month. Defences: `beforeSend` filtering of known noise, `tracesSampleRate`
well below 1, and a **client-side rate limit on repeated identical errors** — the same message more than N
times a minute is one event with a count, not N events.

## Common mistakes

| Mistake | What happens | Instead |
|---|---|---|
| Maps shipped to production | source published | upload then `filesToDeleteAfterUpload` |
| No maps uploaded at all | unreadable minified stacks | upload during build |
| Release name mismatch | map and event never meet | one version constant for both |
| Email or health data in the payload | medical data in a third-party tool | user id only |
| One root boundary | any error blanks the app | per route segment |
| No noise filter | 5k quota gone in an afternoon | `beforeSend` + rate limiting |
| `SENTRY_AUTH_TOKEN` in a `VITE_` var | secret in the bundle | build-time env only |

## Related skills

`aoneahsan-cccs-analytics` (the sibling pipeline) · `-react-ui-ux` (the branded fallback) ·
`-coding-standards` (env gating and the logger) · `-build-test-quality` via
`~/.claude/rules/build-test-quality.md` (the source-map ban this works around).

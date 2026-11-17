# Error tracking — overview

## Purpose

Two house rules collide here, and the collision is the reason the skill exists: **production source maps are
banned from shipping**, and **a minified stack trace is useless**. Both are satisfiable — generate maps,
upload them to Sentry during the build, then delete them from the artifact — but only if that is written down
somewhere, because the obvious readings are either "ship the maps" or "accept unreadable stacks".

The rest is the discipline a health app needs on top: an error report is a debugging aid, not a data export.

## What this skill does

- Gives the **symbolication-without-shipping** build configuration, with the two greps that verify both
  halves.
- Requires **release tagging that matches the uploaded map**, without which the map and the event never meet.
- Specifies **PII scrubbing** appropriate to health data — user id only, no email, no readings, no free text,
  query strings stripped.
- Requires **error boundaries per route segment** and around independently-failing async regions, each
  rendering the branded fallback.
- Separates **handled from unhandled** so recoveries do not bury incidents.
- Bounds the **5,000-errors/month free tier** and names the defences, including client-side rate limiting of
  repeated identical errors.

## When it gets invoked

- Wiring error reporting into a project.
- Adding an error boundary.
- A stack trace arriving unreadable or attributed to the wrong release.
- A noisy error consuming the monthly quota.
- A privacy review of what leaves the app.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project that reports errors |
| Stack override | 🔴 **Sentry is the error tracker, and it is not the only destination** — the same error also reaches GA4, Amplitude and Clarity as a bounded fact (owner, R-023). The concern is *readable stacks without publishing source, carrying no personal data, scoped so one failure does not blank the app* — and *findable in the analytics dashboards too*, so a spike is visible beside the usage it broke. In a browser extension the analytics half is unavailable (remote code), leaving bundled Sentry alone. |

## Sources

| Source | Record |
|---|---|
| The production source-map ban | `~/.claude/rules/build-test-quality.md` |
| The branded-fallback and error-page requirements | `aoneahsan-cccs-react-ui-ux` |
| Sentry Vite plugin behaviour (`filesToDeleteAfterUpload`) | verified against the plugin's documented options |

## Related skills

- `aoneahsan-cccs-analytics` — the sibling pipeline, same env-gating discipline
- `aoneahsan-cccs-react-ui-ux` — the branded fallback each boundary renders
- `aoneahsan-cccs-coding-standards` — env gating and the single logger
- `aoneahsan-cccs-verification` — proving a deliberately thrown error actually arrives

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/build-test-quality.md` (the source-map ban and
  the logger rule this works within).
- **Last reviewed:** 2026-07-25

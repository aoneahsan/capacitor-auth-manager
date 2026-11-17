# Realtime, never polling: overview

## Purpose

This skill holds the owner's no-polling law, and the means to keep it on any stack. On 3 Nov 2026 a teammate's review
of Shortlists' role automations noted that results arrived by polling ("not instant feedback … use Realtime Supabase
channels"). The owner made it law for every project: no feature or task polls for data. Live data is pushed; gaps are
closed by re-reading when the connection returns, and never by a timer.

## What this skill does

- **Bans the polling patterns:** `refetchInterval`, `refreshInterval`, `pollInterval`, a network `setInterval`, a
  self-rescheduling fetch, a backstop timer, a wait-until-done loop, a queue-scanning cron.
- **Maps each kind of waiting to its push source:** Supabase `postgres_changes` or Broadcast from the database,
  Firestore listeners, Laravel broadcasting, SSE and WebSockets, provider webhooks, extension messaging, Flutter
  streams, Tauri events.
- **Gives one client pattern:** the event is a signal, gaps close on rejoin, focus, online and visible, the channel
  lifecycle is owned, the filter is bounded, and the feature switch is respected.
- **Moves time-based UI to a local clock** (a server timestamp and a local timer), with no network.
- **Moves server work to a kick on enqueue,** keeping cron only for timed work.
- **Defines four narrow exceptions,** each carrying an inline marker.
- **Enforces the law** with an ESLint rule or a ratchet gate.
- **Proves each surface four ways:** latency, an idle network, a closed gap and a plant.

## When it gets invoked

- "stop polling", "use realtime / websockets", "make it instant", "the update is slow", "live updates"
- "show progress", "notify when it's done", "the badge doesn't update", "refresh automatically"
- Code under review or edit containing `refetchInterval`, `setInterval`, `refreshInterval`, `pollInterval`, `poll`,
  or a cron that looks for new rows.
- Designing anything with a status that changes after the first render: jobs, AI generation, imports, exports,
  payments, notifications, presence, release checks.

## Where it applies

| Scope | Applies |
|---|---|
| Projects | Every project: the owner's own, team (Shortlists) and client, by his order of 3 Nov 2026 |
| Stack override | The concern is "pushed, never polled". Each stack meets it with its own push channel (see `references/stacks.md`) |

## Sources

| Source | Record |
|---|---|
| Owner directive, 3 Nov 2026, verbatim | `~/.claude/rules-detail/realtime-not-polling.md` |
| Supabase Realtime docs (postgres-changes, broadcast, limits), pg_net docs, changelog, all fetched 3 Nov 2026 | summarised in `references/migrate-and-verify.md` and `references/server-side.md` |
| Shortlists role automations (P-SL-48): the first migration off polling | `references/stacks.md` hook pattern |

## Related skills

- `aoneahsan-cccs-supabase-realtime`: Supabase channels, RLS, socket auth and broadcast in depth.
- `aoneahsan-cccs-react-api-tanstack-query`: the queries the signal invalidates.
- `aoneahsan-cccs-supabase-edge-functions`: the workers a kick starts.
- `aoneahsan-cccs-update-flow`: release checks are pushed, never interval-polled.
- `aoneahsan-cccs-extension-website-connect`: the device link without a poll.
- `aoneahsan-cccs-verification`: the four proofs feed its evidence rule.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/realtime-not-polling.md`,
  `~/.claude/rules/data-fetch-budget.md`
- **Last reviewed:** 2026-11-03

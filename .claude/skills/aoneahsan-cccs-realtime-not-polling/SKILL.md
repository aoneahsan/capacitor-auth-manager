---
name: aoneahsan-cccs-realtime-not-polling
description: 'The no-polling law for every project (own, team and client): live data is pushed, never fetched on a timer. Use when anything shows changing data (job progress, AI results, notifications, badges, counters, statuses, release checks), when code holds refetchInterval, setInterval, a recursive setTimeout fetch, a cron scanning a queue or a wait-until-done loop, or when a reviewer calls an update slow or not instant.'
metadata:
  source: 'Owner directive 2026-11-03 (Shortlists role automations, after a teammate''s review): "we need to stop using … polling in any and all features/tasks we do" · "this is a global custom skill for all project" (Shortlists, personal and client projects). Supabase facts checked against its docs 2026-11-03 (postgres-changes, broadcast, limits, pg_net, changelog).'
---

# Realtime, never polling

## Overview

Data reaches a screen because something **told it** the data changed, never because a timer asked. A poll is late
by up to its interval and costs every open tab all day.

**The standard:** zero data requests on a timer. Every live surface has a push source, closes its gaps on reconnect,
and is proved with a latency measurement and an idle network.

**Scope:** every project (own, team and client), by the owner's direct order; the work-project carve-out does not
exempt it. His words: `~/.claude/rules-detail/realtime-not-polling.md`.

## 🔴 Banned

- `refetchInterval` (TanStack), `refreshInterval` (SWR), `pollInterval` (Apollo) on data.
- `setInterval`, or a self-rescheduling `setTimeout`, that calls the network.
- A "slow poll as a backstop" beside a channel. Re-reading on reconnect closes the same gap.
- A `while (!done)` or "wait until ready" loop in product code.
- A cron whose job is to look for new work. Kick the worker when the work is queued.

## Pick the push source

| You are waiting for | Push source |
|---|---|
| A row change you may read (Supabase) | `postgres_changes` with a filter the policy can prove, used as a re-read signal (`aoneahsan-cccs-supabase-realtime`) |
| A hot table, many subscribers (~3,000+), or a chosen payload | Broadcast from the database: a trigger calls `realtime.send` on a private topic |
| Firestore data | `onSnapshot` on a bounded query |
| A Laravel backend | broadcasting (Reverb/Pusher) on private channels, Echo on the client |
| Your own server | SSE (one-way) or a WebSocket |
| A provider's state (payment, calendar, mail, CI, store) | its signed webhook → your DB → Realtime |
| Server work finishing (AI, export, import) | the worker writes progress rows; clients listen to those rows |
| New work for a worker | kick on enqueue (trigger → `pg_net`, DB webhook, queue consumer); cron only for timed work |
| Extension, Flutter, Tauri | runtime messaging and `externally_connectable`; streams; `emit`/`listen` |
| A moment in time ("delayed after 10 min", "sends in 2 days") | the server returns the timestamp; a local timer flips the UI, with no request |

## The client pattern

1. **The event is a signal:** a debounced re-read through the normal authorised query (`invalidateQueries`), never
   the payload as data.
2. **Close gaps without a timer:** re-read on every `SUBSCRIBED` (first join and each rejoin), focus, `online` and
   visible.
3. **Own the lifecycle:** one uniquely named channel per mounted owner, removed on unmount; on `CHANNEL_ERROR`,
   `TIMED_OUT` or `CLOSED`, resubscribe with backoff (1 s to 30 s); keep the socket's auth fresh.
4. **Bound it:** a filter the row policy can prove (Supabase `in` takes up to 100 values); a paginated re-read.
5. **Respect the switch:** behind a feature switch, no channel opens and nothing is read.

Copy-ready hooks for each stack are in `references/stacks.md`.

## The four exceptions

Each one carries `// polling-exception: <kind> — <reason>` on the line. Anything else is a polling bug.

1. **`no-push-remote`:** a remote with no webhook, SSE or socket. Poll only on a server or in a CLI, with
   backoff, a ceiling and a terminal stop, then push the result onward. Never from browser UI.
2. **`platform-no-connection`:** the runtime cannot hold a connection (MV3 service worker, suspended app): its own
   scheduler at the longest acceptable period, plus one read on open or wake.
3. **`local-timer`:** clocks, countdowns, carousels, animation and keepalives on an open push stream: nothing asks
   for data.
4. **`test-wait`:** harness waits on local state. Prefer `MutationObserver` or CDP events.

## Prove it: all four, or it is not done

1. **Latency:** a server write shows on screen in ≤ 2 s. Measure it.
2. **Idle:** 0 periodic requests over 2 minutes with the screen open.
3. **Gap:** go offline, change the data, come back online, and the change shows.
4. **Plant:** remove the subscription, and the latency check fails.

The CDP recipes are in `references/migrate-and-verify.md`.

## Enforce it

ESLint `no-restricted-syntax` on `refetchInterval`, `refreshInterval`, `pollInterval` and `setInterval` where lint
gates CI; otherwise a ratchet verify step that fails any new unmarked site (`references/exceptions-and-gates.md`).

## Rationalizations → reality

| Excuse | Reality |
|---|---|
| "A slow poll is a safe backstop" | Re-reading on rejoin, focus and `online` closes the same gap with zero requests |
| "It's only every 30 s" | It's late by up to 30 s, and it costs every tab, every user, all day |
| "That table isn't in Realtime" | One migration publishes it, or a trigger broadcasts |
| "The countdown needs refreshing" | A server timestamp and a local clock |
| "The cron already runs every minute" | Kick on enqueue; the cron stays for schedules and as a safety net |
| "The provider has no webhook" | Exception 1: poll server-side with backoff, then push |

## Red flags: STOP

`refetchInterval` or `setInterval` near `fetch`/`rpc`/`select`/`invoke` · "poll" in a name · `every N seconds` in a
design · a timer beside a channel · a cron that "checks for new" · a progress bar fed by a timer.

## Going deeper

- `references/stacks.md`: one complete pattern per stack (a generic `useRealtimeSignal` hook, Firestore, Echo, SSE,
  extensions, Flutter, Tauri, time-based UI).
- `references/server-side.md`: the `pg_net` worker kick with coalescing and exception safety, webhooks, progress
  rows, and what a cron may still do.
- `references/exceptions-and-gates.md`: the exceptions in detail, the marker grammar, the ESLint config, the ratchet
  and the grep patterns that find hidden polls.
- `references/migrate-and-verify.md`: converting a poll step by step, Supabase limits and traps, and the four
  proofs as CDP recipes.

## Related skills

`aoneahsan-cccs-supabase-realtime` (Supabase channels, RLS, socket auth, broadcast) · `-react-api-tanstack-query` ·
`-firestore` · `-laravel` · `-browser-extension` · `-extension-website-connect` · `-flutter-state-riverpod` ·
`-supabase-edge-functions` · `-update-flow` · `-verification`

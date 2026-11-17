# Converting a poll, and proving the push works

## Converting an existing poll, step by step

1. **Inventory.** Run the grep patterns in `exceptions-and-gates.md` over the whole project. List each hit with
   its file:line, its author and its surface.
2. **Classify each hit:** a data poll, one of the four exceptions, or a local timer. Mark the exceptions and the
   timers now.
3. **For each data poll, ask what changes the data.** That writer is where the push begins: a table, a provider,
   a worker, or a moment in time.
4. **Choose the source** with the table in `SKILL.md`. Prefer the table the screen already reads, so the re-read
   is the query that exists.
5. **Make the server push.**
   - Publish the table, or broadcast from a trigger.
   - Have the worker write progress rows.
   - Take provider webhooks.
   - Return a timestamp for time-based state.
6. **Make the client listen.** Add the signal hook (`stacks.md`) beside the query, with the same scope and a
   filter the policy can prove.
7. **Remove the interval:** `refetchInterval` and the `setInterval`. Raise `staleTime`, because the signal now
   marks the data stale.
8. **Close the gaps.** Re-read on rejoin, focus, `online` and visible. These come with the hook.
9. **Move time-based state** (delayed, overdue, "sends at") to a server timestamp and a local flip.
10. **Prove** the four checks below, then **record** the source, the filter and the numbers. Shrink the gate's
    baseline.

## Supabase: facts and traps (docs checked 3 Nov 2026)

| Topic | Fact | So |
|---|---|---|
| Publishing | A table emits `postgres_changes` only when it is in `supabase_realtime`: `alter publication supabase_realtime add table public.x;` | Guard it idempotently (`pg_publication_tables`) in a migration |
| Authorisation | Each change is checked against each subscriber's SELECT policy, one check per subscriber | Keep the policy cheap and indexed. A missing policy means a channel that connects and never delivers |
| Throughput | Changes are processed on a single thread; a bigger compute size barely helps. Beyond about 3,000 concurrent subscribers on the same changes, the docs say to use Broadcast | Broadcast from the database for hot tables and wide fan-out |
| Filters | `eq neq lt lte gt gte in like ilike match imatch is isdistinct`, with a `not.` prefix. Comma-joined conditions are AND; there is no OR. `in` takes at most 100 values | Chunk long id lists into several channels |
| DELETE | Old-row data arrives only with `replica identity full`, and you can filter deletes only then. RLS is not applied to delete events | Broadcast a payload you chose when deletes matter |
| Broadcast from the database | `realtime.send(payload, event, topic, private)`, and `realtime.broadcast_changes(...)` in triggers. Database broadcasts are private by default and need a SELECT policy on `realtime.messages` for `authenticated` | Clients call `supabase.realtime.setAuth()`, then `channel(topic, { config: { private: true } })` |
| The schema lock | Since 14 Jul 2026 the `realtime` schema is locked: creating, altering or dropping objects there fails, but policies on `realtime.messages` still work | Put your helpers in `public` or a private schema, never in `realtime` |
| Quotas (Free / Pro) | Concurrent connections 200 / 500; messages 100/s / 500/s; channel joins 100/s / 500/s; 100 channels per connection; broadcast payload 256 KB / 3,000 KB; postgres_changes payload 1,024 KB | One socket per tab with many channels on it; remove channels on unmount; filter on the server |
| Data API exposure | New public tables are no longer exposed automatically (enforced 30 Oct 2026) | The re-read path needs explicit grants and RLS. The signal works only for rows the user may read |
| Node clients | realtime-js on Node < 22 needs `ws` passed as `realtime.transport` | Matters for server-side listeners only |

Re-check the changelog (`https://supabase.com/changelog.md`) for Realtime entries before relying on a limit.

## The four proofs (CDP recipes)

Drive the real app over CDP (`aoneahsan-cccs-web-e2e-testing`), signed in as a **non-admin**, against the
development backend.

1. **Latency.**
   - In the page, put a `MutationObserver` on the element that shows the data. Record
     `performance.now() + performance.timeOrigin` when it changes.
   - Make the change on the server (SQL through the management API, or a second client), and record the wall
     clock just before the write.
   - **Pass:** the change shows in 2 s or less. Run it 5 times and report the worst.
2. **Idle network.**
   - Enable the CDP `Network` domain, leave the screen open and untouched for 120 s, and count
     `Network.requestWillBeSent`. The websocket's frames are `Network.webSocketFrame*` and do not count.
   - **Pass:** 0 data requests.
3. **Gap.**
   - Call `Network.emulateNetworkConditions({ offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })`,
     make the change on the server, wait 10 s, then set `offline: false`.
   - **Pass:** the change shows within 5 s of coming back, from the rejoin or `online` re-read.
4. **Plant.**
   - Run proof 1 against a copy with the subscription removed, or disabled by a flag.
   - **Pass:** proof 1 FAILS. Otherwise proof 1 proves nothing.

Also prove **the switch off**: with the feature switch off, no channel opens (`Network.webSocketFrameSent` carries
no `phx_join` for the topic) and the surface makes no request.

## Recording

Write down, per converted surface: the push source and filter, the published table or topic, the four
proofs' numbers, and the plant's failure. Record any exception with its marker text and the date its remote was
checked.

## Measured on windowsweep, 2026-11-07

- 🔴 **The plant in a production bundle:** CDP `Network.setBlockedURLs` does NOT stop a WebSocket (the signal still arrived in
  1.2 s), and a `WebSocket` that throws breaks the whole Supabase client, so the page never renders. Install a stand-in that
  constructs and never opens (`readyState 0`, no-op `send`/`close`/listeners) with `Page.addScriptToEvaluateOnNewDocument`:
  REST reads still work, no subscription can exist, and the change must not reach the screen until an `online` event re-reads.
- **Count only your backend in the idle window.** Analytics beacons (Clarity `collect`) are not data polling; list them apart.

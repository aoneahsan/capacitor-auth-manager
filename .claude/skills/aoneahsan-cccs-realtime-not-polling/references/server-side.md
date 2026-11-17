# Server side: work starts when it is queued, and results are pushed

Polling hides on the server too. Examples are a worker on a one-minute cron that "looks for new rows", a loop that
waits for a provider, and a job that clients ask about every few seconds. Each has a push shape.

## Kick the worker on enqueue (Postgres + `pg_net`)

**The shape:** a statement-level trigger on the queue table calls the worker over HTTP the moment due work is
committed. A cron stays only for timed work (see the last section).

```sql
-- One row of state, so a burst of inserts kicks the worker once a second, not once per row.
create table if not exists public.worker_kick (
  singleton boolean primary key default true check (singleton),
  kicked_at timestamptz not null default '-infinity'
);
insert into public.worker_kick (singleton) values (true) on conflict do nothing;
alter table public.worker_kick enable row level security;          -- no policy: no API role reads or writes it
revoke all on public.worker_kick from public, anon, authenticated;

create or replace function public.kick_worker() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.engine_enabled() then return; end if;               -- the feature switch: off means silent
  update public.worker_kick set kicked_at = now()
   where singleton and kicked_at < now() - interval '1 second';
  if not found then return; end if;                                -- already kicked within the last second
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_base_url') || '/process-jobs',
    headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000);
exception when others then
  raise warning 'kick_worker failed, the safety-net cron will pick the work up: %', sqlerrm;  -- never fail the insert
end $$;
revoke execute on function public.kick_worker() from public, anon, authenticated, service_role;

create or replace function public.tg_kick_on_queued() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from new_rows where status = 'queued' and run_at <= now() + interval '1 second') then
    perform public.kick_worker();
  end if;
  return null;
end $$;
revoke execute on function public.tg_kick_on_queued() from public, anon, authenticated, service_role;

drop trigger if exists kick_on_insert on public.job_runs;
create trigger kick_on_insert after insert on public.job_runs
  referencing new table as new_rows for each statement execute function public.tg_kick_on_queued();
```

**Facts that shape it** (pg_net docs, checked 3 Nov 2026):

| Fact | Consequence |
|---|---|
| `net.http_post(url, body, params, headers, timeout_milliseconds)`; the default timeout is 2,000 ms, and the call returns a request id | Read the worker's URL and secret from Vault, never from a literal |
| "HTTP requests are not started until the transaction is committed" | A rolled-back enqueue never calls the worker, so the kick sees only committed work |
| Reliable up to about 200 requests per second | Coalesce: one kick a second, not one per row |
| Responses live in `net._http_response` for 6 h; the tables are unlogged | Never treat the response table as a record; the worker's own rows are the record |

The rules that make it safe:

- **The kick must never fail the write.** Use an `exception` block with a warning. The safety-net cron still runs.
- **Use a statement-level trigger** with a transition table. A 200-row insert is one check, not 200.
- **Only due work kicks.** A run scheduled for later (`run_at` in the future) waits for the cron. The worker's own
  updates (claim, finish) must not match the trigger's condition.
- **Transition tables allow one event per trigger.** INSERT and UPDATE need two triggers, which can share one
  function.
- **The worker is idempotent and leased** (claims use `for update skip locked` plus a lease), because a kick and
  the cron can overlap.
- **Revoke EXECUTE** on every new function from the API roles. Trigger functions fire without it.
- **Rehearse it in a rolled-back request.** Count the rows in `net.http_request_queue` inside the transaction:
  2 statements give 1 request; a plant without the coalescing gives 2.

**Alternatives with the same shape:**

- Supabase Database Webhooks: these are `pg_net` triggers configured in the dashboard. Prefer a migration, which
  is reviewable.
- A queue with a push consumer: pgmq plus a kicked consumer, or Cloudflare or SQS queues.
- Laravel: dispatch a queued job `afterCommit`. The queue worker is a long-running consumer, not a poller.

## Events that arrive later: trigger on the arrival, not on a timer

When work waits for something else to land (a transcript, a payment, an upload), put a trigger on the table where
it lands. That trigger re-queues the waiting item and kicks the worker. Keep it exception-safe and cheap, because it
runs on someone else's write path. A timed sweep can stay as the safety net, for example "no transcript after 2 h,
mark it missing".

## Provider webhooks into your database

A payment, calendar, mail, CI or store provider tells you about changes through its webhook. Never poll it from
the client.

1. **Verify the signature;** reject anything unsigned.
2. **Process it idempotently,** keyed on the provider's event id, because providers retry.
3. **Write the state to your table.** Clients learn of it through Realtime on that table.
4. **Reconcile on a long timed sweep** (daily) where the provider can drop events. That is timed work, not a poll.

When a provider truly offers no push, it is exception `no-push-remote` (`exceptions-and-gates.md`): poll it on the
server, with backoff and a ceiling, and write the result to your table.

## Progress rows for long jobs

- **One job row** carries the counts (queued, running, done, failed …), updated by a trigger from the item rows.
  Clients listen to the job row, filtered by its id or by its parent.
- **Never stream every item to every client.** One job-row change per item is enough. For very fast items, update
  the counts at most every 0.5–1 s, inside the worker.
- **Time left and "delayed"** come from server timestamps (`started_at`, the oldest queued `run_at`, a
  `delayed_after`). The client derives the moment locally (`stacks.md`), so nothing re-asks.

## What a cron may still do

| Allowed | Not allowed |
|---|---|
| Timed work: "send in 2 days", "the call ended at 14:00", "expire at midnight" | "Every minute, check whether new work arrived" as the main path |
| A safety net beside a kick, picking up what a failed kick missed | Asking a provider for status when it offers a webhook |
| Reconciliation at a long interval (hourly, daily) | Feeding a UI progress bar |
| Cleanup and retention | Any client-side timer |

Run timed work at the granularity it needs. One minute is fine for "in 2 days", and a delay counted in minutes is
honest.

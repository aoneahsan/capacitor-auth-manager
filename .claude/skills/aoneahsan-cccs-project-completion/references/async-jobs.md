# Async jobs — long actions never block the person

**Last Updated:** 2026-10-21 (owner request of that day).

## The rule

Any action that can take longer than about two seconds (an export, an import, an AI generation, a bulk email,
a report, a media conversion) runs as a **server job**, never as a held-open request with a spinner.

## The shape

1. **A `jobs` table** (or the project's existing equivalent; reason it in `docs/database/SCHEMA.md` first):
   `id`, `user_id`, `kind`, `status` (`queued` · `running` · `succeeded` · `failed` · `cancelled`), `progress`
   (0–100, optional), `result_ref` (what the person opens when it finishes), `error_code`, timestamps. RLS: the
   owner reads their own rows; only the server writes status.
2. **Work runs on the server**: a Supabase Edge Function invoked by the request, with `pg_cron` or a queue for
   retries (`aoneahsan-cccs-supabase-edge-functions`). The client gets the job id at once.
3. **One Jobs page** in every product with jobs, reached from the same place (account menu / phone Account tab):
   every job with its status, progress, time, and an action (open the result, retry, cancel).
4. **Immediate feedback** when the job starts: an inline confirmation with a link to the Jobs page
   (`aoneahsan-cccs-interaction-feedback`). Never a blocking modal.
5. **A notification when it finishes** — in-app inbox, plus push where the product has it — with one clear CTA
   that opens the result page. A failure says what failed and offers retry.
6. **Live status, pushed, never polled:** Supabase Realtime on the person's own job rows as a re-read signal
   (`aoneahsan-cccs-supabase-realtime`), the worker kicked on enqueue, and gaps closed on rejoin, focus and
   `online` (`aoneahsan-cccs-realtime-not-polling`). Where Realtime is not wired yet, wiring it is part of the
   job, never a reason to poll.

## Data processing

Filtering, sorting, grouping and counting happen in the database first, then the backend; the client receives
only what the person sees (`data-fetch-budget.md`, `aoneahsan-cccs-data-contract`).

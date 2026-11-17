# Push patterns, one per stack

Each pattern below is complete. Each follows the same contract:

- the event is a **signal**, and the re-read goes through the normal authorised path;
- gaps close on rejoin, focus, `online` and visible;
- the owner removes the channel on unmount;
- nothing opens behind an off switch.

Supabase channel and RLS depth is in `aoneahsan-cccs-supabase-realtime`.

## React + TanStack Query + Supabase: `useRealtimeSignal`

The one hook every Supabase + TanStack project should carry. Put it at `src/lib/realtime/useRealtimeSignal.ts`.

```ts
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useId } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type Options = {
  /** Readable prefix; the hook appends a per-mount id so two mounts never share a channel. */
  name: string;
  table: string;
  /** A postgres_changes filter the table's SELECT policy can prove, e.g. `shortlist_id=eq.<id>`, or null for none. */
  filter: string | null;
  /** Queries to re-read on a change. Their own queryFns stay the only data path. */
  queryKeys: readonly QueryKey[];
  enabled?: boolean;
  /** One re-read per burst: a 200-row job fires 200 changes. */
  debounceMs?: number;
};

/**
 * Re-reads `queryKeys` whenever `table` changes under `filter`, and whenever a gap may have opened:
 * on every SUBSCRIBED (first join and each rejoin), when the tab becomes visible, and when the browser comes online.
 * A failed channel is removed and re-joined with backoff (1 s doubling to 30 s): that retries the subscription,
 * never a data request. No timer ever reads data.
 */
export const useRealtimeSignal = ({ name, table, filter, queryKeys, enabled = true, debounceMs = 600 }: Options) => {
  const queryClient = useQueryClient();
  const instance = useId();
  const keysJson = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!enabled) return;
    const keys = JSON.parse(keysJson) as QueryKey[];
    let channel: RealtimeChannel | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1_000;
    let closed = false;

    const reread = () => {
      if (debounce) return;
      debounce = setTimeout(() => {
        debounce = null;
        keys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));
      }, debounceMs);
    };

    const join = () => {
      channel = supabase
        .channel(`${name}-${instance}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, reread)
        .subscribe((status) => {
          if (closed) return;
          if (status === 'SUBSCRIBED') {
            backoff = 1_000;
            reread(); // closes whatever happened while we were not listening
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            if (channel) void supabase.removeChannel(channel);
            channel = null;
            if (!retry) {
              retry = setTimeout(() => {
                retry = null;
                if (!closed) join();
              }, backoff);
              backoff = Math.min(backoff * 2, 30_000);
            }
          }
        });
    };

    const onVisible = () => document.visibilityState === 'visible' && reread();
    join();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', reread);
    return () => {
      closed = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', reread);
      if (debounce) clearTimeout(debounce);
      if (retry) clearTimeout(retry);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled, name, instance, table, filter, keysJson, debounceMs, queryClient]);
};
```

- **Use:**
  `useRealtimeSignal({ name: 'role-jobs', table: 'jobs', filter: \`role_id=eq.${roleId}\`, queryKeys: [jobsKey(roleId)], enabled: SWITCH_ON })`.
- **The query:**
  - leave `refetchInterval` unset;
  - give it a generous `staleTime`, because the signal is what marks it stale;
  - keep the app's `refetchOnWindowFocus`. If the app disables focus refetch globally, add a `focus` listener
    beside `online`.
- **Many ids:** an `in.(…)` filter takes at most 100 values, so chunk longer lists into several signals.
- **Private channels and Broadcast from the database:** call `await supabase.realtime.setAuth()` before
  subscribing, then use `supabase.channel(topic, { config: { private: true } })` and `.on('broadcast', { event }, …)`.

## Time-based UI: a server timestamp and a local timer

The server says *when* something becomes true. The client flips at that moment and makes no request.

```ts
import { useEffect, useState } from 'react';

/** True once `at` (ISO) has passed. Re-renders at that moment, and makes no request. */
export const usePassed = (at: string | null): boolean => {
  const target = at ? Date.parse(at) : Number.NaN;
  const [tick, setTick] = useState(0);
  const passed = Number.isFinite(target) && Date.now() >= target;
  useEffect(() => {
    if (!Number.isFinite(target) || passed) return;
    // setTimeout holds at most 2^31-1 ms (~24.8 days): a longer wait re-arms at that cap instead of firing early.
    const t = setTimeout(() => setTick((n) => n + 1), Math.min(target - Date.now(), 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [target, passed, tick]);
  return passed;
};
```

- **"Delayed" or "overdue":** the server returns `delayed_after`; `delayed || usePassed(delayed_after)`.
- **Countdowns and "2 min ago":** a ticking clock is a `local-timer` exception, and it never fetches.

## Firestore: `onSnapshot`

```ts
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';

/** Keeps the `['jobs', roleId]` cache equal to the live, bounded query. The first snapshot is the baseline:
 *  render it, but never announce its rows as new (a toast per existing row on every reload). */
export const useJobsLive = (roleId: string) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const q = query(collection(db, 'jobs'), where('roleId', '==', roleId), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(
      q,
      (snap) => queryClient.setQueryData(['jobs', roleId], snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => void queryClient.invalidateQueries({ queryKey: ['jobs', roleId] }),
    );
  }, [roleId, queryClient]);
};
```

- **The query:** the list query must prove its security rule from its own filters (`data-fetch-budget`).
- **Reads:** every snapshot delivery counts reads, so bound the query.

## Laravel: broadcasting and Echo

```php
// app/Events/JobUpdated.php
class JobUpdated implements ShouldBroadcast
{
    public function __construct(public int $roleId) {}
    public function broadcastOn(): array { return [new PrivateChannel("role.{$this->roleId}")]; }
    public function broadcastWith(): array { return ['roleId' => $this->roleId]; } // a signal, not the data
}
// routes/channels.php
Broadcast::channel('role.{roleId}', fn ($user, int $roleId) => $user->canViewRole($roleId));
```

```ts
window.Echo.private(`role.${roleId}`).listen('JobUpdated', () => queryClient.invalidateQueries({ queryKey: ['jobs', roleId] }));
// cleanup: window.Echo.leave(`role.${roleId}`)
```

- **Server:** Reverb, first-party (`php artisan install:broadcasting`), or Pusher. Dispatch the event where the
  state changes, after commit (`ShouldDispatchAfterCommit`).

## Your own server: SSE or WebSocket

- **SSE:** one-way, plain HTTP, and the browser reconnects by itself.

  ```ts
  const es = new EventSource('/api/live?topic=role-42', { withCredentials: true });
  es.addEventListener('changed', () => void queryClient.invalidateQueries({ queryKey: ['jobs', 42] }));
  es.addEventListener('open', () => void queryClient.invalidateQueries({ queryKey: ['jobs', 42] })); // rejoin = re-read
  // cleanup: es.close()
  ```

  - The server sends `text/event-stream` with `id:` lines, so `Last-Event-ID` resumes, and `retry:` sets the
    reconnect delay.
- **WebSocket:** use it when the client also sends. Reconnect with the same backoff as the hook above, and re-read
  on open.

## Browser extensions (MV3)

- **Website → extension, at once:**
  - declare `externally_connectable.matches` for the site;
  - the page calls `chrome.runtime.sendMessage(EXTENSION_ID, { type: 'linked' })` the moment the user approves;
  - the extension handles it in `chrome.runtime.onMessageExternal`.

  This replaces every "poll until approved" loop.
- **Popup ↔ background:** `chrome.runtime.sendMessage` / `onMessage`. Shared state: `chrome.storage.onChanged`.
- **Popup open:** a popup may hold a Supabase channel while it is open, with the same hook rules.
- **The background service worker** cannot hold a socket, because it sleeps.
  - Use `chrome.alarms` only as a `platform-no-connection` exception, at the longest acceptable period. Chrome
    enforces a minimum, 30 s since Chrome 120.
  - Read once on `runtime.onStartup` and when the popup opens.

## Flutter (supabase_flutter, Riverpod)

```dart
final jobProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, jobId) {
  return Supabase.instance.client.from('jobs').stream(primaryKey: ['id']).eq('id', jobId);
});
```

- **Several tables, or a re-read:** a channel with
  `.onPostgresChanges(event: PostgresChangeEvent.all, schema: 'public', table: 'jobs', filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'role_id', value: roleId), callback: (_) => ref.invalidate(jobsProvider))`,
  then `.subscribe()`, removed in `ref.onDispose`.
- **Resume:** on `AppLifecycleState.resumed`, `ref.invalidate(...)` once. That is the gap re-read, not a timer.
- **Never `Timer.periodic`** to refresh data.

## Tauri

- **Rust:** `app.emit("job-progress", &payload)?` when state changes.
- **Frontend:** `const unlisten = await listen('job-progress', () => invalidate())`, and `unlisten()` on teardown.
- **The webview's own data:** the same rules as React above.

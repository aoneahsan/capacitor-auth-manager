# URL state hooks

One module per project: `src/lib/hooks/useUrlState.ts`.

## Base

```ts
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type SetOptions = { replace?: boolean };

function useUrlParam(key: string) {
  const [params, setParams] = useSearchParams();

  const set = useCallback((value: string | null, { replace = true }: SetOptions = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '') next.delete(key);   // default ⇒ absent
      else next.set(key, value);
      return next;
    }, { replace });
  }, [key, setParams]);

  return [params.get(key), set] as const;
}
```

Two details matter: the functional update to `setParams` (so concurrent updates to different params do not
clobber each other), and deleting rather than setting an empty value (so a cleared filter leaves no `?q=` in
the URL).

## Typed variants

```ts
export function useUrlBooleanState(key: string, opts?: SetOptions) {
  const [raw, set] = useUrlParam(key);
  return [raw === '1', useCallback((v: boolean) => set(v ? '1' : null, opts), [set])] as const;
}

export function useUrlStringState<T extends string>(key: string, fallback: T, allowed?: readonly T[]) {
  const [raw, set] = useUrlParam(key);
  const value = (allowed && raw && !allowed.includes(raw as T)) ? fallback : ((raw as T) ?? fallback);
  return [value, useCallback((v: T) => set(v === fallback ? null : v), [set, fallback])] as const;
}

export function useUrlNumberState(key: string, fallback: number) {
  const [raw, set] = useUrlParam(key);
  const parsed = raw === null ? fallback : Number(raw);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return [value, useCallback((v: number) => set(v === fallback ? null : String(v)), [set, fallback])] as const;
}

export function useUrlListState(key: string) {
  const [raw, set] = useUrlParam(key);
  const value = raw ? raw.split(',').filter(Boolean) : [];
  return [value, useCallback((v: string[]) => set(v.length ? v.join(',') : null), [set])] as const;
}
```

The `allowed` allowlist in `useUrlStringState` is a small but real safeguard: URLs are user-editable, so
`?tab=<script>` must fall back rather than render.

## Modal

```tsx
const [isOpen, setOpen] = useUrlBooleanState('compose');

<Dialog open={isOpen} onOpenChange={(o) => setOpen(o, { replace: false })}>
```

`replace: false` — pushing means the browser Back button closes the modal, which is what users expect on
mobile especially.

## Multi-step form

```tsx
const [step, setStep] = useUrlNumberState('step', 1);

const next = async () => {
  const ok = await trigger(FIELDS_BY_STEP[step]);   // validate only this step
  if (ok) setStep(step + 1, { replace: false });    // push — Back returns to the previous step
};
```

## Table state

```tsx
const [q, setQ]         = useUrlStringState('q', '');
const [page, setPage]   = useUrlNumberState('page', 1);
const [sort, setSort]   = useUrlStringState('sort', 'createdAt');
const [dir, setDir]     = useUrlStringState<'asc'|'desc'>('dir', 'desc', ['asc','desc']);

useEffect(() => { setPage(1); }, [q, sort, dir]);   // a new filter must reset to page 1
```

That reset is easy to forget and produces an empty table when the user filters while on page 5.

## Debounced search

```tsx
const [q, setQ] = useUrlStringState('q', '');
const [draft, setDraft] = useState(q);              // local while typing

useEffect(() => {
  const t = setTimeout(() => setQ(draft), 300);     // replace — no history entry per keystroke
  return () => clearTimeout(t);
}, [draft, setQ]);
```

The input is local and the URL is the committed value — otherwise every keystroke is a history entry.

## Legacy path redirect

```tsx
function NewJobRoute() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/jobs?compose=1', { replace: true }); }, [navigate]);
  return null;
}
```

# UX patterns

## The four states, as one shape

```tsx
export function DataView<T>({ query, empty, children }: DataViewProps<T>) {
  if (query.isPending) return <Skeleton />;
  if (query.isError)   return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (isEmpty(query.data)) return empty;
  return children(query.data);
}
```

Order matters: pending before error before empty. Checking `isEmpty` first shows "nothing here" during the
initial load, which is the flicker users read as a bug.

## Empty state

```tsx
<EmptyState
  illustration={<NoJobsIllustration />}          // SVG, in the product's voice
  title="No jobs yet"
  body="Jobs you create will appear here, newest first."
  action={<Button onClick={onCreate}>Create your first job</Button>}
/>
```

Three parts, all required: why it is empty, what will appear here, and how to make that happen.

Distinguish **genuinely empty** from **filtered to nothing** — the second needs "No jobs match these filters"
plus a clear-filters action, not an invitation to create something.

## Error state

```tsx
<ErrorState
  title="Could not load jobs"
  body="The server did not respond. This is usually temporary."
  action={<Button onClick={onRetry}>Try again</Button>}
/>
```

The raw error goes to the logger with detail; the user gets something they can act on. Two audiences, two
messages — see `aoneahsan-cccs-javascript`.

## Boot loader

```tsx
const LOADING_MESSAGES = [
  'Warming things up…',
  'Tip: press ⌘K to jump anywhere',
  'Fun fact: this page is entirely client-side',
];

export function BootLoader() {
  const [i, setI] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;                                  // no rotation for reduced-motion users
    // eslint-disable-next-line no-restricted-syntax -- polling-exception: local-timer — rotates loading copy, no network
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <div role="status" aria-live="polite" className="grid min-h-dvh place-items-center">
      <Logo className="h-12 w-12" />
      <Spinner aria-hidden />
      <p>{LOADING_MESSAGES[i]}</p>
    </div>
  );
}
```

Gate it on both signals:

```tsx
const hydrated = useThemeStore((s) => s.hydrated);
const authReady = useAuthStore((s) => s.ready);
if (!hydrated || !authReady) return <BootLoader />;
```

Theme alone is not enough — resolving auth after paint causes a second flash as the shell swaps.

## Offline

```tsx
const online = useOnlineStatus();

{!online && (
  <div role="status" className="bg-warning-100 text-warning-900">
    You are offline. Changes will sync when the connection returns.
  </div>
)}
```

State the consequence, not just the fact. "You are offline" alone leaves the user guessing whether their work
is lost.

## Resume nudge

```tsx
// One component, two surfaces, one shared dismissal flag.
<ResumeBanner />            // full-width, on the settings page
<ResumeBanner compact />    // card, in the popup or sidebar
```

Backed by a single `bannerDismissed` flag so dismissing in one place silences both. Persist progress under its
own storage key — never inside a debounced settings blob, or a partial write will clobber it.

## Confirmation

Destructive actions confirm, and the confirm dialog's state lives in the URL (`?confirmDelete=<id>`) so a
refresh does not leave a half-finished intent. Name the specific thing being deleted; "Are you sure?" without
the target is how people delete the wrong row.


---

## The link contract — the gates and the traps

Two gates, because neither can see what the other does.

**1. ESLint `no-restricted-syntax`** — never a new dependency for one rule:
- a `Literal[value=/^https?:\/\//]` inside an `<a>`'s `href` → error;
- a `target` attribute on a raw `<a>` at all → error, because a hand-rolled new tab is exactly the
  decision being centralised.

The component implementing the policy needs a per-file override that **re-declares** the other
selectors (the i18n ones) rather than switching the rule off — otherwise a targeted exemption
silently becomes a general one.

**2. A test**, because almost every external href is an *expression* (`product.href`, `link.url`, a
database column) and no AST selector can classify one. Invert the rule: **every raw `<a>` left in the
tree must be provably internal** — its href literal starts with `#`, `/`, `mailto:` or `tel:` — or it
is named in a declared list *with a written reason*.

🔴 **Report the count of anchors found.** A matcher that silently stops matching reports zero
offenders, which reads exactly like a clean tree.
🔴 **Blank comments before scanning, and do not filter on "the line starts with `*`"** — a wrapped
comment line starts with a word, and a file documenting this rule contains the prose ``a raw `<a
href>` ``. The first version of the gate reported its own documentation as a defect.
🔴 **Watch the lint rule be BLIND to the expression case** before trusting the pair. That blindness
is the whole reason the second gate exists; undemonstrated, nobody maintains it.

**Classification details that decide real cases:** test a `pathPrefix` against `pathname + search`,
because a Play listing is identified by its query string. Treat an unparseable href as *internal* —
a `mailto:` opened in a new tab leaves a blank window behind on every desktop browser that hands the
URL to a mail client.

**Check the crawler-visible output separately.** `nofollow` is a signal to something that reads HTML;
if the project prerenders, a `rel` written in a component may not exist in the static file an AI
crawler reads. Grep the built output rather than assuming.


---

## Instrumentation and the missing primitive

## Instrument at the primitive layer

The reason "track every action" and "handle every error" quietly fail is that they are asked of *feature*
code, where every author must remember. Wire them into the **primitives** instead:

- The base `Button`, `Link`, form field and `Form` emit their own analytics events from a declarative prop
  (`analyticsId` / `analyticsProps`), so a feature author gets tracking by using the component.
- Route segments and async boundaries carry error boundaries that report to the tracker and render the
  branded fallback — not a white screen and not a raw stack.
- **Fire-and-forget instrumentation fails silently by design.** A green build proves nothing here. Verify
  once, live, that the event actually arrives in each destination.

### When you reach for something the system lacks

That is a signal the design system is incomplete, not a licence for a one-off. Add the primitive, or say so
and get a decision. One-off components are how a design system dissolves back into inconsistency. The
inventory, the build order and the gallery live in `aoneahsan-cccs-design-system`.

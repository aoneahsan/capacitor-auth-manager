# The channels — recipes

Depth behind `SKILL.md`. Every example is transform/opacity only and stays inside the `-motion` token set.

## Pending, on the control that was pressed

The button owns its own state. It must not change width — a button that shrinks to fit "Saving…" moves
everything after it, which is the tap-target rule in `aoneahsan-cccs-motion`.

```tsx
<Button type="submit" isPending={mutation.isPending}>
  {mutation.isPending ? 'Saving…' : 'Save changes'}
</Button>
```

```css
.btn[data-pending] {
  /* hold the box: the label swaps inside a fixed-min-width control */
  min-inline-size: var(--btn-w, auto);
  cursor: progress;
}
.btn[data-pending] > .btn-label { opacity: 0.6; }
```

🔴 **`disabled` is the wrong tool for pending.** It removes the control from the tab order *and* from screen
readers, so a keyboard user is thrown to the top of the page mid-submit and told nothing. Use
`aria-busy="true"` plus a guard in the handler, and keep it focusable.

RAC's `Button` already exposes `isPending` and emits `data-pending` — do not hand-roll it
(`aoneahsan-cccs-react-aria`).

## Success in place

```tsx
// The label becomes the confirmation for ~1.6 s, then returns.
const [justSaved, setJustSaved] = useState(false);
// on success: setJustSaved(true); setTimeout(() => setJustSaved(false), 1600);

<Button>{justSaved ? '✓ Saved' : 'Save changes'}</Button>
<span role="status" aria-live="polite" className="sr-only">
  {justSaved ? 'Changes saved' : ''}
</span>
```

The visible tick and the announced sentence are **two channels for one event**, and both are required — the
tick is invisible to a screen reader, and a live region is invisible to everyone else.

## Toast, and when not to reach for one

A toast is for something that happened **off-screen** or that needs an undo. It is not the default answer to a
button press.

```tsx
toast.success('Invitation sent to amir@example.com', {
  action: { label: 'Undo', onPress: () => revoke(inviteId) },
  duration: 8000,          // ≥5 s whenever it carries an undo
});
```

- **Name the specific thing.** "Invitation sent" is a system log; "Invitation sent to amir@example.com" is
  feedback the user can check.
- **One toast per action.** A loop that toasts per item produces a stack nobody reads.
- **Never put the only copy of an error in a toast** — it disappears, and the user cannot go back to it.

RAC's `Toast` region handles the live-region announcement, focus behaviour and the pause-on-hover that stops
a toast expiring while it is being read.

## Undo instead of confirm

```tsx
async function deleteItem(id: string) {
  const snapshot = store.one('items', id);
  store.remove('items', id);                       // optimistic: it is gone from the list now
  toast('Item deleted', {
    action: { label: 'Undo', onPress: () => store.add('items', snapshot) },
    duration: 8000,
    onAutoClose: () => api.delete(id),             // commit only when the window closes
  });
}
```

The pattern's whole value is that **the server call happens after the undo window**, so undo is a local
restore rather than a second round trip that can itself fail.

Keep a confirm dialog for what genuinely cannot be undone: deleting an account, revoking access, anything with
an outbound side effect that has already left. Then name the target — "Delete *Q3 payroll export*?", never
"Are you sure?" (`aoneahsan-cccs-react-ui-ux`).

## Failure — inline, at the cause, with focus

```tsx
const onInvalid = (errors: FieldErrors) => {
  const first = Object.keys(errors)[0];
  document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();   // not scrollIntoView
};

<form onSubmit={handleSubmit(onValid, onInvalid)}>
```

Scrolling moves the *viewport*; focus moves the *user*. A keyboard user who is scrolled to an error is still
parked on the submit button.

For a whole-request failure, the message goes next to the action that failed and says what to do:

```tsx
<div role="alert" className="banner banner-error">
  Could not save — the connection dropped. Your changes are still here; try again.
</div>
```

Two audiences, two messages: the raw error goes to the logger with detail (`aoneahsan-cccs-error-tracking`),
the user gets something actionable.

## Live regions that actually announce

Three ways a live region silently does nothing:

| Mistake | Result |
|---|---|
| The region is **added to the DOM** at the same moment as its text | most screen readers announce nothing — the region must already exist and be empty |
| `aria-live` on an element that is `display: none` | never announced. Use an `sr-only` clip, not `hidden` |
| Re-announcing identical text | ignored as unchanged. Vary it, or clear then set on the next frame |

```tsx
// Mount once, near the root, empty. Write into it.
<div id="status" role="status" aria-live="polite" className="sr-only" />
```

## The state transitions that make a surface feel alive

Not decoration — these are the cheapest interventions that remove the "dead" reading from a product page.

**A value that changes should be seen changing.**

```css
.stat-value { transition: color var(--duration-quick) var(--ease-standard); }
.stat-value[data-changed] { color: var(--color-accent-ink); }
```

**A row entering or leaving a list.** `grid-template-rows` for the height, so it works at unknown content
size (the accordion recipe in `aoneahsan-cccs-motion`), and opacity for the arrival.

```css
@keyframes row-in { from { opacity: 0; transform: translateY(-4px); } }
.row[data-entering] { animation: row-in var(--duration-quick) var(--ease-enter) both; }

@media (prefers-reduced-motion: reduce) {
  .row[data-entering] { animation: none; opacity: 1; transform: none; }
}
```

🔴 **Stagger nothing here.** A list arriving one row at a time reads as slow — that is the hero-only rule in
`-motion`, and a table is the exact case it forbids.

**Skeleton → content.** Cross-fade rather than swap, so the layout does not appear to flinch:

```css
.content[data-loaded] { animation: fade-in var(--duration-quick) var(--ease-enter) both; }
```

## Verifying feedback exists

It is an omission, so nothing static finds it. Two checks that do:

- **Throttle the network to a crawl and use the page.** Every action must visibly change something within
  100 ms, before any response arrives. Whatever stays inert is the bug.
- **Run a flow with the screen reader on and the monitor off.** Anything that only happened visually is now
  measurably missing.

🔴 Assert on the **consequence**, never the flag you just set — `getComputedStyle`, a rendered box, the text
inside the live region. A test that reads back `el.dataset.pending` after writing it agrees with itself
(`aoneahsan-cccs-click-dummy/references/pitfalls.md` §8).

**Last updated:** 2026-08-01

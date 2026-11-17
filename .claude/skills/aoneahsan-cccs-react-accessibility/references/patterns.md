# Accessibility patterns

## Focus-visible ring

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-accent-600);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
:where(a, button, input, select, textarea, [tabindex]):focus:not(:focus-visible) {
  outline: none;   /* mouse users only — keyboard users keep the ring */
}
```

`:focus-visible` is what lets you satisfy "no ugly outline on click" without breaking keyboard navigation.

## Modal focus cycle

```tsx
export function Modal({ open, onClose, children, titleId }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    trigger.current = document.activeElement;        // remember where we came from
    ref.current?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      (trigger.current as HTMLElement | null)?.focus();   // and go back there
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
      {children}
    </div>,
    document.body,
  );
}
```

`aria-modal="true"` tells assistive tech the rest of the page is inert. Pair it with a real focus trap (or
the `inert` attribute on the background) so Tab cannot escape.

## Icon-only button

```tsx
<button type="button" aria-label="Delete job" onClick={onDelete}>
  <TrashIcon aria-hidden />
</button>
```

Both halves are required: the label names the action, and `aria-hidden` stops the icon being announced as a
second, meaningless element.

## Async status

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {isPending ? 'Loading results' : `${results.length} results`}
</div>
```

Without this, a screen-reader user gets no signal that anything happened when content updates in place.

## Skip link

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
  Skip to content
</a>
…
<main id="main" tabIndex={-1}>…</main>
```

`tabIndex={-1}` on the target is what makes the skip actually move focus rather than just scrolling.

## sr-only

```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}
```

Use this, not `display: none` or `visibility: hidden` — both remove the element from the accessibility tree
entirely, which defeats the purpose.

## Disabled versus aria-disabled

`disabled` removes the control from the tab order, so a keyboard user cannot reach it to discover *why* it is
disabled. For a submit button whose reason matters, prefer keeping it focusable with `aria-disabled="true"`
and handling the click by showing the reason.

## Audit procedure

1. **Unplug the mouse.** Tab through the whole flow. Anything unreachable or unactivatable is a bug.
2. **Check the focus ring is always visible** and lands where you expect.
3. **Run axe DevTools** (or Lighthouse's accessibility audit) — it catches contrast, labels and roles.
4. **Turn on a screen reader** for the primary flow: VoiceOver (⌘F5) on macOS, TalkBack on Android. Listening
   once to a form you built is worth more than any checklist.
5. **Zoom to 200%** — text must reflow without horizontal scroll.
6. **Enable reduced motion** in the OS and confirm animation stops.

# The first-visit legal notice

Law: `~/.claude/rules/legal-notice.md` (owner, 2026-10-04, every project). Reference implementation: LifeWell
`src/components/legal-notice.tsx` + `legal-notice-bar.tsx`.

**A quiet bar at the bottom, shown once, that leaves by itself. Never a modal, and never a "Privacy Policy
Updated" surface.**

## Shape

```tsx
// The wrapper only positions; the page takes every press outside the bar.
<div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 pb-safe">
  <div
    role="status"
    aria-live="polite"
    onMouseEnter={stop}
    onMouseLeave={() => !bar.current?.contains(document.activeElement) && arm()}
    onFocus={stop}
    onBlur={(e) => !bar.current?.contains(e.relatedTarget) && arm()}
    onKeyDown={(e) => e.key === 'Escape' && close()}
    className="pointer-events-auto mx-auto max-w-xl rounded-lg border bg-surface-raised px-4 py-3 shadow-lg
               motion-safe:animate-slide-in-bottom"
  >
    <p>{t('notice.body')}</p>   {/* one sentence, Privacy Policy and Terms linked */}
    <Button size="sm" onPress={close}>{t('notice.acknowledgeAction')}</Button>   {/* "Okay" */}
  </div>
</div>
```

## Behaviour

1. **Decide once, after auth settles.** Device flag set → show nothing (and copy the flag to a signed-in
   account). Account flag set → write the device flag, show nothing. Otherwise show.
2. **Mark seen when it shows**, on the device and the account, so a reload or a quick navigation never
   brings it back.
3. **Arm a 10 s timer** on show; hover and focus hold it, leaving restarts it; Okay and Escape close.
4. **Skip task pages** (connect, checkout, OAuth callback) without marking seen.
5. **A new policy version never re-shows it.**

## It is a notice, not a consent gate

One action, no toggle, and the word "consent" appears nowhere in its copy. 🔴 **Analytics (owner, 2026-10-30): on by
default, the bar's one added line says the product counts how it is used to improve it, and there is no opt-out** — no
Privacy preferences panel, no per-tool switch, no GPC branch. Reference: LifeWell `legal.json` → `notice.body`. ~~Where the
policy promises choices, they live in a panel opened from a footer "Privacy preferences" link~~ (superseded for analytics).

## Traps

- A dialog component reused "because it is there": `role="dialog"` and an overlay are the defect.
- Marking seen on dismiss: a reload before the press shows it again.
- Deciding before auth has settled: the bar flashes for an account that already saw it.
- Policy copy that still names "the banner": correct every copy in the same task.
- A smooth-scrolling page makes a click probe read a stale rect; scroll with `behavior: 'instant'`, wait, then
  measure.

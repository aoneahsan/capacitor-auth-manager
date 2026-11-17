# Responsive patterns

## Intrinsic layouts — fewer breakpoints, less to break

```css
/* Wraps when it must, no media query needed. */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
  gap: 1rem;
}
```

`min(18rem, 100%)` is the part that matters: without it, a 288px minimum overflows a 320px viewport.

```css
/* Sidebar that collapses on its own when space runs out. */
.with-sidebar { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.with-sidebar > .main { flex: 1 1 60%; min-width: 20rem; }
.with-sidebar > .side { flex: 1 1 15rem; }
```

`min-width` on a flex child is essential — flex items default to `min-width: auto`, so long content refuses to
shrink and pushes the row wider than the viewport. This is the single most common cause of mystery horizontal
scroll.

## Containing overflow

```css
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.prose pre  { overflow-x: auto; }
.break-long { overflow-wrap: anywhere; }   /* URLs, hashes, IDs */
```

## Finding what overflows

```js
// Paste in the console at 320px width.
[...document.querySelectorAll('*')]
  .filter(el => el.scrollWidth > document.documentElement.clientWidth)
  .forEach(el => console.log(el.scrollWidth, el));
```

Faster than bisecting by eye, and it names the element.

## Modal

```css
.modal {
  display: flex; flex-direction: column;
  max-height: calc(100dvh - 2rem);     /* dvh, not vh — vh ignores mobile browser chrome */
  width: min(32rem, calc(100vw - 2rem));
}
.modal__body { overflow-y: auto; flex: 1 1 auto; }
.modal__header, .modal__footer { flex: 0 0 auto; }
```

Header and footer stay put; only the body scrolls. `100dvh` accounts for the collapsing address bar that
makes `100vh` too tall on mobile.

## Safe areas on native

```css
:root { --sat: env(safe-area-inset-top); --sab: env(safe-area-inset-bottom); }

#root { padding-top: var(--sat); padding-bottom: var(--sab); }
.app-shell { min-height: calc(100dvh - var(--sat) - var(--sab)); }
.fixed-drawer { padding-bottom: var(--sab); }   /* fixed elements inset themselves */
```

Requires `viewport-fit=cover` in the viewport meta. Only use this branch when the edge-to-edge plugin is
**absent** — with the plugin, native margins already place content correctly and adding this double-insets.

## Fluid type and space

```css
h1 { font-size: clamp(1.75rem, 4vw + 1rem, 3rem); }
.section { padding-block: clamp(2rem, 6vw, 5rem); }
```

Removes a whole class of breakpoint-only-for-sizing rules.

## Review checklist

- [ ] 320 / 375 / 640 / 1024 / 1280 / 1920 — no horizontal scroll at any of them
- [ ] Exactly one navigation method visible at every width
- [ ] Touch targets ≥ 44×44px with spacing
- [ ] Body text ≥ 16px on mobile
- [ ] Images and videos scale, with intrinsic dimensions set
- [ ] Modals scroll internally and fit `100dvh`
- [ ] Tables, code blocks and diagrams scroll in their own container
- [ ] Dark mode correct at every size
- [ ] `prefers-reduced-motion` honoured
- [ ] On native: content clear of the status and navigation bars, in both orientations

# Reduced motion and animation performance

The global reset, the in-app Motion axis helper and the compositor substitution table behind the motion body.

## Reduced-motion reset and the in-app axis

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

That global reset is a **safety net for what you missed**, not the design. Handle it per pattern first.

### 🔴 The OS is not the only source — there is an in-app Motion axis

The theme control carries `data-motion` (`system` · `full` · `reduced`), for someone who wants motion off
*here* without changing their machine (`aoneahsan-cccs-react-theming`). **A media query cannot see it.**

That matters most for JavaScript animation: `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` reads
the OS **only**, so a page gated on it alone lets the setting appear in the panel, persist correctly, and
change nothing. Route every decision through one helper that consults **both**, and have page scripts ask that
helper rather than querying the media query a second time.

```js
function prefersReducedMotion() {
  const m = axisValue('motion');
  if (m === 'reduced') return true;
  if (m === 'full') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

## Performance

**`transform` and `opacity` only.** Both are compositor properties — no layout, no paint. Animating `height`,
`width`, `top` or `box-shadow` forces reflow every frame.

| Instead of | Use |
|---|---|
| `height` | `transform: scaleY()`, or `grid-template-rows: 0fr → 1fr` |
| `top` / `left` | `transform: translate()` |
| `box-shadow` | cross-fade a pseudo-element carrying the shadow |

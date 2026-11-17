# Design system

## Token layers

Three layers, each referencing the one above. Components only ever touch the third.

```css
@theme {
  /* 1 — primitives: the raw palette, project-specific */
  --color-violet-50:  oklch(0.977 0.014 308);
  --color-violet-600: oklch(0.541 0.281 293);
  --color-violet-950: oklch(0.283 0.141 291);

  /* 2 — semantic: what the colour MEANS */
  --color-accent-600:  var(--color-violet-600);
  --color-surface-50:  var(--color-slate-50);
  --color-ink-900:     var(--color-slate-900);
  --color-danger-600:  var(--color-red-600);

  /* 3 — component: what a part USES */
  --btn-primary-bg:     var(--color-accent-600);
  --btn-primary-bg-hover: var(--color-accent-700);
}
```

Use `oklch()` rather than hex: lightness is perceptually uniform, so a generated 50→950 ramp has even
contrast steps instead of the muddy middle that HSL ramps produce.

## Dark mode

```css
@media (prefers-color-scheme: dark) {
  :root { --color-surface-50: var(--color-slate-950); --color-ink-900: var(--color-slate-50); }
}
:root[data-theme="dark"]  { /* same, but wins over the media query */ }
:root[data-theme="light"] { /* explicit light, wins in the other direction */ }
```

Both are needed: the media query is the default signal, and the `data-theme` attribute must override it in
**both** directions when the user has chosen explicitly.

Semantic tokens flip; primitives never do. That is what makes one component definition correct in both themes.

## Typography scale

```css
@theme {
  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem;  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem; --text-4xl: 2.25rem; --text-5xl: 3rem;

  --font-display: 'Your Display Face', system-ui, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
```

Body text never below **16px** on mobile — smaller triggers zoom on iOS and fails readability. Two families
maximum: one display, one body. A third rarely adds identity and always adds load.

Fluid type where it helps: `font-size: clamp(2rem, 5vw + 1rem, 3.5rem)` on headlines removes a breakpoint.

## Motion

```css
@media (prefers-reduced-motion: no-preference) {
  .reveal-on-mount { animation: reveal 480ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .delay-1 { animation-delay: 60ms; }  .delay-2 { animation-delay: 120ms; }
  .delay-3 { animation-delay: 180ms; } .delay-4 { animation-delay: 240ms; }
}

@keyframes reveal {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
```

Wrapping in `no-preference` rather than adding a separate reduce-override means reduced-motion users get the
static state by default — the safer direction.

Ease-out curves for entrances (fast then settling). Animate only `transform` and `opacity`; animating
`height`, `top` or `width` forces layout on every frame.

## Decorative SVG

```tsx
export function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={className} fill="none">
      <circle cx="100" cy="100" r="80" stroke="currentColor" strokeOpacity="0.15" />
      <circle cx="100" cy="100" r="56" stroke="currentColor" strokeOpacity="0.10" />
    </svg>
  );
}
```

`currentColor` + `strokeOpacity` means the ornament retints with the accent automatically. `aria-hidden`
because it carries no information.

## Boot loader

Full page until theme has hydrated and auth has resolved: logo + spinner + rotating copy (quotes, tips, fun
facts, secret-feature teasers) on a ~3s fade cadence. Reduced-motion users get a static message. `role="status"`
so the wait is announced. This is also the FOUC guard — see `aoneahsan-cccs-react-theming`.

## What "generic" looks like, and the fix

| Symptom | Fix |
|---|---|
| Every section is a centred column of cards | vary rhythm — full-bleed, asymmetric split, offset imagery |
| Only greys plus one accent | use the ramp; tinted surfaces, not just white and grey |
| Uniform corner radius and shadow everywhere | vary elevation deliberately; let some things sit flat |
| Copy reads like documentation | write it in the product's voice, especially errors and empty states |
| Icons are a default set at default weight | consistent stroke weight, sized to the type scale, coloured by token |

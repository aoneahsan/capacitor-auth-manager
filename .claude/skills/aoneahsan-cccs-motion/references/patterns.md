# Motion patterns

Depth behind `SKILL.md`. Recipes for the cases that recur.

## Entrance and stagger

CSS-only. Stagger a **hero's** four elements; never a list.

```css
@theme {
  --animate-reveal: reveal 400ms var(--ease-enter) both;
  @keyframes reveal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
}

.reveal   { animation: var(--animate-reveal); }
.delay-1  { animation-delay:  60ms; }
.delay-2  { animation-delay: 120ms; }
.delay-3  { animation-delay: 180ms; }
.delay-4  { animation-delay: 240ms; }

@media (prefers-reduced-motion: reduce) {
  .reveal { animation: none; opacity: 1; transform: none; }
  /* movement gone, element still arrives — the content is never hidden */
}
```

> The `both` fill mode matters: without it the element is visible at its final position for one frame before
> the animation starts, which reads as a flicker.

**Delay ceiling: ~250 ms.** A fifth and sixth delay step means the last element arrives after the user has
already started reading.

## Accordion / disclosure height

The single most common jank source. Never animate `height`.

```css
.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-moderate) var(--ease-standard);
}
.panel[data-expanded] { grid-template-rows: 1fr; }
.panel > * { overflow: hidden; }   /* required — the child must be allowed to clip */
```

`grid-template-rows` interpolates between `fr` values without a measured pixel height, so it works for
content of unknown size. The `overflow: hidden` on the **child** is not optional.

## Route transitions — View Transitions API

```ts
function navigateWithTransition(to: string, navigate: (to: string) => void) {
  // Progressive enhancement: unsupported browsers just navigate.
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigate(to);
    return;
  }
  document.startViewTransition(() => navigate(to));
}
```

```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root) { animation: fade-out 120ms var(--ease-exit) both; }
  ::view-transition-new(root) { animation: fade-in  180ms var(--ease-enter) both; }
}
```

Cross-fade only for a full page change. Save shared-element transitions (`view-transition-name`) for cases
where the *same object* genuinely persists across routes — a card opening into its detail view. Applying them
broadly produces the "everything slides around" feeling that reads as unfinished.

## Exit animations — the one case CSS cannot do

An unmounting element is gone from the DOM before CSS can transition it. This is the clearest justification
for `motion`:

```tsx
import {AnimatePresence, motion} from 'motion/react';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{opacity: 0, y: 8}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 8}}
      transition={{duration: 0.2, ease: [0.2, 0, 0, 1]}}
    />
  )}
</AnimatePresence>
```

With `useReducedMotion()`, drop the `y` and keep the opacity:

```tsx
const reduce = useReducedMotion();
const slide = reduce ? {} : {y: 8};
// initial={{opacity: 0, ...slide}}  exit={{opacity: 0, ...slide}}
```

**Many overlays do not need this.** RAC keeps a dialog mounted through its exit state and exposes
`data-exiting`, so a CSS animation on that attribute handles it without the library. Check the primitive
before reaching for `AnimatePresence`.

## Celebrations

```ts
import confetti from 'canvas-confetti';

export function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // guard FIRST
  confetti({particleCount: 80, spread: 65, origin: {y: 0.7}, disableForReducedMotion: true});
}
```

Both guards are deliberate: the early return keeps the module honest even if the library's own flag changes.

**Reserve celebration for genuine milestones** — a streak completed, a goal reached, onboarding finished. A
celebration on every save teaches the user to ignore it, and the one that mattered lands on deaf eyes. The
reduced-motion path still needs *something*: a state change, a badge, a colour shift. Silence is not the
accessible version of celebration.

## Loading and skeletons

A skeleton matching the eventual layout, shimmering via `transform` on a gradient overlay — never animating
`background-position` on a large element, which repaints continuously.

```css
.skeleton::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, var(--color-surface-raised), transparent);
  transform: translateX(-100%);
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { to { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; opacity: 0.4; }   /* static, still reads as "loading" */
}
```

## Hover, on touch

Hover does not exist on touch, and a `:hover` style applied after a tap **sticks** until the next tap
elsewhere. Guard hover-only affordances:

```css
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); }
}
```

React Aria's `data-hovered` already resolves this correctly across modalities — one of the concrete reasons
it beats hand-written pseudo-classes. See `aoneahsan-cccs-react-aria`.

## Pointer-dependent life — marketing surfaces only

Which surfaces may use these, and why product UI may not: `~/.claude/rules/frontend-ui-standards.md` §1a.
Everything here is **transform and opacity only**, and every one needs a pointer guard as well as a
reduced-motion guard — two different exclusions, both required.

### Custom cursor — banned

🔴 **No custom cursor** — the browser's default pointer only, every project (owner, 2026-10-26; `rules/frontend-ui-standards.md`). No cursor layer, follower, `cursor: none` or `cursor: url(…)`;
the CSS keywords (`pointer`, `text`, `grab`) stay. The old recipe is retired: it vanished under page tours and
React Aria popovers (Rent Party D-201) and can never show over native lists, pickers or iframes.

### Magnetic hover

The element leans toward the pointer within a radius, then springs back. Cap the pull at ~8px — beyond that
it stops feeling responsive and starts feeling broken, and a target that runs away from the pointer is a
correctness bug, not a style.

```js
el.addEventListener('pointermove', (e) => {
  const r = el.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  el.style.transform = `translate(${Math.max(-8, Math.min(8, dx * 0.2))}px, ${Math.max(-8, Math.min(8, dy * 0.2))}px)`;
}, { passive: true });
el.addEventListener('pointerleave', () => { el.style.transform = ''; });
```

Same pointer guard as the cursor. Under reduced motion, bind nothing at all.

### Scroll reveal

`IntersectionObserver`, never a scroll listener — a scroll handler runs on every frame of every scroll for
the life of the page, this runs once per element and disconnects.

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-revealed');
    io.unobserve(entry.target);                 /* reveal once, then stop watching */
  }
}, { rootMargin: '0px 0px -10% 0px' });

document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
```

```css
[data-reveal] { opacity: 0; transform: translateY(1rem); transition:
  opacity var(--duration-moderate) var(--ease-enter),
  transform var(--duration-moderate) var(--ease-enter); }
[data-reveal].is-revealed { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  [data-reveal] { transform: none; }            /* fade only — never no feedback */
}
```

🔴 **Content must be readable if the script never runs.** Set the hidden state from JS, or ship
`.no-js [data-reveal] { opacity: 1; }` — a failed bundle must not blank the page for a crawler.

### Parallax

```css
.parallax { transform: translate3d(0, calc(var(--scroll-y, 0) * 0.15px), 0); will-change: transform; }
@media (prefers-reduced-motion: reduce) { .parallax { transform: none; } }
```

Drive `--scroll-y` from one `requestAnimationFrame`-throttled listener on `:root`, shared by every parallax
element. **Backgrounds and decoration only** — never text a person is reading, and never anything containing
a control.

### Animated gradient background

Animate `transform` on an oversized gradient layer, never `background-position` (which repaints the whole
element every frame). Reduced motion keeps the gradient and drops the animation.

### Animated counters

Count up once, on reveal, in ≤1s; under reduced motion write the final value immediately. Set
`aria-live="off"` — a number ticking through 60 intermediate values is a screen-reader assault.

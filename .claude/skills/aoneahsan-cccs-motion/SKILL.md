---
name: aoneahsan-cccs-motion
description: 'Motion and animation: one shared easing and duration token set, the CSS-vs-JavaScript criterion, reduced-motion handling stated per pattern, entrance and route transitions, celebration effects, and the list of things that must never animate. Use when adding any transition, wiring route changes, or when an interface feels static or busy.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/urls/motion-and-vitest.md
---

# Motion

**The standard: one easing and duration token set for the whole app, every animation ≤600 ms, and
`prefers-reduced-motion` honoured per pattern.** Motion is a house language or it is noise — without one,
every module invents its own easing and the app feels assembled rather than designed.

## CSS by default; JavaScript for three things

| Reach for | When |
|---|---|
| **CSS transitions/animations** | state changes, micro-interactions, hover, focus, entrances, loading |
| **`motion` (v12)** | **only** these three: `AnimatePresence` (exit animations — the element is gone before CSS can react), `layout`/`layoutId` (layout and shared-element transitions), gesture props (`whileDrag`) |
| **View Transitions API** | route changes |

An animation library imported for a hover transition is ~30 KB doing what two lines of CSS already do. The
package is **`motion`**, imported from `motion/react` — `framer-motion` is its former name.

## Tokens, not literals

```css
@theme {
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);   /* most things */
  --ease-enter:    cubic-bezier(0, 0, 0, 1);     /* decelerate in */
  --ease-exit:     cubic-bezier(0.3, 0, 1, 1);   /* accelerate out */

  --duration-instant:  100ms;   /* toggles, checkboxes — feedback, not travel */
  --duration-quick:    200ms;   /* hovers, small reveals */
  --duration-moderate: 350ms;   /* panels, dialogs, page sections */
}
```

**600 ms is the ceiling, not a target.** Past ~350 ms an interaction starts feeling like waiting.

## 🔴 Reduced motion is per pattern, never a global off-switch

Disabling all feedback removes the confirmation that something happened. The rule is **neutralise movement,
keep opacity**.

| Pattern | Reduced |
|---|---|
| Slide + fade in | fade only |
| Staggered entrance | all at once, fade |
| Layout / shared element | instant swap |
| Skeleton shimmer | static skeleton |
| Confetti / celebration | a static state change — never nothing |
| Spinner | keep it; it communicates ongoing work |

A global `prefers-reduced-motion` reset is a safety net for what you missed, not the design.
🔴 **The OS is not the only source** — the theme control's `data-motion` axis (`system` · `full` · `reduced`)
is invisible to a media query, so every decision (above all JavaScript animation such as `gsap.matchMedia`)
goes through one helper that consults **both**. Read `references/reduced-motion-and-performance.md` when
writing the reset, the helper, or any JS-driven animation.

## What must never animate

- **Validation errors** — the user needs to read them now.
- **Destructive confirmations** — nothing between intent and understanding.
- **Anything blocking input.**
- **Anything that moves a tap target after the user has committed to tapping it.** They aimed at something
  and it left. That is a correctness bug, not a style choice.

## Performance

**`transform` and `opacity` only** — animating `height`, `width`, `top` or `box-shadow` forces reflow every
frame. Read `references/reduced-motion-and-performance.md` before animating a size, position or shadow.

## Restraint

Motion belongs at **heroes, section boundaries, empty states and state changes** — not on every card. A list
where all twelve items animate in reads as slow, not as designed. Stagger a hero's four elements; do not
stagger a table.

🔴 **Restraint is surface-dependent, not uniform.** Magnetic hover, parallax and animated backgrounds belong
on **marketing** surfaces and are banned from **product** UI — craft on a page visited once, noise in a tool
used for eight hours. 🔴 **No custom cursor** — the browser's default pointer only, every project (owner, 2026-10-26; `rules/frontend-ui-standards.md`)
— no cursor layer, follower or `cursor: none`, on any surface.

Celebrations (`canvas-confetti`) are for genuine milestones, and always behind a reduced-motion guard.

## 🔴 Restraint is a ceiling on decoration, not a floor on responsiveness

Everything above limits **ornament**. Read alone it produces the opposite failure — a product where nothing
moves, nothing answers, and the owner's verdict is that it *feels dead*. Both rules are true at once, and the
floor applies to **every** surface, including the densest internal tool:

| Owed everywhere | Not a hover state |
|---|---|
| every interactive element visibly answers **hover, press and focus-visible** | a decorative loop |
| a **value that changes** is seen changing | a parallax band |
| a **row entering or leaving** a list is seen arriving or going | an animated gradient |
| **expand / collapse** travels rather than snapping | a custom cursor (banned everywhere since 2026-10-26) |
| **skeleton → content** cross-fades rather than swapping | confetti on a save |

The right-hand column is marketing-surface decoration (`~/.claude/rules/frontend-ui-standards.md` §1a). The
left-hand column is **feedback**, and cutting it is not restraint — it is an omission that passes contrast,
overflow, keyboard and console checks because nothing is wrong.

🔴 **Still no staggering here.** A row entering animates; twelve rows entering one after another reads as
slow. The stagger rule is unchanged — heroes only.

What to acknowledge, where, and how fast is `aoneahsan-cccs-interaction-feedback`; this skill owns the
movement it is made of.

## Common mistakes

Read `references/common-mistakes.md` when reviewing motion: per-module easing, reduced motion as
all-off, animating `height`, a library for a hover, staggered lists, `scale` over `transform`, and
restraint misread as "nothing moves".

For entrance and stagger recipes, the View Transitions route pattern, the celebration guard, and the
pointer-dependent marketing patterns (magnetic hover, scroll reveal, parallax), read
`references/patterns.md`.

🔴 **The fleet performance standard** (2026-09-11) holds the frame budget as law — `transform`/`opacity` only,
durations from these tokens, continuous motion paused off-screen or with the tab hidden, `will-change` only
while animating: `aoneahsan-cccs-react-performance/references/performance-standard.md` §4.

## Related skills

`aoneahsan-cccs-interaction-feedback` (what the movement is *for* — the acknowledgement contract) ·
`-design-system` (transitions inside primitives) · `-tailwind-v4` (where the tokens live) ·
`-react-accessibility` (reduced motion as an a11y requirement) · `-react-performance` (the frame budget) ·
`-frontend-design` (the restraint rule and decorative treatment).

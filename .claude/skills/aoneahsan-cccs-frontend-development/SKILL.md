---
name: aoneahsan-cccs-frontend-development
description: 'Responsive implementation: the mobile-first breakpoint set from 320 to 1920px, touch target and readability minimums, the navigation rule preventing a duplicated menu, and safe-area handling on native. Use when implementing any layout, reviewing a component at multiple sizes, or when something overflows horizontally.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Responsive implementation

**Every component and page is mobile-first and works from 320px to 1920px.** Not "mostly" — every project
here ships as an Android app through Capacitor as well as a website, so the small end is a real user, not a
hypothetical one.

## Breakpoints

| Name | Range | Query |
|---|---|---|
| xs | 320–374 | `max-width: 374px` |
| sm | 375–479 | `min-width: 375px` |
| md | 480–639 | `min-width: 480px` |
| tablet | 640–1023 | `min-width: 640px` |
| lg | 1024–1279 | `min-width: 1024px` |
| xl | 1280+ | `min-width: 1280px` |

Write the base style for the smallest screen and add complexity upward. Retrofitting mobile onto a
desktop-first layout is how horizontal scroll gets shipped.

## Non-negotiable minimums

- **No horizontal scroll at any width.** The usual culprits: a fixed `width`, a long unbroken string, an
  overflowing table, or a negative margin.
- **Touch targets ≥ 44×44px** on mobile, with spacing so neighbours are not mis-tapped.
- **Body text ≥ 16px** on mobile. Below that iOS zooms on focus, which reads as a bug.
- **Media**: `max-width: 100%`, `height: auto`, and explicit intrinsic dimensions to prevent layout shift.
- **Modals**: flexbox, scrollable content region, `max-height: calc(100vh - 2rem)`, never a fixed height.
- **Wide content** — tables, code blocks, diagrams — scrolls **inside its own container**. The page body never
  scrolls sideways.

## 🔴 One navigation method per viewport

**The hamburger appears only when the inline nav is hidden.** Both visible at the same width is the bug this
rule exists to prevent, and it shipped once already.

```tsx
<nav className="hidden lg:flex">…</nav>
<IconButton className="lg:!hidden" aria-label="Open menu">…</IconButton>
```

One shared breakpoint drives both. If the inline items do not fit at that width, **reduce the item count** —
overflow into the mobile sheet and the footer — rather than keeping both visible.

## 🔴 The theme control is visible at every width

The single theme control (`aoneahsan-cccs-react-theming`) is not a desktop affordance. It sits in the header
on **every route and every width** — a customiser reachable from one breakpoint is not a customiser, and a
phone user is exactly the one most likely to want a larger text size.

Its panel is an anchored popover on a wide screen and a full-height sheet below `640px`. **Check it at 320**:
a five-option axis across a 294px sheet gives ~52px a card, which is not enough for a word like "Medium" —
wrap to three columns rather than shrinking the label past legibility.

## Native safe areas

On Capacitor, content must sit below the status bar and above the navigation bar. Exactly **one** owner of
insets: either the edge-to-edge plugin (with core `SystemBars` insets handling disabled) or CSS
`env(safe-area-inset-*)` with `viewport-fit=cover`. Two owners means content behind the bars. See
`aoneahsan-cccs-capacitor`.

## Interaction states are implementation, not decoration

Every interactive element implements **all** of them, because a browser will put the user in each one:

`default` · `hover` · `focus-visible` · `active` · `disabled` · `loading` · `error` · `read-only`

Two rules that get skipped and produce real bugs:

- **`focus-visible`, not `focus`** — so a mouse click does not paint a ring but a Tab press does. Removing
  the outline without replacing it makes the app unusable by keyboard.
- **A disabled control still needs to explain itself.** `disabled` removes it from the tab order and from
  screen readers, so the *reason* must live somewhere reachable — helper text, a tooltip on a wrapper, or an
  enabled control that reports the problem on activation.

Hover is a **progressive enhancement**: it does not exist on touch, so it may never be the only route to an
action. Guard hover-only affordances with `@media (hover: hover)` and give touch an equivalent.

**On React Aria primitives, use its state attributes rather than CSS pseudo-classes.** `data-hovered`,
`data-pressed` and `data-focus-visible` are **modality-correct** — they behave consistently across mouse,
touch and keyboard, where a raw `:hover` **sticks after a tap on touch** until the user taps elsewhere. With
the Tailwind plugin the `data-` prefix disappears: `hovered:`, `pressed:`, `focus-visible:`. See
`aoneahsan-cccs-react-aria`.

## Verify at real widths

320, 375, 640, 1024, 1280, 1920 — plus dark mode and reduced motion. A layout that has only been seen at the
developer's window width has not been tested.

Run the same sweep with the **keyboard only** and with text zoomed to 200%. Both surface breakage that no
width check catches: a trap in a modal, an unreachable control, a container that clips when text grows.

On Capacitor, add a real device to the matrix. An emulator will not show you a safe-area or keyboard-inset
bug the way a phone in your hand does.

For layout patterns and the review checklist, read `references/patterns.md`.

🔴 **Speed is part of the implementation** (fleet rule, 2026-09-11) — lazy routes, sized images, skeletons at
content size, measured vitals: `aoneahsan-cccs-react-performance/references/performance-standard.md`.

## Related skills

`aoneahsan-cccs-react-ui-ux` owns the **component quality bar** — the single checklist a component must pass
before it is done, of which the responsive and interaction rows are this skill's half.
`aoneahsan-cccs-react-accessibility` carries the keyboard and screen-reader depth ·
`aoneahsan-cccs-capacitor` the native inset ownership.

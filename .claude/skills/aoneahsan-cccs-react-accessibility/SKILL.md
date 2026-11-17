---
name: aoneahsan-cccs-react-accessibility
description: 'Accessibility in React: semantic elements over div handlers, the split between what React Aria supplies and what stays the author''s responsibility, keyboard operability, focus management, contrast, and motion preferences. Use when building any interactive component, replacing a library component, adding a link that opens a new tab, or when something is mouse-only or invisible against its background.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Accessibility

Accessibility is one of the six things a component library was providing, and when a project goes custom it
is **the part most likely to be silently lost** — a `<div onClick>` looks identical and behaves nothing
alike.

## 🔴 What React Aria supplies, and what is still yours

Since 2026-07-25 the house standard is **React Aria** (`aoneahsan-cccs-react-aria`), which closes the largest
half of that gap. Knowing which half matters: re-implementing RAC's work wastes effort, and assuming RAC
covers *everything* ships an inaccessible app.

| RAC gives you free | Stays yours, in every component |
|---|---|
| Focus trap and restore (Dialog, Drawer) | **Colour contrast** — 4.5:1 text, 3:1 UI |
| Roving tabindex (Tabs, RadioGroup, Menu) | **Not encoding meaning in colour alone** |
| Typeahead (Select, ComboBox) | **`alt` text** and decorative `aria-hidden` |
| `aria-expanded` / `aria-controls` wiring | **Heading order** — one `<h1>`, no skipped levels |
| Escape + outside-click dismissal | **Semantics in your own markup** — RAC does not excuse `<div onClick>` |
| Live-region announcements (Toast) | **Real `<label>`s** on every input |
| Modality-correct press/hover state | **Copy** that makes sense out of context |
| 30+ locales, RTL, localised dates | **Reduced motion** (`aoneahsan-cccs-motion`) |

Everything in the right column is invisible to a library. It is also where most real audit findings land.

## Semantic first — most a11y is free

| Need | Use | Not |
|---|---|---|
| Click action | `<button type="button">` | `<div onClick>` |
| Navigation | `<a href>` | `<div onClick={navigate}>` |
| Grouped choices | `<fieldset>` + `<legend>` + `<input>` | styled `<div>`s |
| Structure | `<h1>`–`<h6>`, `<nav>`, `<main>`, `<ul>` | `<div className="heading">` |

A real `<button>` brings focusability, Enter and Space activation, the correct role, disabled semantics and
form participation. Reproducing all of that on a `<div>` takes a `tabIndex`, a `role`, two key handlers and an
`aria-disabled` — and it will still be wrong.

**The visually-hidden-input pattern** is how custom card selectors stay accessible: keep the real
`<input type="radio">` in the DOM with `sr-only` and style the label around it. Arrow-key group navigation,
form submission and screen-reader announcement all keep working.

## Keyboard

Everything reachable and operable without a mouse. Logical tab order following visual order. **Never remove
focus outlines** — restyle them with `:focus-visible` and a token ring.

Modals and drawers: focus moves in on open, is **trapped** while open, `Escape` closes, and focus returns to
the trigger on close. That last step is the one most often missed, and without it a keyboard user is dropped
at the top of the page. **RAC's `Modal` does all four** — if you are writing this by hand, check whether you
are fighting the primitive.

## ARIA only where semantics run out

The first rule of ARIA is not to use it if a native element will do; the second, now, is not to write it if
RAC already emits it. What remains hand-written is mostly labelling: `aria-label` on icon-only buttons,
`aria-current` on the active nav item, `aria-hidden` on decoration, and `aria-live` for status outside a RAC
component.

**Wrong ARIA is worse than none** — a stale `aria-expanded` actively misinforms. That is precisely the class
of bug RAC removes, because it derives the attribute from the state rather than asking you to keep the two
in sync.

## Contrast and motion

Text **4.5:1**, large text and UI boundaries **3:1** — check the accent against its real background at the
shade actually used. Never colour alone to convey meaning; pair with an icon or text.

Honour `prefers-reduced-motion`, and keep animation ≤600ms per `aoneahsan-cccs-frontend-design`.

🔴 **Contrast is checked in every theme combination, not just light and dark.** A colour treatment, a
translucent panel background and a text size each change the effective figures; translucent is the worst,
because the effective background is whatever is scrolled underneath. `aoneahsan-cccs-react-theming` carries
the sweep and the two traps that fake its results.

🔴 **No custom cursor** (owner, 2026-10-26): the browser's default pointer only — never hidden (`cursor: none`),
never replaced by a painted layer or a `cursor: url(…)` image. Caret position, drag affordances and disabled
states are carried by the standard CSS cursor keywords, which the browser draws and every assistive setting
(large pointer, high contrast) respects. A painted cursor vanished under page tours and dropdowns (Rent Party
D-201). Law: `rules/frontend-ui-standards.md`.

🔴 **A link that opens a new tab says so** — WCAG G201. A visually-hidden "(opens in a new tab)" inside the
anchor, so it joins the accessible name. **An explicit `aria-label` REPLACES the element's content**, so on
an icon-only link the hint must be folded into the label instead; a hidden span there is dead markup that
reads like a solved problem.

## Images and content

Meaningful images get descriptive `alt`; decorative ones get `alt=""` or `aria-hidden`. One `<h1>` per page
and no skipped heading levels — this is also the SEO rule. Every input has a real `<label>`; a placeholder is
not a label.

For the audit procedure and component patterns, read `references/patterns.md`.

## Related skills

`aoneahsan-cccs-react-aria` (the behaviour layer supplying the left-hand column above) ·
`-design-system` (where primitives are built and the gallery a11y pass happens) ·
`-motion` (reduced motion) · `-frontend-development` (touch targets, text size, the width sweep) ·
`-react-ui-ux` (the nine-dimension quality bar this feeds).

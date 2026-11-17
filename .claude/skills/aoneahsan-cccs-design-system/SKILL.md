---
name: aoneahsan-cccs-design-system
description: 'The design-system layer: the primitive inventory built before any feature, the composition contract turning React Aria behaviour into a branded component, variant and override safety, icon and asset strategy, and the primitive gallery. Use when starting a component layer, adding a primitive, or when markup repeats.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/urls/react-aria.md
---

# Design system

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

**The standard: the primitive layer is built and reviewed *before* the first feature.** Features compose
primitives. A feature that defines a component belonging in the system is how a design system dissolves.

## The composition contract

```
        RAC behaviour        (focus, keyboard, ARIA, i18n — never re-implemented)
      + our design tokens    (semantic only — no literals, no arbitrary values)
      + our variants         (cva, with tailwind-merge for override safety)
      + our instrumentation  (analyticsId, error boundaries — wired once, here)
      ─────────────────────
      = one primitive
```

Each layer has one owner, and none is the feature author. The wrapper pattern implementing this — `cva` +
`twMerge` + the render-prop `className` trap — lives in
`aoneahsan-cccs-react-aria/references/migration-and-patterns.md`. Do not re-derive it.

## The inventory — build these before features

| Group | Primitives |
|---|---|
| **Actions** | Button · IconButton · Link · Toolbar |
| **Forms** | Input · Textarea · Select · ComboBox · Checkbox · Radio · Switch · Slider · NumberField · SearchField · DatePicker · FieldError |
| **Overlays** | Dialog · Drawer/Sheet · Popover · Tooltip · DropdownMenu · Toast |
| **Structure** | Tabs · Accordion · Card · Separator · ScrollArea · Pagination · Table shell |
| **Display** | Avatar · Badge · Skeleton · EmptyState · ProgressBar |

Order matters: **leaves first** (Button, Checkbox, Separator), then fields, overlays, collections. Overlays
built against unsettled tokens get rebuilt. Most come from RAC; the five with **no RAC primitive** — Avatar,
Card, Badge, Skeleton, ScrollArea — are purely presentational, which is why they have none.

## 🔴 The gallery is a deliverable, not a nicety

One route (`/_gallery`, dev-only) rendering **every primitive in every state**: default, hover, focus-visible,
active, disabled, loading, error, empty, dense, overflowing — at 320px and 1920px, light and dark.

Three things at once: the **design review surface** (the owner approves the system here, not inside a
half-built feature), the **a11y regression check** (one keyboard-only pass exercises every primitive), and
the **honest inventory** (what is missing is visible rather than discovered mid-feature).

Build it in the same phase as the primitives. A gallery added later documents what exists instead of
exposing what does not.

🔴 **Every gallery entry carries a PLAYGROUND, not only specimens.** Knobs driving **one live instance**
through data shape (empty · one · typical · dense · extreme · longest plausible string · RTL), state, variant
and width. A specimen row shows the states the author chose, so a reviewer can only agree or disagree with a
decision already made — the playground is what lets them ask *what happens when*, which is where the defects
are. Deep-linkable, never persisted. The dial families and the harness:
**`aoneahsan-cccs-component-playground`**.

🔴 **And the primitives must be operable in it** — press the button and it enters its own pending state,
submit invalid and the error lands at the field with focus moved there. The gallery is where the
acknowledgement contract is regression-checked, not just the paint
(`aoneahsan-cccs-interaction-feedback`).

🔴 **Sweep it against every THEME AXIS, not just light and dark.** The theme control
(`aoneahsan-cccs-react-theming`) sets appearance, colour treatment, radius, density, text size, typeface and
panel background — and **a primitive that hardcodes any of them breaks in exactly one combination**. That is
the finding the gallery exists to produce: it is cheap across ~90 primitives and expensive across 85 pages,
which is why the control is built before the system rather than after it.

## Does this belong in the system?

| Signal | Verdict |
|---|---|
| Second identical markup in two features | **extract** — the system was missing it |
| Has interactive behaviour (focus, keys, overlay, selection) | **system**, on a RAC primitive |
| Purely presentational and reused | **system** |
| Composes primitives with feature-specific copy or data | **feature** — leave it there |
| One-off layout used once | **feature** |

Reaching for something the system lacks is a signal the system is incomplete — **add the primitive, or say
so and get a decision.** A one-off "just this once" component is the first of many.

## Icons and assets

One icon set, imported individually so the bundle stays honest; every icon-only control carries an
`aria-label`. **Assets are authored and committed as SVG** — raster is an export step only, so changing an
asset means editing the SVG, never the PNG.

## API discipline

- **`forwardRef` on every primitive**, or a parent cannot compose, measure or focus it.
- **Controlled and uncontrolled both work.** RAC already models this; do not collapse it to one.
- **Compound components over prop explosions**: `<Tabs><TabList><Tab/></TabList></Tabs>`, not
  `<Tabs items={[…]} />`. The first composes; the second grows a prop per requirement.

## Common mistakes

| Mistake | What happens | Instead |
|---|---|---|
| Features built before primitives | every feature invents its own button | primitive layer + gallery first |
| A one-off component "just this once" | the system stops being the source of truth | add the primitive |
| Gallery written after the primitives | documents what exists, hides what is missing | same phase |
| Tokens skipped for a literal | breaks theming and rebrand silently | semantic token |
| Analytics wired per feature | half the app is untracked | wired in the primitive |

## Related skills

`aoneahsan-cccs-react-aria` (the behaviour layer + the wrapper pattern) · `-tailwind-v4` (the tokens) ·
`-motion` (transitions inside primitives) · `-component-playground` (the gallery's knobs) ·
`-interaction-feedback` (what a primitive owes when acted on) · `-react-ui-ux` (the quality bar every
primitive must pass) · `-react-accessibility` (what stays ours) · `-react-components` (feature-level
composition).

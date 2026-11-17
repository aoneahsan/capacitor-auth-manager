---
name: aoneahsan-cccs-react-aria
description: 'React Aria as the accessibility foundation for UI primitives: react-aria-components as the house standard, its styling contract under Tailwind v4, the react-hook-form validation collision, the Radix replacement map, and where Adobe''s own skill carries the live API. Use when building any interactive primitive.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/urls/react-aria.md
---

# React Aria

**The standard: `react-aria-components` (RAC) supplies behaviour, accessibility and i18n for every
interactive primitive. We supply every pixel.** Owner decision, 2026-07-25.

## 🔴 RAC is not a component library

The no-component-library rule exists because *"70 projects have almost similar and basic UI UX"* — it targets
**visual defaults**. RAC ships **none**: no colours, no spacing, no typography, no opinion. It gives focus
trapping, roving tabindex, typeahead, dismissible layers, collision-aware positioning, live regions and
30+ locales.

> Adopting RAC is not a step back toward Radix. It removes the excuse for a thin visual layer, because
> nothing is left to build except the part that differentiates the product.

**Never re-implement what RAC provides.** A hand-rolled focus trap is a bug with a deadline.

## Three packages, one default

| Package | Use |
|---|---|
| **`react-aria-components`** | **the default.** Every primitive, unless RAC genuinely lacks one |
| `react-aria` (hooks) | escape hatch — RAC has no primitive, or the DOM structure is impossible through it |
| `react-stately` | almost never directly; RAC and the hooks own it |

## Styling — four mechanisms that compose

Render-prop `className` (state without `useState`), `data-*` state variants, `slot` for repeated children, and
the default `react-aria-*` classes. Register `@plugin "tailwindcss-react-aria-components";` in CSS; the data
attributes are **modality-correct** across mouse, touch and keyboard. Read `references/styling.md` when
styling any primitive.

## 🔴 The react-hook-form collision

RAC runs **native HTML constraint validation** by default and our house rule is RHF + Zod, so both run unless
you stop one. **`validationBehavior="aria"` is mandatory on every RAC field inside RHF** — it turns RAC's own
validation off, leaving RHF + Zod the single authority while RAC keeps supplying the ARIA wiring.

🔴 **Corollary, and the expensive half: a wrapper that omits `errorMessage` makes that pattern impossible,
silently.** With RAC validation off, `errorMessage` is the *only* remaining message source, so a primitive that
never forwards one leaves every field able to go invalid, turn red, and never say why. Found on lifewell across
**five primitives** — so every form in the app — compiling and building clean. **Forward `errorMessage` and
`isInvalid`, or the wrapper is not finished.**

The `<Controller>` wiring and the full incident: `references/migration-and-patterns.md`.

## 🔴 Naming: RAC reads a `<Label>` CHILD, not a prop-shaped span

For any component whose accessible name comes from a child — `Progress`, `Meter`, and the field primitives —
RAC derives `aria-labelledby` from a real **`<Label>`** element. Rendering the text as a plain `<span>`
produces **identical pixels and an anonymous control**: a progress bar that announces "62%" of nothing.

Two things make this expensive to catch: `tsc` and the bundler both pass, and the failure is invisible on
screen. RAC does warn on the console, so **rendering the component is the only check that works**.

🔴 **An empty `<Label>` is worse than no label** — it silences RAC's warning while leaving the accessible name
empty, converting a loud problem into a silent one. Render one only when a label exists, and require
`aria-label` from the caller otherwise.

## 🔴 A card selector is a RadioGroup, not a row of buttons

Theme controls, plan pickers and any "choose one of these, and the tile shows you what it does" surface are
**`RadioGroup` + `Radio`** — one tab stop for the group, arrows to move within it, `aria-checked` derived from
state. A row of `<button>`s looks identical and gives every option its own tab stop, so a nine-axis theme
panel becomes ~26 tab stops instead of 9.

Build it in RAC's real anatomy even in a static prototype, so the framework build keeps the paint and drops
the behaviour. The axis contract itself: `aoneahsan-cccs-react-theming`.

## What RAC does not cover

The gaps are **entirely presentational** — Avatar, Card, Badge, Skeleton, ScrollArea. Build those outright;
they have no behaviour to get wrong. One exception: **Drawer/Sheet** is behavioural, but composed from RAC
`Modal` with different positioning rather than being its own primitive.

## The live API lives with Adobe, not here

Adobe publishes an official Agent Skill and a `.md` twin of every doc page. RAC moves fast, so
**this skill carries no API reference** — a copy would be a fork that goes stale silently.
(The `react-aria` MCP server was removed 2026-09-16 by owner directive; do not re-add it.)

| Need | Go to |
|---|---|
| A component's props, states, examples | the installed **`react-aria`** skill |
| Any page as markdown | `react-aria.adobe.com/<Component>.md`, index at `/llms.txt` |
| House decisions, the Radix map, the traps | **here** |

RULE #0 applies: when a task touches React Aria, invoke **both** skills.

## Common mistakes

Read `references/migration-and-patterns.md` → *The four headline mistakes* when reviewing a primitive: an
unforwarded `errorMessage`, `href={undefined}`, removing RAC as "a component library", and code-only review.

**Six more in `references/migration-and-patterns.md`** — including the two label mistakes, where the second
(an empty `<Label>` to quiet the console) is worse than the first because it converts a loud bug into a silent
one, and the `llms.txt` research trap that leads to hand-rolling a primitive RAC already ships.

For the full Radix → RAC map, the primitive wrapper pattern and instrumentation placement, read
`references/migration-and-patterns.md`.

## Related skills

`aoneahsan-cccs-design-system` (what these compose into) · `-tailwind-v4` (the tokens and the `@plugin`) ·
`-react-forms` + `-react-form-components` (the RHF side of the collision) · `-react-accessibility` (what
stays ours even with RAC) · the installed **`react-aria`** skill by Adobe (the API).

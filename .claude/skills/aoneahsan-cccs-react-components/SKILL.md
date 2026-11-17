---
name: aoneahsan-cccs-react-components
description: 'Component architecture in React: reusable primitives instead of repeating markup, Tailwind-plus-custom for new work vs keeping component libraries in existing projects, card-based option UI, and D3 for all charts. Use when creating any component, when markup appears twice, or when auditing components for reuse.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Components

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

## The library decision — read this first

The owner's position, stated 2026-07-19 after 70 projects:

> "UI created using those pre-build UI component libraries is quite simple and not very
> creative/unique/personal/brillient/playful/exciting… 70 projects have almost similar and basic UI UX."

| Situation | What to do |
|---|---|
| **Existing project already on Radix / ShadCN** | **Keep it.** *"for existing projects it's fine that we have those component libraries."* Do not migrate unprompted. |
| **New project** | **Tailwind (latest) + custom components.** |
| **Deliberate UI redo of an existing project** | Drop the library, go custom. |

> ⚠️ This supersedes the older rule that mandated Radix/ShadCN for anything interactive. In a project that
> still uses a library, that rule still holds — use its components rather than raw `<button>`/`<input>`.

**Going custom does not mean losing what the library gave you.** Every custom component must still deliver:
theme management, colour management, font management, contrast management, accessibility (keyboard, ARIA,
focus), and typography control. Those are the acceptance criteria, not optional extras — see
`aoneahsan-cccs-frontend-design` and `-react-accessibility`.

### 🔴 React Aria is not a component library

**The rule above is about *visual* defaults** — the reason 70 projects looked alike. **React Aria ships
none**: no colours, no spacing, no typography, no opinion. It supplies behaviour, accessibility and i18n
only, and since 2026-07-25 it is the house standard for every interactive primitive
(`aoneahsan-cccs-react-aria`).

So "no component libraries" **never means removing RAC**. Adopting it is not a step back toward Radix; it
removes the excuse for a thin visual layer, because nothing is left to build except the part that
differentiates the product. Hand-rolling a focus trap is not going custom — it is a bug with a deadline.

## Build the primitive the second time, not the first

The first occurrence is a component. The second identical one is a signal. Extract when the *same* markup
appears twice **and** you expect both to change together — the DRY caveat in
`aoneahsan-cccs-programming-principles` applies here more than anywhere, because visually-similar components
often diverge.

Reusable primitives live in `src/components/ui/`; feature components compose them. A feature component should
read as layout and intent, not as class-name soup.

**Named props, never positional.** Prop names are the component's public API — a boolean called `variant` you
have to look up is worse than three explicit props.

## Card-based option UI

For every checkbox group, radio group and select with **8 or fewer options**, use cards rather than native
controls:

- icon (SVG, specific to the option — never a generic checkmark) + title + a one-line description
- selected state visually unmistakable: border, accent background, and a check
- tight variant for dense forms: icon left, label right, no description

**Above 8 options** cards become overwhelming → a vertical scrollable list with icon-left/label-right, or a
proper select. Applies to theme customisers, filter sidebars, form question groups, settings toggles and
feature opt-ins.

## Charts are D3

**D3.js only.** No Recharts, Chart.js, Victory, Nivo or react-charts. The reason is ceiling: every wrapper
library eventually blocks a design the owner wants.

For the primitive API shape, composition patterns and the variant approach, read `references/patterns.md`.

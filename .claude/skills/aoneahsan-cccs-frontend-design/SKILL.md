---
name: aoneahsan-cccs-frontend-design
description: 'Visual design direction: the move from component libraries to Tailwind plus custom components, the per-project unique colour palette and its global registry, design tokens, motion and decorative treatment, the SVG-first asset rule. Use when designing any page or component, choosing colours, or when a UI looks generic.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Frontend design

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

**UI/UX is 50% of any project.** This skill exists because of a specific, measured failure: after ~70
projects on Radix and ShadCN, the owner's conclusion was that they *"have almost similar and basic UI UX and
nothing great."* The libraries did their job — they were never the differentiator.

## 🔴 The owner does not make the visual decisions — you do

> *"i'm not a designer… i can tell if i like a UI UX or not, but i do not have skill to guide that properly,
> that's why i ask you to load skills, custom, official and git cloned to make best decision, i'm a
> developer, so i will be able to much better answer dev side questions."* — owner, 2026-07-29

Ask him about stack, product, scope and behaviour. **Never ask him to choose a direction, palette, layout,
type pairing or aesthetic** — it costs a round trip and returns *"not sure, do your best"*.

The obligation this creates is the real point: with nobody to defer to, **load the craft before designing** —
`aoneahsan-cccs-design-process` (the anti-slop method and the three dials) and
`aoneahsan-cccs-cloned-skills-library` (the colour/typography/UX databases and the typography enforcer) are
the two most often skipped, and skipping them is what produces a page the owner rejects as generic. Then
commit to a direction and **write the argument down**, so he can disagree with the reasoning rather than
only the pixels. His channel is reacting to finished work, and it is enough.

## The direction

**New projects, and any deliberate UI redo: Tailwind v4 + React Aria + custom components.** Existing projects
keep their library until a redo is ordered. The bar is **unique, playful, creative, cheerful, user-friendly**
— opinionated rather than safe.

**Going custom must not lose what the library gave.** These six are acceptance criteria, not aspirations:
theme management · colour management · font management · contrast management · accessibility controls ·
typography control. A custom component that drops any of them is a regression, not a redesign.

**Two of the six now have owners.** *Accessibility* is supplied by **React Aria**
(`aoneahsan-cccs-react-aria`), which ships behaviour with **zero visual opinion** — so it satisfies that
criterion without touching this one. *Theme, colour and typography management* run on **Tailwind v4's
CSS-first tokens** (`aoneahsan-cccs-tailwind-v4`). That leaves the visual layer entirely ours, which is the
point: the differentiator is no longer competing for attention with a focus trap.

## 🔴 Every project gets its own colour palette

*"we must not repeat colors for our projects."* The palette is chosen **at project start**, recorded in the
**global registry** — exactly like the unique dev-port registry — and checked against existing projects before
being claimed.

**Registry:** `~/.claude/ports/` sits beside it; the palette registry follows the same pattern. Record
project, primary hue, accent, and the date claimed. Before choosing, read it: two projects sharing a primary
hue is the failure this prevents.

Prefer 25° separation where the current registry permits it. If the wheel is crowded, choose the primary
that maximizes its minimum circular distance from existing claims within the product's semantic constraints;
document the measured clearance and distinguish the full palette through lightness, chroma, neutrals, type,
and treatment. See `references/palette-registry.md` for the claim procedure.

Build the palette as **semantic tokens**, never raw hex in components:

```
--color-accent-{50..950}     --color-surface-{…}     --color-ink-{…}
--color-success/warning/danger-{…}
```

A component referencing `bg-accent-600` automatically tracks the project's palette, the user's theme, and any
future rebrand. A component with `bg-[#7c3aed]` does none of that.

## Add life, with restraint

| Lever | Use | Avoid |
|---|---|---|
| Decorative SVG | reusable inline SVG, 10–25% opacity, at hero corners, dividers, empty states, `aria-hidden` | stock illustrations, raster doodles, emoji clipart |
| Entrance motion | CSS-only, **≤600ms**, staggered eyebrow → headline → body → CTA | a JS library for what CSS already does; bounce anywhere; staggering a long list |
| Hover | subtle lift, shadow token, accent ring on `:focus-visible` | garish glows, colour flips |
| Pointer-dependent life | magnetic hover, parallax, animated backgrounds — **marketing surfaces only**. 🔴 **No custom cursor anywhere** — the browser's default pointer only (owner, 2026-10-26) | any of these inside product UI; any cursor layer, `cursor: none` or `cursor: url(…)` |
| Loading | full-page boot loader: logo + spinner + rotating tips/quotes, ~3s cadence | a bare spinner, a blank wait |

**Restraint is the rule** — ornament at heroes, dividers and empty states, not on every card. Always honour
`prefers-reduced-motion`. Test in dark mode. The full lever set with its per-surface guards:
`~/.claude/rules/frontend-ui-standards.md` §1 and §1a; the recipes: `aoneahsan-cccs-motion`.

**Personality belongs in the copy too** — error messages, empty states and button labels are design surface.

## SVG-first, always

**Every asset we create is authored as SVG and committed as SVG**; PNG/JPG is an export step only. To change
an asset, edit the SVG and re-export — never hand-edit the raster. Real photographs and screenshots are the
exception; any frame or branding around them is still SVG.

🔴 **Store/publish assets also commit their PNG** (owner, 2026-09-29): an icon, feature graphic or promo
graphic for a store has an upload-ready `name.png` beside `name.svg`, regenerated with it — law in
`~/.claude/rules/publishing-compliance.md`.

For the token system, palette selection, the registry format and motion patterns, read
`references/design-system.md` and `references/palette-registry.md`.

## Related skills

`aoneahsan-cccs-tailwind-v4` (the CSS-first token mechanics behind the palette) ·
`-design-system` (the primitive layer these decisions are applied in) · `-react-aria` (the behaviour layer,
visually silent) · `-motion` (the easing and duration token set) · `-react-ui-ux` (the quality bar).

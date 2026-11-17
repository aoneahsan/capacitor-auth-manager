# React Aria — overview

## Purpose

The owner selected **React Aria (Adobe) as the accessibility foundation for every UI component** on
2026-07-25, during the LifeWell rebuild planning. That decision resolved a question the rebuild's skill-gap
analysis had left open — *"which primitives are genuinely worth hand-building versus wrapping a headless
library"* — and it removes the single largest risk in dropping Radix: ending up with a UI that is prettier
and **less accessible**.

This skill carries the **house decisions** around React Aria. It deliberately carries no API reference,
because Adobe publishes an official Agent Skill, an MCP server and a markdown twin of every documentation
page — all of which track a library currently at 1.19.0 and moving. Duplicating that here would create the
stale fork the "point at living registries" rule exists to prevent.

## What this skill does

- Names **`react-aria-components` the house standard**, with the hooks as a documented escape hatch.
- Settles the framing that keeps RAC alive in a codebase governed by a no-component-library rule: **RAC is
  behaviour, not visual defaults.**
- Gives the **four styling mechanisms** — render-prop `className`, `data-*` state attributes, `slot`, and the
  default `react-aria-*` classes — and how they meet Tailwind v4 through `@plugin`.
- Records that RAC's state attributes are **modality-correct**, unlike a hand-written `:hover`.
- Resolves the **react-hook-form collision**: `validationBehavior="aria"` on every RAC field inside RHF.
- Maps **Radix → RAC** for the 15 packages LifeWell deletes, and names the gaps (all presentational).
- Routes API questions to **Adobe's own skill and MCP**, and says to invoke both.

## When it gets invoked

- Building or reviewing any interactive primitive — button, dialog, select, menu, tabs, toast.
- "Replace Radix" / "drop the component library" / "build the design system".
- Wiring a form field, or debugging duplicated validation messages.
- Anything needing focus management, keyboard navigation, or ARIA state.
- "Why is hover stuck after tapping on mobile?"

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every React project building its own primitives; new projects by default, existing ones on a deliberate UI redo |
| Stack override | The concern is *behaviour and accessibility supplied by a headless layer, visuals supplied by us*. A Flutter project satisfies it through the framework's own semantics widgets — see `aoneahsan-cccs-flutter-accessibility`. |

## Sources

| Source | Record |
|---|---|
| `react-aria.adobe.com` — home, `/ai`, `llms.txt`, `styling.md`, `forms.md` (fetched 2026-07-25) | `_source-understanding/urls/react-aria.md` |
| The installed Adobe skill at `~/.claude/skills/react-aria` | same record — "What Adobe's own skill covers" |

## Related skills

- `aoneahsan-cccs-design-system` — composes RAC into the project's primitives
- `aoneahsan-cccs-tailwind-v4` — the tokens the primitives style with, and the `@plugin` registration
- `aoneahsan-cccs-react-forms` / `-react-form-components` — the RHF half of the validation collision
- `aoneahsan-cccs-react-accessibility` — what remains ours even with RAC in place
- **`react-aria`** (Adobe, installed) — the live API; invoke alongside this one

## Maintenance

- **Living registries this skill points at:** the installed `react-aria` skill and
  `react-aria.adobe.com/llms.txt` — both Adobe-maintained, the current API by construction. The `react-aria`
  MCP server was removed 2026-09-16 (owner directive on unused MCPs); do not re-add it.
- **Last reviewed:** 2026-09-16 (the `react-aria` MCP server removed; the Adobe skill and `/llms.txt` remain)

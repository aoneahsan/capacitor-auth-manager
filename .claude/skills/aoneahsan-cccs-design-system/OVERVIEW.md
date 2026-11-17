# Design system — overview

## Purpose

When a project drops a component library, the visual layer becomes the differentiator and the behaviour layer
becomes a liability — this is where a UI ends up prettier and **less accessible**. The owner's 2026-07-25
decision to adopt React Aria removes the liability: RAC supplies focus trapping, roving tabindex, typeahead,
dismissible layers and live regions, so nothing is left to build except the part that makes the product
distinctive.

This skill governs that remaining part: the primitive layer, built and approved **before** the first feature,
and the discipline that keeps it the single source of truth once features start multiplying.

## What this skill does

- States the **composition contract** — RAC behaviour + our tokens + our variants + our instrumentation —
  and names one owner per layer, none of which is the feature author.
- Gives the **primitive inventory** and the build order (leaves → fields → overlays → collections), with the
  five primitives RAC does not cover and why they are all presentational.
- Makes the **primitive gallery a deliverable**: design review, accessibility regression check, and honest
  inventory in one route, built in the same phase as the primitives.
- Provides the **system-or-feature decision table** for when something should be extracted.
- Sets **API discipline** — `forwardRef`, controlled/uncontrolled duality, compound components over prop
  explosions.
- Fixes **icon and SVG-first asset strategy** at the system level.
- Points at `aoneahsan-cccs-react-aria` for the wrapper pattern rather than restating it.

## When it gets invoked

- "Build the design system" / "set up the component layer" / Wave 0 of a rebuild.
- Adding or reviewing any primitive.
- "Should this be a shared component?" / the same markup appearing in a second feature.
- A feature reaching for something the system does not have.
- Reviewing whether a component is finished.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project building its own component layer — new projects by default, existing ones on a deliberate UI redo |
| Stack override | The concern is *one owned primitive layer, approved before features consume it*. A Flutter project satisfies it with a widget library and a gallery route — see `aoneahsan-cccs-flutter-ui-ux`. |

## Sources

| Source | Record |
|---|---|
| React Aria docs + the installed Adobe skill (fetched 2026-07-25) | `_source-understanding/urls/react-aria.md` |
| The owner's component-library position, 2026-07-19 | `_source-understanding/files/prompt-logs.md` |
| LifeWell rebuild module F1 + the 17-item duplication kill-list | `code/production-projects/lifewell-project-root/01-MODULES-AND-ORDER.md` |

## Related skills

- `aoneahsan-cccs-react-aria` — the behaviour layer and the concrete wrapper pattern
- `aoneahsan-cccs-tailwind-v4` — the tokens primitives are styled from
- `aoneahsan-cccs-motion` — transitions inside primitives
- `aoneahsan-cccs-react-ui-ux` — the nine-dimension quality bar every primitive must pass
- `aoneahsan-cccs-react-components` — composition at the feature level
- `aoneahsan-cccs-analytics` — the event taxonomy the primitives emit into

## Maintenance

- **Living registries this skill points at:** none directly; the RAC API lives with Adobe's installed skill.
- **Last reviewed:** 2026-07-25

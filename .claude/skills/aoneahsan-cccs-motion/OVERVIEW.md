# Motion — overview

## Purpose

"Playful and joyful" is a house standard or it is nothing. Without one stated set of easings and durations,
every module invents its own and the result feels assembled rather than designed — the same failure that made
70 component-library projects feel interchangeable, arriving through a different door.

This skill sets the shared motion language, the line between CSS and a JavaScript animation library, and the
accessibility contract that keeps motion from excluding people. It also carries the short list of things that
must never animate, which is the half most often missed.

## What this skill does

- Establishes **one token set** — three easings, three duration tiers — and a **≤600 ms ceiling**.
- Draws the **CSS vs `motion` line**: only exit animations, layout/shared-element transitions and gestures
  earn JavaScript; everything else is CSS.
- States **reduced motion per pattern** — neutralise movement, keep opacity — and explains why a global
  "turn everything off" is the wrong shape.
- Names **what must never animate**, including the tap-target rule that makes moving UI a correctness bug.
- Gives the **compositor-property rule** (`transform` and `opacity` only) with concrete substitutes for
  `height`, `top` and `box-shadow`.
- Sets the **restraint rule**: motion at heroes, boundaries, empty states and state changes — not every card.
- Puts celebrations behind a reduced-motion guard.

## When it gets invoked

- Adding any transition, animation, entrance or hover effect.
- "Make this feel more alive" / "the UI feels static" / "the UI feels busy".
- Wiring route transitions.
- Adding a celebration or success moment.
- An accessibility pass, or a report that the app is uncomfortable to use.
- Reviewing a component against the quality bar's motion dimension.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project with a user interface |
| Stack override | The concern is *one motion language, bounded duration, and reduced-motion honoured per pattern*. A Flutter project satisfies it through its own curves and `MediaQuery.disableAnimations` — see `aoneahsan-cccs-flutter-ui-ux`. |

## Sources

| Source | Record |
|---|---|
| `motion.dev/docs/react` (fetched 2026-07-25) | `_source-understanding/urls/motion-and-vitest.md` |
| The owner's "add life to UI/UX" rule and the ≤600 ms budget | `_source-understanding/files/generic-project-rules.md` |

## Related skills

- `aoneahsan-cccs-design-system` — transitions built into the primitives
- `aoneahsan-cccs-tailwind-v4` — where the easing and duration tokens are declared
- `aoneahsan-cccs-react-accessibility` — reduced motion as a requirement, not a preference
- `aoneahsan-cccs-react-performance` — the frame budget behind the compositor rule
- `aoneahsan-cccs-frontend-design` — decorative treatment and the restraint rule

## Maintenance

- **Living registries this skill points at:** none.
- **Last reviewed:** 2026-07-25

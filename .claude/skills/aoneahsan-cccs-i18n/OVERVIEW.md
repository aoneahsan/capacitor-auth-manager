# i18n — overview

## Purpose

LifeWell ships **English only**, and every string still goes through the i18n layer. That is deliberate: the
layer costs almost nothing to add now and is impossible to retrofit later, because adding it touches every
component in the app. The old project had ten locale files, nine of which were abandoned — this time the
structure stays ready and only `en.json` ships.

The distinction the skill exists to protect is **units versus locale**. In a health app, kg-versus-lb is the
user's own choice, not a consequence of where they live, and tying the two produces confidently wrong
numbers.

## What this skill does

- Fixes **namespacing as a permanent decision**, and requires keys named by meaning rather than by their
  English text.
- Requires **one key per whole sentence** with interpolation — never concatenated fragments, whose word order
  no other language can express.
- Separates **locale concerns (language, date/number formatting)** from **user-preference concerns
  (metric/imperial)**, and requires the canonical unit in storage with conversion at the display boundary.
- Keeps the **RTL path correct** through logical CSS properties, at no cost while only English ships.
- Uses **`Intl`** for display formatting and `date-fns` for arithmetic.
- Requires **lazy namespace loading**.

## When it gets invoked

- Adding any user-visible string.
- Formatting a date, a number or a measurement.
- Scaffolding i18n in a new project.
- Adding a second locale, or auditing readiness for one.
- A weight or volume appearing in the wrong unit.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project with user-facing text |
| Stack override | The concern is *no hardcoded user-visible strings, and units as a preference rather than a locale*. A Flutter project satisfies it through its own localisation delegates. |

## Sources

| Source | Record |
|---|---|
| The English-only-through-the-layer decision; the 9 dropped locales (open decision D4) | `code/production-projects/lifewell-project-root/00-REBUILD-MASTER-PROMPT.md` |
| The unit-conversion and daily-log boundary risks | `aoneahsan-cccs-unit-testing` |

## Related skills

- `aoneahsan-cccs-copywriting` — the strings themselves
- `aoneahsan-cccs-react-forms` — validation messages in the Zod schema, mirrored by `validation.json`
- `aoneahsan-cccs-unit-testing` — unit conversions and date boundaries earn tests
- `aoneahsan-cccs-frontend-development` — logical properties in layout

## Maintenance

- **Living registries this skill points at:** none.
- **Last reviewed:** 2026-07-25

# Analytics — overview

## Purpose

The owner's requirement is not "add analytics" — it is that events **actually fire** into Firebase GA4,
Amplitude and Microsoft Clarity. That distinction is the whole skill: analytics is fire-and-forget by design,
so a wrong key, a blocked script or a consent gate fails **silently**, and a green build proves nothing.

The second half is naming. Without a registry, `water_logged`, `waterLogged` and `log_water` all exist by
month three, no dashboard is trustworthy, and the fix is a migration.

## What this skill does

- Puts **one service in front of all three destinations**, so no feature code imports a vendor SDK.
- Requires **live verification in each dashboard**, with where to look in each, because dispatched ≠ landed.
- Fixes the **`object_verb` snake_case taxonomy** in a **typed registry**, with a bounded property vocabulary.
- Moves emission to the **design-system primitive layer**, so a feature author gets tracking by using the
  component rather than by remembering.
- Covers **identity on sign-in and clearing on sign-out**, and consent that gates *loading*, not just sending.
- States **PII rules stricter than the fleet default** — never a health value, never free text, never an
  identifier beyond the user id.

## When it gets invoked

- Adding tracking to a feature or a component.
- Naming a new event.
- Wiring consent or an opt-out.
- Events appearing in code but not in a dashboard.
- An audit of what the app collects, or a privacy/data-safety review.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project with product analytics |
| Stack override | 🔴 **The three destinations are NOT interchangeable — GA4, Amplitude and Clarity are the standard** (owner, R-024), and each is kept because it answers a different question. What the override may change is the *transport* on a stack that cannot carry one, never the set. The one real carve-out: a browser extension may load neither GA4 nor Clarity (remote code = store rejection), so there it is Sentry-as-a-bundled-package and nothing else. |

## Sources

| Source | Record |
|---|---|
| The three-platform tracking rule | `_source-understanding/files/generic-project-rules.md` |
| The quality bar's instrumentation row | `aoneahsan-cccs-react-ui-ux` |
| The fleet's fire-and-forget failure (a dead email path that passed every gate) | `~/.claude/rules/fileshub-api.md` → quirk #13 |

## Related skills

- `aoneahsan-cccs-design-system` — where events are emitted from
- `aoneahsan-cccs-react-ui-ux` — the instrumentation dimension of the quality bar
- `aoneahsan-cccs-error-tracking` — the sibling pipeline, same gating discipline
- `aoneahsan-cccs-plans-entitlements` — upgrade-funnel events
- `aoneahsan-cccs-coding-standards` — env-key gating so an unconfigured destination is simply off

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/publishing-compliance.md` (the data-safety
  declarations that must agree with what is actually collected).
- **Last reviewed:** 2026-07-25

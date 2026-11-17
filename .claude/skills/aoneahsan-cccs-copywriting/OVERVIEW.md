# Overview — `aoneahsan-cccs-copywriting`

## Purpose

Makes prose clear on the first read and keeps every claim honest. It joins Strunk's timeless clarity rules
(omit needless words, active voice, concrete language, emphatic word last) with the owner's product voice —
100% honest framing, no hype, and zero banned words on any store listing. It also fills the `copywriting`
binding that the skill table named but that was never installed.

## What this skill does

- Applies the composition rules to any human-facing text: docs, commits, errors, UI copy, reports.
- Enforces honest framing: state what a tool does NOT do; browser-only privacy claims match reality; no
  fabricated statistics (cite a real source or cut the number).
- Keeps store copy short and factual (title/short/full limits) with depth pushed to the app/website.
- Blocks banned words on store listings and points at the canonical rejection-rule policy files.

## When it gets invoked

- Writing or editing any prose a human reads.
- "write the store listing / description / release notes / marketing copy".
- UI microcopy: buttons, errors, empty and loading states, onboarding.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any — clarity rules are universal; store rules apply to published apps/extensions. |
| Stack override | Copy lives wherever the chosen stack renders it; the rules are unchanged. |

## Sources

| Source | Record |
|---|---|
| elements-of-style:writing-clearly-and-concisely (Strunk 1918, public domain) | composition rules distilled into `references/prose-rules.md` (the 12k-token HTML was NOT vendored) |
| owner rules (publishing-compliance, seo-aeo-ranking, policy JSONs) | honest-framing + banned-words (pointers, not copies) |

## Related skills

- `aoneahsan-cccs-documentation` — the brevity budget for project docs.
- `aoneahsan-cccs-react-ui-ux`, `-react-seo`, `-react-aeo` — where UI and search copy are applied.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/publishing-compliance.md`,
  `~/.claude/rules/seo-aeo-ranking.md`, `~/.claude/policy/*.json`.
- **Last reviewed:** 2026-07-23

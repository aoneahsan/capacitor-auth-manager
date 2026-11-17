# Overview — `aoneahsan-cccs-brainstorming`

## Purpose

Gets intent and design agreed before any plan or code exists, so implementation builds the right thing once
instead of the wrong thing twice. Unexamined assumptions are cheapest to catch at the idea stage; a "simple"
request is exactly where a wrong guess costs the most rework.

## What this skill does

- Explores project context and the request's real purpose, constraints, and success criteria.
- Asks focused questions one at a time (AskUserQuestion in Claude Code), never a wall of them.
- Offers 2-3 approaches with trade-offs and a recommendation.
- Presents a design scaled to its complexity and gets the owner's approval section by section.
- Decomposes over-scoped requests into sub-projects before refining any one.
- Hands the approved design to `aoneahsan-cccs-task-planning` — never straight to code.

## When it gets invoked

- "build / add / make / let's do X" where X's shape is not fully specified.
- "I want a feature that…" / "can we add…" / a broad or two-way-readable request.
- Any creative or behavior-changing work before a plan or code exists.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any — the design-before-build discipline is stack-independent. |
| Stack override | Design in the project's chosen stack's terms; the flow is unchanged. |

## Sources

| Source | Record |
|---|---|
| superpowers:brainstorming (obra, MIT) | folded 2026-07-23; adapted to AskUserQuestion + ask-the-owner + the plan/tracker conventions (design → `~/.claude/plans/`, not a separate specs tree) |

## Related skills

- `aoneahsan-cccs-ask-the-owner` — a blocking owner-only decision pauses the work.
- `aoneahsan-cccs-task-planning` — the terminal step; turns the approved design into a plan + tracker.
- `aoneahsan-cccs-copywriting` — clear prose for the design itself.

## Maintenance

- **Living registries this skill points at:** none (points at sibling skills only).
- **Last reviewed:** 2026-07-23

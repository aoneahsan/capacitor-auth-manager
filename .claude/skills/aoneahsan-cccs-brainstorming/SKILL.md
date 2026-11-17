---
name: aoneahsan-cccs-brainstorming
description: 'Use before any creative or build work — a new feature, component, screen, integration or behaviour change — and whenever a request is vague, broad, or readable two ways. Explores intent, constraints and design, and gets the owner''s approval, before a plan or code exists.'
metadata:
  source: superpowers:brainstorming (obra, MIT), adapted to AskUserQuestion + the owner's ask-the-owner and plan/tracker conventions
---

# Brainstorming

## Overview

Turn an under-specified idea into an agreed design before planning or building. Unexamined assumptions are
cheapest to fix here — a wrong guess about intent becomes wasted implementation later. Explore context, ask
only material questions, offer approaches when a real trade-off exists, and get one approval for the resulting
design. Then move to planning without repeated confirmation rituals.

**The standard:** unresolved product or architecture choices block implementation. A fully specified request
with no material choice does not need a ceremonial design or approval.

## When to use

- A new feature, component, screen, integration, or behavior change is requested.
- The request is broad, ambiguous, or has more than one reasonable reading.
- "Build / add / make X" where X's shape isn't already fully specified.

**Not for:** a fully-specified change with no open questions (go straight to `aoneahsan-cccs-task-planning`),
a typo/rename/one-line fix, or read-only Q&A.

## The flow

1. **Explore context first** — read the project's files, docs, recent commits; follow existing patterns.
2. **Scope check** — if the request spans several independent subsystems, say so and decompose into
   sub-projects before refining any one; each gets its own design → plan → build cycle.
3. **Ask efficiently.** In Claude Code use **AskUserQuestion** (multiple-choice where it fits). Batch 1–3
   related blocking decisions in one pause; do not serialize questions the owner can answer together. Focus
   on purpose, constraints and success criteria. Follow `aoneahsan-cccs-ask-the-owner`.
4. **Offer 2-3 approaches only when there is a real trade-off**, recommendation first. Do not manufacture
   options for an obvious implementation.
5. **Present one design scaled to complexity** (a sentence for the obvious, short sections for the nuanced),
   then request one approval. Cover architecture, components, data flow and error handling only as relevant.
   Apply YAGNI — cut anything the goal does not need.
6. **On approval → `aoneahsan-cccs-task-planning`.** The agreed design becomes the plan's Context/overview
   (plans live in `~/.claude/plans/`); no separate specs tree unless the project already has one.

## Common mistakes

| Mistake | Instead |
|---|---|
| Fully specified work forced through a design ritual | Go straight to planning or implementation when no material choice remains |
| Asking five unrelated questions or serializing related ones | Batch 1–3 related blocking decisions in one structured pause |
| Jumping to code once you "get it" | The hard gate holds until the owner approves the design |
| Manufacturing alternatives for an obvious path | Offer options only when the trade-off can change the result |
| Refining details of an over-scoped request | Decompose into sub-projects first |

## Related skills

`aoneahsan-cccs-ask-the-owner` (blocking questions pause the work) · `aoneahsan-cccs-task-planning` (the
next step — turns the approved design into a plan + tracker) · `aoneahsan-cccs-copywriting` (writing the
design clearly).

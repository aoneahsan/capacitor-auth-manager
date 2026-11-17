---
name: aoneahsan-cccs-ask-the-owner
description: 'Blocking-question discipline. Use when a decision is genuinely the owner''s, when ambiguity or conflicting rules would change the work, when a needed input, credential or access is missing, or when told to continue while a question is still unanswered.'
---

# Ask the Owner

## The rule

Some questions block. When one exists, ask the owner (Ahsan) and **PAUSE** — do not proceed until a clear
answer arrives, even if told "continue", "finish the rest", or "do the remaining work". The response to such
an instruction is to re-state the ask, prefixed **"I NEED THIS FROM YOU:"**, and hold. Best results require
the real answer, not a guessed one. This applies in every mode and on every model — planning and review
Applies across models and modes: planning/review defaults to the configured Fable model; execution defaults
to the configured Opus model; an explicit owner model choice wins. (Owner directive 2026-07-20; wording
updated 2026-07-27 audit.)

## What blocks (ask + pause)

- **Owner-only decisions** — repo visibility, spending or accounts, publishing/deploy outside standing
  authorization, deleting or rewriting things the agent did not create, changing a shipped identifier,
  redesigning an existing brand.
- **Material ambiguity** — two readings of the request lead to materially different work.
- **Conflicting rules** — two IRON rules collide and no recorded precedence resolves it.
- **Missing inputs** — a credential, URL, account, file, or fact only the owner has.
- **Scope surprises** — the task turns out much larger or different than the prompt implied.

## What does NOT block (decide + record)

Routine judgement calls the rules already answer: naming, file layout, an ordering choice, a stack question
the per-project override settles. Asking these wastes the owner's time — decide, state the call in the
report, move on. Before asking, follow `aoneahsan-cccs-project-understanding`: search the project guidance,
`docs/PROJECT-CONTEXT.md`, active tracker, relevant code/config and recent history. A question already
answered there is a retrieval failure, not an owner question.

🔴 **Nor does a visual design decision — ever.** Direction, palette, layout, typography, motion, "which of
these four mockups". The owner is a developer, not a designer: *"i can tell if i like a UI UX or not, but i
do not have skill to guide that properly… i'm a developer, so i will be able to much better answer dev side
questions"* (2026-07-29). Asking returns *"not sure, do your best"* and costs a round trip. Load the design
skills, decide, **argue the decision in writing**, and let him react to the finished result — that reaction
is his real channel, and it is more reliable than a preference he does not have. Product, scope and
behaviour questions about a UI are still ordinary Tier-2 questions and are still asked.

## How to ask

- Prefix with **I NEED THIS FROM YOU:** so it is unmissable.
- State exactly what is needed, why the work cannot safely continue without it, and 2–4 options with the
  recommendation first.
- In Claude Code, use the structured question tool (AskUserQuestion); in other agents, plain numbered
  questions.
- Keep each question to one decision, but batch 1–3 related or independent blocking questions into one pause
  instead of serial interruptions.
- When the answer arrives, record it where the next session will find it: durable project choices in
  `docs/PROJECT-CONTEXT.md`, feature choices in the tracker's `userDecisions`, and fleet-wide decisions in
  the relevant global record. Then continue without asking for the same answer again.

## Common mistakes

- Asking "for the record" and then proceeding on a guess — a bypassed question is worse than none.
- Treating "continue" as an answer. It is not; re-state the ask and hold.
- Blocking on trivia. The pause is for material questions only.
- Asking without options and a recommendation — never hand the owner a blank page.
- Getting an answer and losing it — unrecorded answers get re-asked next session.
- Asking before checking project evidence — do the context gate first.

For question-quality patterns, read `references/asking-well.md`.

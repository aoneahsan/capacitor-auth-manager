# Overview — aoneahsan-cccs-ask-the-owner

The blocking-question discipline: when a question genuinely belongs to the owner, the agent asks it and
pauses until answered — holding the pause even against "continue" — instead of guessing and producing work
that has to be redone. It also draws the opposite boundary: routine judgement calls are decided, recorded,
and never escalated.

## What this skill does

- Defines which questions **block** (owner-only decisions, material ambiguity, conflicting rules, missing
  inputs/credentials, scope surprises) and which **never do** (routine calls the rules already answer).
- Mandates the pause protocol: **"I NEED THIS FROM YOU:"** + what is needed + why + options with a
  recommendation — repeated, not abandoned, if the owner replies "continue/finish the rest".
- Applies across models and modes: planning/review defaults to the configured Fable model; execution defaults
  to the configured Opus model; an explicit owner model choice wins.
- Requires every received answer to be recorded where the next session finds it (tracker `userDecisions`,
  plan file, or record).
- Carries question-quality patterns in `references/asking-well.md`.

## When it gets invoked

- A decision surfaces mid-task that only the owner can make.
- The request can be read two materially different ways.
- Two rules conflict with no recorded precedence.
- A credential, URL, account, or fact only the owner has is missing.
- The owner says "continue" while a blocking question is still unanswered.
- Planning or review reaches a fork the plan cannot settle alone.

## Related skills

`aoneahsan-cccs-documentation` (where answers get recorded — trackers, plans) ·
`aoneahsan-cccs-git-workflow` (what is auto-authorized vs owner-only).

## Maintenance

Established from the owner's 2026-07-20 directive, verbatim intent: "ask me and get clear answers from me;
until you have what you need do not continue; even if i say continue, stop by responding I NEED THIS FROM
YOU." Enforced in three surfaces: this skill, the per-turn UserPromptSubmit hook text, and the global
CLAUDE.md/AGENTS.md rule.

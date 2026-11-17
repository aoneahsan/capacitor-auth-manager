# Overview — interaction feedback

## What this skill is for

It answers one question, everywhere it comes up: **the user just did something — what does the product say
back, where, and how fast?**

That question has no single home in the rest of the family. `aoneahsan-cccs-react-ui-ux` covers the four
states a *data surface* passes through (loading, empty, error, content). `-react-forms` covers submit state.
`-react-api-tanstack-query` covers optimistic writes. `-motion` covers what may move. None of them says an
action must be answered at all, and none says where the answer goes.

The gap shows up as a specific complaint: the page looks right, works right, passes every automated gate,
and **feels dead**. Nothing is broken. Something was never added.

## The shape of the guidance

Two halves, deliberately:

- **A ladder, not a rule.** "Give feedback for everything" produces a product that toasts on every keystroke,
  which is a different failure with the same cause — no model of *how much* acknowledgement an action earns.
  The ladder maps action weight to channel so the decision is made once, in the primitive, rather than
  re-argued per feature.
- **A list of tells.** The failure is an omission, and omissions are invisible to review. The tells are what
  a person notices when they use the page, written down so they can be looked for on purpose.

## Where it applies

Everywhere a person can act: click dummies first (the interaction is part of the specification, not a later
pass), then the real app. Stack-agnostic — the ladder is about the concern, and a Flutter or Tauri product
satisfies it with its own idioms.

## What it deliberately does not cover

- **What may move, and for how long** — that is `aoneahsan-cccs-motion`, and this skill defers to it rather
  than restating easing, duration or reduced-motion handling.
- **Decorative life** — cursor, parallax, magnetic hover. Those are marketing-surface levers in
  `~/.claude/rules/frontend-ui-standards.md` §1a. Feedback is not decoration; it is owed on every surface,
  including the densest internal tool.
- **How a reviewer explores these states** — that is `aoneahsan-cccs-component-playground`.

## Files

| File | Holds |
|---|---|
| `SKILL.md` | the ladder, the optimistic/pending split, announcement, choreography, the dead-page tells |
| `references/channels.md` | the recipes — toast, inline, undo, focus-on-error, live regions, list transitions |
| `references/sound.md` | the sound layer: the axis, the gesture gate, the three-sound budget, WebAudio |
| `FLOW.mmd` | choosing the channel for an action |

**Last updated:** 2026-08-01 (created — owner directive: every app must feel alive and answer the user)

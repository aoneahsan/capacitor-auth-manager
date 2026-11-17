---
name: aoneahsan-cccs-interaction-feedback
description: 'The acknowledgement contract for every user action: which channel answers which action, where the answer appears, the response-time budget, optimistic vs pending writes, undo instead of confirm, announcement to assistive tech, error and success choreography, sound as opt-in. Use when wiring any button, form, toggle or async write.'
metadata:
  author: aoneahsan
  source: owner directive 2026-08-01; LifeWell click-dummy gallery audit
---

# Interaction feedback

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

**The contract: no action goes unacknowledged, and the acknowledgement appears where the user is already
looking, within 100 ms.** An interface that accepts input silently is the "dead" complaint — and it passes
contrast, overflow, keyboard and console checks, because nothing is wrong. Something is *missing*.

Concern-first: the ladder below applies to any stack. HTML/React is the worked example.

## 🔴 The acknowledgement ladder

Match the channel to the **weight** of the action, not to whatever is easiest to reach for.

| Action | Acknowledgement | Never |
|---|---|---|
| **Instant, local** — toggle, tab, checkbox, expand, filter | the visual state change itself, ≤100 ms | a toast. It is noise for something the user can already see |
| **Short async** — save, submit, favourite | pending **on the control that was pressed**, then success in place | a page-blocking overlay, or a global spinner |
| **Consequential** — delete, publish, invite, send | a toast **carrying undo** | a confirm dialog, where the action is reversible |
| **Failure** | inline **at the cause**, focus moved there | a toast alone; the user is left hunting for which field |
| **Long / background** — import, upload, export | determinate progress, with what and how much | an indeterminate spinner for a job with a known size |

🔴 **Acknowledge at the control the user touched.** A button press answered by a toast in the opposite corner
makes the user hunt for their own confirmation. The button holds its own pending and success state; the
toast is for what happens *elsewhere*.

🔴 **Toast is the fallback channel, not the default.** The same argument as celebration in
`aoneahsan-cccs-motion`: toast everything and the toast that mattered is ignored. If the change is visible on
screen, the change **is** the feedback.

## 🔴 Optimistic for reversible, pending for irreversible

Apply a reversible write to the UI immediately and reconcile behind it — a favourite, a reorder, a rename, a
checkbox. Reserve the pending state for writes that cannot be walked back: payment, publish, permanent delete,
anything with an outbound side effect.

**Every optimistic write owns its rollback**, and the rollback is a *visible* correction with an explanation —
never a silent revert, which reads as the app losing the user's work. Server-data mechanics:
`aoneahsan-cccs-react-api-tanstack-query`.

**Undo beats confirm** wherever the action is reversible. A confirm dialog interrupts every user to protect
against the rare mistake; undo interrupts nobody and still protects them. Keep the window ≥5 s, and never let
a dismissal timer be the only thing standing between the user and permanent loss.

## 🔴 Visual-only is invisible

A green tick is nothing to a screen reader. Every acknowledgement is also **announced**:

| Outcome | Politeness | Why |
|---|---|---|
| success, saved, copied | `aria-live="polite"` | it waits for a pause; interrupting is rude for good news |
| error, failed, rejected | `role="alert"` (assertive) | it must interrupt; the user is about to act on stale belief |
| progress | `aria-busy` on the region, one polite update at completion | announcing every percent is an assault |

**Move focus to the first error on a failed submit.** Scrolling to it is not enough — a keyboard user is
still parked on the submit button. `aoneahsan-cccs-react-accessibility`.

## Error and success choreography

🔴 **The error message never animates in.** `aoneahsan-cccs-motion` forbids it, and the reason is the point:
the user needs to read it *now*. The *control* may carry one non-blocking cue of ≤200 ms, dropped entirely
under reduced motion. Message instant, control expressive — that is the whole rule.

Success is the mirror: the state change lands immediately, and any flourish is decoration on top of an
already-complete result. Reserve celebration for genuine milestones, per `-motion`.

## 🔴 The dead-page tells

No gate catches any of these. The instrument is using the page.

- Nothing responds to hover or press — every control looks identical before, during and after being used.
- A submit button that is byte-identical while the request is in flight, so the user clicks it again.
- A number or list that jumps to its new value with no transition, so the change is never perceived.
- A row that vanishes on delete with no undo and no confirmation that anything happened.
- A failed form that reports "something went wrong" somewhere other than the field that caused it.
- A destructive action whose only feedback is that the thing is gone.

## Sound — a real channel, off by default

Opt-in via the **`sound` theme axis** (`aoneahsan-cccs-react-theming`), default **off**, because a product
that beeps unasked gets muted at the OS level and loses the channel permanently. At most **three** sounds in a
product, each under 300 ms, never the only channel carrying a meaning, and never attempted before the user's
first gesture — browsers block it and the failure is silent. Full contract, including the WebAudio
implementation that ships no audio files: **`references/sound.md`**.

**Native haptics** are the same decision on a different transducer — `@capacitor/haptics`, per
`aoneahsan-cccs-capacitor-packages-setup`. Not restated here.

## Going deeper

**`references/channels.md`** — the toast, inline, optimistic and undo recipes; the focus-on-error pattern;
`aria-live` wiring that actually announces; skeleton→content crossfade; and list insert/remove transitions,
which are the cheapest single thing that makes a product surface feel alive.

## Related skills

`aoneahsan-cccs-motion` (the movement vocabulary and the responsiveness floor) · `-component-playground`
(driving these states so they can be reviewed) · `-react-ui-ux` (the four data states and the quality bar) ·
`-react-forms` (submit state) · `-react-api-tanstack-query` (optimistic writes) · `-react-accessibility`
(announcement and focus) · `-react-theming` (the `sound` axis) · `-copywriting` (what the message says).

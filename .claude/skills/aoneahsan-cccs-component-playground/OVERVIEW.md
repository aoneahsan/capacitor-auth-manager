# Overview — component playground

## What this skill is for

It closes a specific, expensive gap: a component gallery shows what the author already decided, so reviewing
it can only confirm or reject that decision. It cannot answer *"what happens when…"* — which is the question
the reviewer actually has, and the reason a click dummy takes three or four rounds instead of one.

The owner's words, 2026-08-01: the dummies *"feel dead"*, with no *"controls for user to play with
components, play with charts, elements … to feel how it will look/behave with different data, different input
and at different states"*.

## Why it is a separate skill from the gallery

`aoneahsan-cccs-click-dummy/references/component-gallery.md` specifies **what** to build — the eight files,
the inventory, the state row, the definition of done. This skill specifies **how a reviewer interrogates it**,
and that applies in two places the gallery reference does not reach: the app's dev-only `/_gallery` route
(`-design-system`), and any project that never had a click dummy at all.

Keeping them separate also keeps the gallery reference from doubling in size, and lets the playground be
invoked on its own when the question is "this chart is hard to judge" rather than "build me a dummy".

## The shape of the guidance

The failure is *"complies, but the output is the wrong shape"* — a gallery gets built, it is just static. Per
the authoring rules that calls for a **positive recipe** (say what the output IS) plus a **required slot** in
the template it fills, not a prohibition list. So:

- the five dial families are stated as an inventory to produce, not as advice;
- `component-gallery.md` gains a REQUIRED slot, so the omission is visible in the file being written;
- the two rules that *are* prohibitions — knobs must drive one real instance, and demo state is never
  persisted — are red-flagged, because both produce something that looks correct.

## What it deliberately does not cover

- **What the states should look like** — `-frontend-design`, `-design-system`.
- **How a component behaves when acted on** — `-interaction-feedback`. The playground exposes that behaviour;
  it does not define it.
- **The theme axes.** A context dial delegates to the one theme control (`-react-theming`); a playground that
  reimplements appearance or density switching is a second control, which is the failure §11 of
  `~/.claude/rules/frontend-ui-standards.md` exists to prevent.

## Files

| File | Holds |
|---|---|
| `SKILL.md` | one-real-instance, the state row staying, the five families, chart dials, the mutation test |
| `references/dials.md` | the dial catalogue per component family, and the harness in vanilla and React |
| `references/embeds.md` | live product iframes — the framing probe, the contract, the fallback |
| `FLOW.mmd` | what a component needs before it counts as reviewable |

**Last updated:** 2026-08-01 (created — owner directive: reviewers must be able to drive a component)

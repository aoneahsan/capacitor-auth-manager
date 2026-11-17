---
name: aoneahsan-cccs-component-playground
description: 'The live playground that makes a component reviewable: knob panels driving one real instance, the five dial families (data shape, state, variant, content, context), chart dials, deep-linkable never-persisted knob state, and live iframe embeds of our own products. Use when building or reviewing a component gallery.'
metadata:
  author: aoneahsan
  source: owner directive 2026-08-01; LifeWell click-dummy gallery audit
---

# Component playground

**A component is specified when a reviewer can drive it — not when a screenshot of it exists.** A gallery of
static specimens documents a decision already made; a playground is where the decision gets tested, against
the data and states that actually break things.

This is what closes the "it looks good but I can't tell how it behaves" gap, and it is why a dummy needs three
or four rounds: each round discovers by hand what a dial would have surfaced in one.

## 🔴 Knobs drive ONE real instance

A panel that switches between pre-rendered specimens is the same static gallery with extra steps. It renders
identically to a working one, passes every gate, and proves nothing — because the specimens were authored,
so they can only show what the author already thought of.

One live component. The knobs write its props, its data and its state. **The value of the dial is that it can
produce a combination nobody designed**, which is precisely where the defect is.

## 🔴 The side-by-side state row stays

The playground is *added to* the gallery, never a replacement for it. They answer different questions:

| Surface | Question | Why it cannot be the other |
|---|---|---|
| **state row** — every state, labelled, at once | *are these consistent with each other?* | comparison needs simultaneity |
| **playground** — one instance, driven | *what happens when…?* | exploration needs a live target |

A component with a state row and no playground is under-specified. One with a playground and no row has lost
the only view that catches an inconsistent hover across five components.

## The five dial families

Not every component needs all five; **say which you omitted and why**, the same discipline as trimming the
component inventory.

| Family | Dials |
|---|---|
| **Data shape** | empty · one · typical · dense · extreme (10k) · **longest plausible string** · RTL · missing/null fields |
| **State** | the state row as a dial — default · hover · focus-visible · active · disabled · loading · error · read-only · selected |
| **Variant** | size · tone/intent · emphasis · with-icon · full-width |
| **Content** | label length · wrapping · truncation · a number at its widest (999,999.99) |
| **Context** | 320 / 768 / 1440 width, and the theme axes — which **delegate to the theme control**, never a second copy |

🔴 **Longest-plausible-string and empty are the two that find bugs.** A layout tuned on "Dashboard" breaks on
a real German label; a card designed with three items collapses at zero. Both are one dial away and neither is
ever the specimen an author picks.

## Charts get their own dials

Chart layouts fail on data, not on styling, and the failures are specific:

**series count** (1 · 3 · the maximum the palette supports · one past it) · **point count** (1 · 7 · 365) ·
**zero, negative and null values** · **a single spike** flattening everything else · **all-equal values**
(a flat domain, which divides by zero in a naive scale) · **long category labels** · **the empty and loading
states**.

`aoneahsan-cccs-click-dummy/references/component-gallery.md` already names the single data point as the case
that breaks most chart layouts. The dial is how anyone actually sees it. Charts are D3 —
`aoneahsan-cccs-d3-charts`, including the rule that a chart's data table is its primary accessible form, and
the frame-stability rule that a chart must not resize with its own data.

## Deep-linkable, never persisted

Knob state goes in the query string (`?data=extreme&state=error`) so a reviewer can send back the exact broken
combination rather than describing it.

🔴 **It is never persisted.** A reviewer flips one dial, forgets, and every page for the rest of the session
looks broken — the demo-axis rule in `aoneahsan-cccs-click-dummy/references/state-layer.md`. Preferences
persist; demonstration axes do not. If the dummy decorates links with ambient state, demo dials are excluded
from that decoration (pitfall 16 in the same skill).

## One harness, two homes

The same harness serves the click dummy's eight gallery files and the app's dev-only `/_gallery` route
(`aoneahsan-cccs-design-system`) — vanilla in the dummy, a component in the app, one contract. Built as
**shared chrome with a single owner that also creates its own markup**, behind an idempotent guard: a knob
panel hand-copied per gallery file is pitfall 4, where the first page works and the rest silently do not.

## Live product embeds

When a page references one of our own products, **embed the running product, not a screenshot** —
`references/embeds.md`. 🔴 Check the target's `frame-ancestors` / `X-Frame-Options` **before** designing the
section: several of ours refuse to frame, and an empty box is worse than the screenshot it replaced.

## Verifying a playground is real

🔴 **Disconnect a knob on purpose and confirm the check goes red.** A dial wired to nothing looks exactly like
a working one — this is the mutation test in `~/.claude/rules/frontend-ui-standards.md` §10, and it is the
only thing separating a playground from a decoration of one.

Then assert on the **consequence**: the rendered box, the computed style, the node count. Reading back the
attribute the knob just wrote agrees with itself (pitfall 8).

## Going deeper

**`references/dials.md`** — the full dial catalogue per component family, the chart dials, and the harness
recipe in both vanilla and React. **`references/embeds.md`** — the live-iframe contract, the framing probe,
and the fallback.

## Related skills

`aoneahsan-cccs-click-dummy` (the gallery this slots into, and GATE 2) · `-design-system` (the app's gallery
route) · `-interaction-feedback` (the behaviour the dials expose) · `-d3-charts` · `-url-state-persistence`
(the query-string contract) · `-react-aria` (whose DOM the widgets are) · `-frontend-development` (the width
matrix the context dial samples).

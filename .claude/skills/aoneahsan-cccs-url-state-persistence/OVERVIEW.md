# Overview — `aoneahsan-cccs-url-state-persistence`

## Purpose

Makes the URL the source of truth for user-visible UI state, so a refresh never loses someone's place and any
view can be shared as a link. The owner ranks this among the most important frontend rules, and it is the one
most often skipped because `useState` is quicker to type.

## What this skill does

- Gives the decision test — *could someone paste this URL and see the same screen?* — and the table of states
  that belong in the URL: modals, tabs, form steps, accordions, filters, sort, pagination, selected entity,
  search.
- Names the states that **stay local**: loading, hover, focus, in-flight submit, validation errors,
  uncommitted input, animation.
- Fixes the **param naming contract** shared across every project, and the rule that a default value means the
  param is omitted.
- Requires the shared `useUrlState` hooks rather than per-component `URLSearchParams` parsing.
- Distinguishes **push from replace** so the browser Back button behaves as users expect — replace for
  filters and tabs, push for modals and wizard steps.
- Requires legacy path-based routes that merely open a modal to redirect to the URL-synced equivalent.

## When it gets invoked

- Adding a modal, dialog, drawer, tab, accordion, or multi-step form.
- Adding filtering, sorting, pagination or search to any list.
- A refresh loses the user's place, or a shared link does not reproduce a view.
- Reviewing a component that holds UI state in `useState`.

## Where it applies

Every React project, and by analogy any client-rendered UI with addressable state.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-032) and
`_source-understanding/files/prompt-logs.md` (the owner's "most important rules" framing and the
fix-all-four-concerns-when-you-touch-a-component instruction).

## Related skills

`aoneahsan-cccs-react-forms` (multi-step forms) · `-react-tables-tanstack` (table state) · `-react` (routing)
· `-react-ui-ux` (modals and navigation).

## Maintenance

Stable. The param-name list is the part to extend as new shared patterns appear.

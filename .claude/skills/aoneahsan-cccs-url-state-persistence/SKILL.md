---
name: aoneahsan-cccs-url-state-persistence
description: 'Encoding UI state in the URL: which states belong there, the shared param naming contract, the hooks that read and write them, and the transient state that should stay local. Use when adding a modal, tab, accordion, multi-step form, filter, sort or search, or when a refresh loses the user''s place.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# URL state

The owner calls this *"1 very basic, yet 1 of the most important rules"*: after a refresh, the user lands
**exactly** where they were.

The test is simple — **could someone paste this URL to a colleague and have them see the same screen?** If the
answer should be yes, the state belongs in the URL.

## What goes in the URL

| State | Param |
|---|---|
| Modal / dialog / drawer open | `?compose=1`, `?edit=<id>` |
| Active tab or section | `?tab=pending`, `?section=scheduler` |
| Multi-step form step | `?step=2` |
| Expanded accordion | `?open=section1,section3` |
| Filter, sort, pagination | `?status=failed&sort=created&dir=desc&page=3` |
| Selected entity in a detail pane | `?view=<id>` |
| Search query | `?q=term`, but only where no analytics tool reads the URL (see below) |

🔴 **A typed search term in the URL is free text in every analytics payload that reads the page address.** gtag.js
stamps `document.location.href` (`dl`) and `document.title` (`dt`) on every GA4 hit; Clarity records the URL and
the page's text. So on any route where GA4 or Clarity runs, either the term stays out of the URL (history state,
as the NetCage docs search does since 2026-11-08) and out of the tab title, or every sink is given a sanitised
address (`gtag('set', {page_location})`, never on `config`, which outranks every later `set`) and replay is off on
that route. Measured both ways on NetCage, 2026-11-08 (`aoneahsan-cccs-analytics` → silent-failures).

## What stays local

Loading flags, hover and focus, in-flight submit state, validation errors, uncommitted input, animation
state. These are not shareable and not meaningful after a refresh — putting them in the URL creates history
noise and a jittery address bar.

## Naming is a fleet-wide contract

`compose` · `edit` · `view` · `tab` · `section` · `step` · `page` · `q` · `status` · `range` · `confirmDelete`

Same names everywhere, so a URL from one project reads correctly in another. **A default value means the
param is omitted** — `?tab=overview` when overview is the default is noise, and it makes "is this the default
view?" harder to answer.

## Never bare `useState` for these

```tsx
const [isOpen, setIsOpen] = useState(false);              // ❌ refresh closes the modal
const [isOpen, setIsOpen] = useUrlBooleanState('compose'); // ✅ refresh restores it
```

Use shared hooks in `src/lib/hooks/useUrlState.ts` — `useUrlBooleanState`, `useUrlStringState`,
`useUrlNullableString`, `useUrlNumberState` — rather than hand-parsing `URLSearchParams` per component.

## Push versus replace

**Replace** for state the user should not have to press Back through repeatedly — filters, search-as-you-type,
tab switches. **Push** where Back should undo the action — opening a modal, advancing a wizard step — so the
browser's Back button does what the user expects instead of leaving the page entirely.

## Storage-backed state

Anything that outlives the URL — a remembered filter set, a draft — persists through **`strata-storage`**,
never a raw web storage API; it has a `url` adapter, so the same `get`/`set` covers both surfaces
(`aoneahsan-cccs-strata-storage`).

## Legacy paths redirect

A path-based route that only opens a modal (`/jobs/new`) should `navigate(..., { replace: true })` to the
URL-synced equivalent (`/jobs?compose=1`) on mount, so old links keep working without two sources of truth.

For the hook implementations and integration with forms and tables, read `references/hooks.md`.

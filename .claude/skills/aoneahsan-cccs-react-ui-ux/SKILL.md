---
name: aoneahsan-cccs-react-ui-ux
description: 'Page-level experience patterns in React: boot loaders, empty and error states, branded error pages, navigation affordances, the share contract, and the copy that carries a product''s voice. Use when building a page, designing an empty or loading state, adding a share action, adding any link that leaves the site (new tab, do-follow vs nofollow), or when a flow feels unfinished.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# UI/UX patterns

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

Where `aoneahsan-cccs-frontend-design` governs how things look, this governs what a page **does** in the
states nobody demos: empty, loading, failed, offline, first-run.

## The states that get skipped

Every data-driven surface has **four**, and they must be visually distinct:

| State | Requirement |
|---|---|
| **Loading** | a skeleton matching the eventual layout, not a centred spinner — a spinner causes the shift the skeleton prevents |
| **Empty** | explain *why* it is empty and give the action that fills it. Never a bare "No data" |
| **Error** | what failed, in plain language, plus a retry. Never a raw error object |
| **Content** | the case everyone builds |

An empty list rendered as a spinner is the most common "the app is broken" report that is not a bug.

## Boot loader

Full-page until theme has hydrated **and** auth has resolved — logo, spinner, rotating copy on a ~3s fade,
static for reduced-motion users. Without it the app paints light then snaps to the user's dark preference.
Code: `references/patterns.md`.

## Error pages

Branded **404, 500, 403 and 401**, styled with the app, each offering a way home and a way back. SVG
illustration, copy in the product's voice, and every link audited to lead somewhere real.

## Navigation affordances

- **Go-back button on every page** except `/` and the post-login dashboard, targeting an **absolute** route —
  never `router.back()`, which misbehaves after a deep link, refresh or redirect.
- **App version in the footer**, read live.
- **Scroll to top on route change**, honouring `#hash`.
- **A dismissible resume nudge** where a multi-step flow was abandoned — shown on the surfaces where the user
  will actually see it, with dismissal shared so it never nags twice.

## 🔴 Asking for something onboarding did not ask for

Onboarding grows; whoever finished it earlier was never asked. They get **one dismissible notice** (7-day
snooze, stored on the account, never the device) plus a settings section present **only while something is
outstanding**, saying per item what is asked, which surface uses it and what they get — with declining a real
answer. And **everything an onboarding offers starts ON**. `references/asked-later-info-requests.md`.

## 🔴 The first-visit legal notice — a quiet bar, never a modal

**One sentence, both policy links and "Okay", in a bottom bar; shown once per browser and per account, seen
the moment it shows, gone after 10 seconds.** `role="status"`, no overlay, page usable under it. 🔴 **Never
a dialog on page load, never a "Privacy Policy Updated" surface.** 🔴 Analytics are on by default and the bar says so in
one short line; no opt-out, no Privacy preferences panel (owner, 2026-10-30). Law `~/.claude/rules/legal-notice.md`; shape and traps:
`references/legal-notice.md`.

## Share — one contract

**Web → an in-app `WebShareModal`** (social grid + an explicit copy-link with a "Copied!" state).
**Native → `@capacitor/share`.** The branch is decided at click time via `Capacitor.isNativePlatform()`.

❌ **Never `navigator.share` as the primary web path with a silent clipboard fallback** — it is absent on
desktop Firefox and most Linux Chrome, so the button appears to do nothing. That exact bug is why this rule
exists. Treat a cancelled share as a no-op, not an error.

Full spec: `~/.claude/rules/share-feature.md`.

## 🔴 Links — one contract

**Every link leaving the origin opens in a new tab; only OUR OWN products and profiles are
do-follow, everything else third-party is `nofollow`.** One policy module, one `ExternalLink`, and a
lint rule refusing a raw `<a>` with an absolute href. It is host **and path**, `rel="me"` proves
ownership by itself, and the new tab is announced. Table, gates and traps:
`references/patterns.md` → "The link contract" · law: `rules-detail/frontend-ui-standards.md` §15.

## Copy is design

Error messages, empty states, button labels and loading text all carry the product's voice. "Something went
wrong" is a missed opportunity; so is a button labelled "Submit".

## 🔴 The component quality bar

**Every component ships looking right, working right, and usable by everyone — all three, or it is not
done.** This is the single home for that contract; other skills carry the depth behind each line.

A component is complete when all of this is true:

| Dimension | The bar |
|---|---|
| 🔴 **Feedback** | Acting on it produces an acknowledgement **at the control**, within 100 ms — pending then success on the control itself, an inline error at the cause with focus moved there, undo for anything consequential — and each one is announced, not only drawn. A control that looks identical before, during and after being used is the "dead" bug, and it passes every gate. See `aoneahsan-cccs-interaction-feedback`. |
| 🔴 **Theme axes** | It obeys **every** axis of the theme control — appearance, colour treatment, radius, density, text size, typeface, panel background. A component that hardcodes any of them is invisible to the control and breaks in exactly one combination. See `aoneahsan-cccs-react-theming`. |

Also: **States · Keyboard · Screen reader · Contrast · Motion · Responsive · Instrumentation · Copy · Reuse.**
Read `references/component-quality-bar.md` before calling any component done — each row's bar and the skill
holding its depth.

**Where instrumentation is wired, and what to do when the design system lacks a primitive:**
`references/patterns.md` → "Instrumentation and the missing primitive".

For state components, the boot loader and offline handling, read `references/patterns.md`.

## Related skills

`aoneahsan-cccs-frontend-design` (how it looks — tokens, palette, visual direction) ·
`aoneahsan-cccs-frontend-development` (responsive behaviour and the width matrix) ·
`aoneahsan-cccs-react-accessibility` (the depth behind the keyboard/screen-reader/contrast rows) ·
`aoneahsan-cccs-interaction-feedback` (the depth behind the Feedback row) ·
`aoneahsan-cccs-react-components` (composition and reuse) · `aoneahsan-cccs-copywriting` (the voice).

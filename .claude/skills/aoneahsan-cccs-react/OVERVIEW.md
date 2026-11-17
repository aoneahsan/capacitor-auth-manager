# Overview — `aoneahsan-cccs-react`

## Purpose

The structural baseline for a React application: where things live, how routes load, how navigation behaves,
and which decisions are already made so nobody re-litigates them per project.

## What this skill does

- Names the fixed stack (zustand, TanStack Query/Table/Virtual, react-hook-form + Zod, tiptap, Tailwind with
  custom components) and points at the skill that owns each.
- Fixes the `src/` folder layout and requires absolute `@/` imports, with the heuristic that a `../../../`
  import means the file is misplaced.
- Requires **every route to be lazy-loaded**, with heavy libraries dynamically imported at point of use.
- Sets the navigation baseline: scroll-to-top with hash handling, a go-back button whose target is an
  **absolute** route rather than `router.back()`, no dead links, branded 404/500/403/401 pages, and a live app
  version in the footer.
- Gives the deliberate hook-dependency rule — only deps that can change and that you want to react to, with
  an explicit eslint-disable for the rest — and explains why exhaustive deps are the wrong default.
- Requires an admin panel in every project, whose screens and role ladder are **derived from that project**
  (`aoneahsan-cccs-platform-admin`) and re-derived whenever a feature ships.

## When it gets invoked

- Scaffolding a new React application.
- Adding a route, a page, or a top-level folder.
- Reviewing app structure, navigation, or bundle composition.
- Deciding what belongs in a `useEffect` dependency array.
- Building or extending an admin surface.

## Where it applies

Every React project, web or Capacitor-wrapped.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-012, R-013, R-022, R-034, R-041, R-045) and
`_source-understanding/files/prompt-logs.md` (the fixed stack decisions, lazy-loading everything).

## Related skills

`aoneahsan-cccs-react-components` · `-react-forms` · `-react-state-zustand` · `-react-api-tanstack-query` ·
`-react-performance` · `-url-state-persistence` · `-frontend-design` · `-capacitor`.

## Maintenance

Re-check when a stack element changes — the fixed-stack table is the part most likely to move.

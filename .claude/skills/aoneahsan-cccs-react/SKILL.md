---
name: aoneahsan-cccs-react
description: 'React application structure: folder layout, absolute imports, routing with lazy-loaded routes, scroll restoration, the admin panel and error-page baseline, and hook dependency practice. Use when scaffolding a React app, adding a route or page, organising components, or reviewing overall structure and navigation.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# React

The stack, fixed across projects: **zustand** for state, **TanStack Query** for server data,
**react-hook-form + Zod** for forms, **TanStack Table** for tables, **TanStack Virtual** above ~200 rows,
**tiptap** for rich text, **Tailwind + custom components** for UI on new work. Each has its own skill.

## Structure

```
src/
  components/     shared, reusable — form-fields/, ui/, layout/, decorative/
  pages/          route-level components
  stores/         zustand stores
  services/       API and third-party integration
  hooks/          shared hooks
  lib/ or utils/  helpers, incl. logger.ts
  config/         env access, constants
```

**Absolute `@/` imports** for anything outside the current folder; relative only for siblings. A file that
imports `../../../` is telling you it is in the wrong place.

## Every route is lazy-loaded

```tsx
const Dashboard = lazy(() => import('@/pages/Dashboard'));
```

No exceptions for "small" pages — the point is that the core bundle stays proportional to the first screen,
not to the app. Heavy libraries are dynamically imported at the point of use. See
`aoneahsan-cccs-react-performance`.

## Navigation baseline

- **Scroll to top on route change**, unless the URL carries a `#hash` — then scroll to that section. One
  `<ScrollToTop>` component, mounted once.
- **A "go back" button on every page** except `/` and the post-login dashboard. Its target is an **absolute
  route** derived from the app hierarchy — **never** `router.back()` or `history.pop()`, which misbehave when
  the user arrived by deep link, refresh, or a redirect.
- **Every navigation link leads somewhere real.** Audit routes; no dead links.
- **Branded 404, 500, 403 and 401 pages**, styled with the app and each offering a clear way home.
- **App version in the footer**, read live — `App.getInfo()` on Capacitor, the manifest version injected at
  build time on web. Never hardcoded.

## Hook dependencies — deliberate, not exhaustive

Add only the dependencies that **can actually change** *and* that you **want the effect to react to**. For
anything else, silence the rule explicitly:

```tsx
useEffect(() => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  initializeApp();
}, []);
```

This is intentional. Adding everything the linter suggests causes excessive re-renders — worse behaviour than
the warning describes. Do not add stable refs, `useState` setters or `dispatch` to a dependency array.

## Every project gets an admin panel

🔴 **Its screens and its role ladder are DERIVED from this project, not copied from a list** — the surface is
scanned out of the schema and code, saved at `docs/admin/ADMIN-SURFACE.md`, and re-derived when features
change. Declare only the rungs this project's gates actually read. Full contract:
**`aoneahsan-cccs-platform-admin`**.

When a feature ships, its management surface ships with it — **and the artifact is updated in the same
change**, or the panel silently falls behind the product.

🔴 **Both fixed admin emails are seeded as superadmin** — the standing IRON rule in `~/.claude/CLAUDE.md`, which
also forbids re-asking. Seed **out of band** (a migration, a one-shot script); never from client code, and never
through a path a client can write.

The panel's full contract — the derivation and its saved artifact, the two-level role model, plan
administration, server-side gating, the audit log and impersonation — is `aoneahsan-cccs-platform-admin`.

For the route-and-provider skeleton, error boundaries and the RBAC shape, read `references/structure.md`.

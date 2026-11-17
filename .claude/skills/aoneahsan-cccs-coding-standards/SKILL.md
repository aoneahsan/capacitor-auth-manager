---
name: aoneahsan-cccs-coding-standards
description: 'Baseline code quality for every project: file size, logging, secrets, env contracts, error and analytics wiring, dead-code policy, ESLint pragmatism. Use when writing or reviewing any code, before any commit, when adding an environment variable or a third-party service, or when a linter is fighting you.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Coding standards

These are the non-negotiables that apply regardless of stack. They are about *concerns*, not brands — map
each to whatever the project actually uses (see `aoneahsan-cccs-documentation` for the stack-override rule).

## The hard rules

| Rule | Detail |
|---|---|
| **No hardcoded secrets** | Always an env var. A server secret never goes in a client-bundled var (`VITE_`, `NEXT_PUBLIC_`) — it gets inlined into shipped JS. |
| **No `console.*`** | One `logger` module per project. Default level `warn`. Lint rule `no-console: error`, with the logger file the only exemption. |
| **No TODOs / placeholders** | No `TODO`, `FIXME`, "coming soon", or stub returns. Implement it, or ask. |
| **Delete unused code** | Never rename to `_foo` to silence a linter. Delete it. Exceptions: required interface params, destructuring gaps, `catch (_error)`. |
| **No scripts** | No `.sh`/`.py`/`.cjs` files and no `scripts/` folder unless the owner asks. Use direct commands or `package.json` scripts. |
| **Max ~500 lines per file** | Past that, the file is doing too much. Named props, never positional. JSDoc on public functions. |

## 🔴 The data contract

Two rules that cross every stack, stated in full in `aoneahsan-cccs-data-contract`:

| Rule | In one line |
|---|---|
| **The server does the data work** | counts, totals, chart series and reports are aggregated server-side; the client never fetches rows to reduce them |
| **Every request is validated twice** | the client validates and **omits blank optional keys** rather than sending `null`; the server then checks shape → auth → authorization → business validity **before** touching the database |

A check that exists only in the browser is a UX affordance, not a boundary. A database constraint is not a
validator.

## Environment variables — the three-file commit

Adding or first using any env var changes **three** things in the same commit:

1. the central env module (typed access, sensible defaults),
2. the type declaration (`vite-env.d.ts` or equivalent),
3. `.env.example` — with a `[REQUIRED]` / `[REQUIRED*]` / `[OPTIONAL]` tag and a one-line reason.

Required vars **fail loudly at boot**, before the services that need them initialise. The error names the
missing *variables* — never their values, and in production only a generic message plus a names-only log.
Optional vars degrade gracefully and must never block boot. When a var's last use is deleted, remove it from
all three places.

## Services wire up degrading, never blocking

Error tracking and analytics each go through **one** central service that fans out to whichever providers
have keys configured and **silently skips the rest**. A missing key is never an error and never blocks the
app. Track every meaningful user action.

## ESLint: catch bugs, not theatre

Keep the config simple. `any` is banned; `unknown` is the safer escape hatch; strict mode on without every
experimental flag. For hook dependency arrays, add only deps that can actually change *and* that you want to
react to — silence the rest with an explicit `// eslint-disable-next-line react-hooks/exhaustive-deps`,
because obeying the linter fully causes worse re-render behaviour than the warning implies. These rules bind
**new code**; historical violations are a separate task.

## Before you finish

Run the project's real gates — typecheck, lint, build — and expect **zero** errors and zero warnings, even
for problems that predate your change. No workarounds, no placeholders. If a warning is genuinely
non-blocking lint noise, fix the config rather than the symptom.

For the full verification checklist and the per-project artefacts these rules expect, read
`references/checklists.md`.

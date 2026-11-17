---
name: aoneahsan-cccs-javascript
description: 'Modern JavaScript: ES modules, async and error handling, immutability, the platform APIs to prefer over dependencies, and the client-side-first constraint that keeps features on the free tier. Use when writing plain JavaScript, choosing a browser API over an npm package, or reviewing JS that predates current standards.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# JavaScript

TypeScript is the default for application code (`aoneahsan-cccs-typescript`). This skill covers the language
itself and the decisions that apply whether or not types are involved.

## Prefer the platform

Before adding a dependency, check whether the platform already does it. The owner's rule is not
"reinvent the wheel" — it is "don't install a wheel that ships with the car."

| Need | Platform API |
|---|---|
| HTTP | `fetch` + `AbortController` |
| URLs and query strings | `URL`, `URLSearchParams` |
| Dates | `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat` |
| Formatting numbers, currency, lists | `Intl.NumberFormat`, `Intl.ListFormat` |
| Structured cloning | `structuredClone()` |
| Unique ids | `crypto.randomUUID()` |
| Hashing, random bytes | `crypto.subtle`, `crypto.getRandomValues()` |
| Grouping | `Object.groupBy` / `Map.groupBy` |
| Observing layout / visibility | `ResizeObserver`, `IntersectionObserver` |

A date library, a UUID package and a deep-clone helper are three dependencies most projects no longer need.

## Async

- **`async`/`await` over raw `.then()` chains.** Reserve `.then()` for a single fire-and-forget tail.
- **Parallelise independent work** — `Promise.all` for all-or-nothing, `Promise.allSettled` when partial
  success is acceptable. Sequential `await`s in a loop over independent items is the most common avoidable
  slowdown.
- **Every fetch gets a timeout or an abort path.** A request with no ceiling hangs the UI state that depends
  on it.
- **Fire-and-forget must be explicit:** `void send(...)` with a `.catch()` inside, so a background failure can
  never reject unhandled or break the user's flow.

## Errors

- **Throw `Error` objects, never strings** — a string has no stack.
- **Catch where you can act.** A `catch` that logs and rethrows unchanged is noise; a `catch` that swallows is
  a bug. Add context (`cause`) or let it propagate.
- **Narrow before using an error.** In a `catch`, the binding is `unknown`.
- Errors reach the user as something they can act on, and reach the logger with detail. Those are different
  messages.

## Immutability and equality

- Prefer non-mutating operations — spread, `map`/`filter`/`reduce`, `toSorted`/`toReversed`/`with`. Mutating a
  value someone else holds is the root of most "why did this re-render" and "why did the store change"
  questions.
- `===` always. `==` only in the single idiom `x == null` (both `null` and `undefined`).
- Use `??` and `?.` rather than `||` when `0`, `''` or `false` are legitimate values — `||` swallows them.

## Client-side first

Features are built to run in the browser wherever possible: no server, no paid tier, no usage billing. Heavy
work goes to a Web Worker rather than a backend. When something genuinely cannot run client-side, see
`aoneahsan-cccs-nodejs` for the allowed backend shapes — and never introduce a paid service.

For module, iteration and performance detail, read `references/patterns.md`.

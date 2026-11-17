# Overview — `aoneahsan-cccs-javascript`

## Purpose

The language-level baseline underneath every JS and TS project: what to use from the platform before reaching
for a dependency, how async and errors are handled, and the client-side-first constraint that keeps features
on the free tier.

## What this skill does

- Lists the **platform APIs that replace common dependencies** — `fetch`, `URL`/`URLSearchParams`, `Intl`,
  `structuredClone`, `crypto.randomUUID`, `Object.groupBy`, the observers — so a project does not carry a date
  library, a UUID package and a clone helper it does not need.
- Sets async practice: `async`/`await` over chains, parallelising independent work, a timeout or abort path on
  every fetch, and explicit `void`-with-internal-catch for fire-and-forget.
- Sets error practice: throw `Error` objects, catch only where you can act, narrow the `unknown` binding, and
  keep the user-facing message distinct from the logged detail.
- Prefers immutable operations and the modern non-mutating array methods, and gives the `===` / `??` / `?.`
  rules including why `||` is the wrong default.
- Carries the **client-side-first** constraint and points at the backend skill for the cases that genuinely
  cannot be.

## When it gets invoked

- Writing or reviewing plain JavaScript, or JS-shaped decisions inside TypeScript.
- Choosing between a browser API and an npm package.
- Handling asynchronous work, or designing error handling for a flow.
- Reviewing older code against current standards.
- Deciding whether a feature needs a server at all.

## Where it applies

Every JS/TS surface — web apps, extensions, Node scripts, build tooling.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-029 logging, R-041 pragmatism) and
`_source-understanding/files/prompt-logs.md` (no CDN scripts, best free open-source packages, the zero-cost
constraint).

## Related skills

`aoneahsan-cccs-typescript` (types on top of this) · `aoneahsan-cccs-coding-standards` (logging, secrets,
dead code) · `aoneahsan-cccs-nodejs` (server-side) · `aoneahsan-cccs-react-performance` (bundle cost of the
dependencies avoided here).

## Maintenance

Stable. Revisit as platform APIs reach baseline availability and displace more dependencies.

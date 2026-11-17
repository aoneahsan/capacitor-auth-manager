# Verification checklists

## Pre-commit gate

```bash
yarn typecheck && yarn lint && yarn build     # adapt to the project's real commands
```

Zero errors **and** zero warnings, including problems that predate your change.

## Grep verifications

```bash
# no direct console.* outside the logger
grep -rEn "\bconsole\.(log|info|debug|trace|warn|error|table|time|timeEnd|group|groupEnd)\(" src \
  --include="*.ts" --include="*.tsx" | grep -v "src/utils/logger.ts"

# no TODO/placeholder leftovers
grep -rn "TODO\|FIXME\|coming soon" src --include="*.ts" --include="*.tsx"

# no hardcoded OAuth client ids (adapt the pattern per provider)
grep -rEn "apps\.googleusercontent\.com" src --include="*.ts"

# no CDN-loaded scripts
grep -rEn "https?://(cdn|unpkg|jsdelivr)" src public
```

All should return nothing.

## Per-project artefacts these rules expect

| Artefact | Fixed path | Rule |
|---|---|---|
| Logger | `src/utils/logger.ts` (or the stack equivalent) | one module, default level `warn` |
| Env contract | `.env.example` | every key tagged + one-line reason |
| Error-handling coverage | `docs/error-handling-tracking.md` | every component/page listed |
| Analytics coverage | `docs/analytics-tracking.md` | every action + which events fire |

## The unused-code exceptions

Underscore-prefixing is acceptable in exactly three places:

```ts
onClick: (_event, index) => {}   // required interface parameter
const [, , third] = arr;         // destructuring position
catch (_error) {}                // intentionally unused catch binding
```

Everywhere else: delete.

## Response-time budget

Slow features are a correctness problem, not a polish problem. Cache models and heavy assets; a user-facing
operation that takes 40–60 seconds needs redesign, not a spinner.

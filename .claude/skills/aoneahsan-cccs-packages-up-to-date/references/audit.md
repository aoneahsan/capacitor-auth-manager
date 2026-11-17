# Dependency audit procedure

## Full sweep for one project

```bash
# 1. what is outdated
npx -y npm-check-updates

# 2. check every proposed major against the ledger BEFORE applying
#    ~/.claude/rules/package-version-known-issues.md

# 3. apply, reconcile, verify
npx -y npm-check-updates -u
yarn install
yarn typecheck && yarn lint && yarn build

# 4. stray lockfiles
ls package-lock.json pnpm-lock.yaml 2>/dev/null   # both must be absent

# 5. banned packages
grep -rE "@capacitor-firebase/(crashlytics|performance)" --include="package.json" .   # zero matches
```

## Finding genuinely unused packages

```bash
# per candidate, from the project root
grep -rn "from ['\"]<pkg>['\"]\|require(['\"]<pkg>['\"])" src/
```

Absence of imports is necessary but not sufficient — check whether another dependency lists it as a peer, and
whether it is referenced in config files (`vite.config.ts`, ESLint config, `capacitor.config.ts`) rather than
source. Config-only usage is real usage.

## Checking whether a tool supports a version

```bash
npm view <pkg> version                              # latest published
npm view <pkg>@latest peerDependencies              # what it demands
npm view @typescript-eslint/typescript-estree@latest peerDependencies.typescript
```

That last one is the live test for the TypeScript blocker: while it reads `<6.1.0`, TS ≥ 6.1 is unusable with
ESLint.

## `docs/PACKAGES.md` format

```markdown
# Packages — <project>

**Last updated:** YYYY-MM-DD

## Units
- `/` — the web app
- `/extension` — the browser extension (separate package.json)

## Dependencies and where they are used
| Package | Used in | Purpose |
|---|---|---|
| zustand | src/stores/* | client state |

## Intentional pins
| Package | Pinned to | Why | Re-check when |
|---|---|---|---|
| typescript | ~6.0.3 | TS7 breaks typescript-eslint + @capacitor/cli (cap sync) | typescript-estree peer allows >=7 AND cap transpiles a .ts config under TS7 |

## Removed in cleanup
| Package | Removed | Reason | Replaced by |
|---|---|---|---|
```

## Ugly version strings

Prefer clean published versions. A `patch:` protocol entry or an RC pin is acceptable **only** when no stable
compatible release exists — and then it must be documented in the pins table with the condition for removing
it. Migrate patches into the app's own config where possible (a manifest permission patch becomes a
`tools:node="remove"` entry), then delete the patch file.

## Adding and removing a dependency (moved from SKILL.md)

Before adding anything: prefer an existing solution, packages with 1M+ weekly downloads, and small bundle
size — and consider whether ten lines of your own would do. To remove: confirm no imports remain and nothing
needs it as a peer, remove it, reinstall to update the lockfile, prove the build passes, and record it.

# The full "update packages" pass — end to end

The runbook for the owner's "update packages" request: take every dependency manifest to the latest safe
version, fix every deprecation the upgrade surfaces, and prove the app still **builds and loads** before
handing off. One project at a time (never batch across projects). One commit per the git-workflow rule.

## Order (do not reorder — the ledger gates the upgrade, the gates gate the verify)

```
0. ledger check  →  1. upgrade JS  →  2. upgrade PHP  →  3. gates  →
4. deprecation sweep + fix  →  5. run-to-verify in a controlled browser  →  6. inventory + commit
```

## 0. Read the blocker ledger FIRST

`~/.claude/rules/package-version-known-issues.md`. Any target listed as blocked is pinned to its recorded safe
version, not bumped. Active: `typescript ~6.0.3` (TS7 breaks typescript-eslint + `@capacitor/cli`).

## 1. JavaScript / `package.json` (yarn projects)

```bash
npx -y npm-check-updates                       # preview what is outdated
# cross-check every proposed MAJOR against the ledger, pin the blocked ones
npx -y npm-check-updates -u                     # rewrite package.json to latest STABLE (never --target greatest)
yarn install                                    # reconcile yarn.lock
```

Run once per yarn workspace root (monorepos: each app's own root, never the meta-root). `npmMinimalAgeGate`
stays `0` so quarantine never blocks reaching true latest. Delete any `package-lock.json` / `pnpm-lock.yaml`.

## 2. PHP / `composer.json` (Laravel & other Composer projects)

Composer's `update` only moves **within** the constraints written in `composer.json` — the exact analogue of
`yarn upgrade --latest` doing nothing. To actually reach latest you must widen the constraint, then update.

```bash
composer outdated --direct                       # direct deps with a newer release ('latest' column)
# for each one worth moving to a new MAJOR, widen the constraint to the new version, e.g.:
composer require vendor/pkg:^NEW --no-update      # (require-dev: add --dev) — edits composer.json only
composer require vendor/pkg:^NEW --dev --no-update
composer update --with-all-dependencies          # resolve + write composer.lock (-W)
composer update                                   # patch/minor within-range deps
```

- **Respect `platform` / PHP version** in `composer.json` — do not pull a release that needs a newer PHP than
  the project (and prod) runs. `composer why-not vendor/pkg NEW` explains a refused bump.
- **Laravel majors move as a set** (framework + first-party packages + often a starter kit). Follow the
  official upgrade guide for the target major rather than bumping `laravel/framework` alone. Nova is licensed —
  bump it only within the owner's entitled major.
- Commit `composer.lock`. Never run `composer update` against a production database or with prod `.env`.

If the project has neither `package.json` nor `composer.json`, map the concern by analogy to its manager
(`pub`/`pubspec.yaml`, cargo, go mod) — same discipline: latest stable, honor the lockfile, verify.

## 3. Gates (one-shot, never watch/dev servers)

```bash
yarn typecheck && yarn lint && yarn build        # JS side — must be zero errors AND zero warnings
composer test 2>/dev/null; php -l <changed>       # PHP side, if the project defines it (no NEW tests)
```

A major that breaks the build is **fixed forward** — keep the new version, fix our code. Only pin back when
the *ecosystem* (a linter/CLI/transpiler) is broken by the latest, and then record a NEW entry in the global
ledger + `docs/VERSION-BLOCKERS.md`.

The fix must use the current supported API or configuration and remove the root cause. A compatibility shim,
warning suppression, forced peer override, environment switch, or other workaround is not a finished fix
when upstream has a supported path. If upstream has no supported path, keep the workaround as narrow as
possible and record all three: why it is necessary, what event/version triggers a re-check, and exactly when
or how it is removed.

## Known major migrations — fix forward with these recipes

Each recipe was proven on a real project. Apply it; never pin back.

- **`@tanstack/react-table` 8 → 9** (LifeWell `20950355`):
  - `useReactTable` + `getCoreRowModel/getSortedRowModel/getFilteredRowModel/getPaginationRowModel` become
    `useTable` plus ONE exported feature bundle. Import only what the table uses:
    ```ts
    export const dataTableFeatures = tableFeatures({ columnFilteringFeature, globalFilteringFeature,
      rowSortingFeature, rowPaginationFeature, rowSelectionFeature, columnVisibilityFeature });
    ```
  - The generics gain the feature type: `ColumnDef<Features, T, V>`, `Table<Features, T>` and
    `Row<Features, T>`. Row data must satisfy `T extends object`.
  - `VisibilityState` is renamed `ColumnVisibilityState`.
  - No legacy bridge and no stock "all features" bundle.
- **`eslint` 9 → 10 in a React project:**
  - `eslint-plugin-react` crashes on load (`react/display-name`). Replace it with
    `@eslint-react/eslint-plugin` using `eslintReact.configs['recommended-typescript']`.
  - Delete `settings.react`, the `react.configs.flat.*` spreads and `react/prop-types`.
  - Map `react/no-danger` to `@eslint-react/dom-no-dangerously-set-innerhtml` (+ `-with-children`) at `error`.
  - The preset's React-19 **advisory** rules can flood a zero-warning gate on an existing codebase. They
    include `no-forward-ref`, `no-use-context`, `no-array-index-key`, `set-state-in-effect`,
    `exhaustive-deps` (react-hooks stays the authority), `naming-convention-*`, `purity` and
    `static-components`. Convert them, or switch each off with a written reason in the config (LifeWell
    `eslint.config.js`).
  - Keep `eslint-plugin-react-hooks` and the TanStack Query plugin.
- **Tiptap 3.31+:** declare `@floating-ui/dom` directly beside `@tiptap/core` and `@tiptap/pm`. All three are
  hard peers.
- **Vitest 4 → 5, jsdom 29 → 30:** drop-in as configured on LifeWell and habitforge. Re-run the whole suite;
  never assume.
- **`strata-storage` 2 → 3:** the default web key prefix becomes `strata:`. Keys survive only where the app
  sets `adapters.<name>.prefix`, so compare the physical keys (baseline §5).
- **TanStack Router 1.171 (router-core 1.171.32):** the SSR status and redirect moved to
  `router._serverResult`, and `errorComponent` receives `ErrorComponentProps` (`error: unknown`). A reused
  router singleton hangs in tests. Details: `baseline.md` §5.
- **Vite 8.3:** fix the native-config import warning at the imports (`baseline.md` §5). A new
  `(!) chunks are larger than 500 kB` warning is split with `codeSplitting` groups, never met with a raised
  limit.
- **TanStack Router, current line:** set `NODE_ENV=production` on `tsr generate` (ledger workaround, with a
  removal condition).
- **After every upgrade in a Capacitor project:**
  - Re-check the Trapeze trio: `@trapezedev/configure`, root `apps-config.yaml` and the exact
    `sync:apps-config` script.
  - Run `yarn sync:apps-config` → `npx cap sync android`.
  - Confirm the Gradle version variables are still referenced, not replaced by literals.

Then bring the manifest to the baseline and the standard script names: `baseline.md`.

- **`react-aria-components` 1.22:** Select `selectedKey`/`onSelectionChange` become `value`/`onChange`; `Checkbox`, `Switch` and `Radio` become `CheckboxField` + `CheckboxButton` and the same pair for the others. The Field is `display: contents` and holds state and ARIA; the Button is the label and takes `className` and `data-*`. Rename any `.react-aria-Checkbox` or `.react-aria-Switch` selector, and watch `> *` rules that now land on the box-less Field. Measured with no pixel change on Trizlink (2026-11-05).
- **Zod 4:** `z.string().email()` chained with `.max()` becomes `.max(n, msg).pipe(z.email(msg))`; give `.max` the message or a default string reaches the person.
- **`execCommand('copy')`:** `@capacitor/clipboard` when `Capacitor.isPluginAvailable('Clipboard')`, so an OTA bundle on an older binary still works; `navigator.clipboard` otherwise. Android's WebView can refuse the web API, so deleting the fallback alone is not enough.
- **ESLint:** `tseslint.config()` becomes `defineConfig()` from `eslint/config`. **Rolldown:** `checks.pluginTimings` becomes `bundlerTimings`. Neither is caught by `no-deprecated`; read the config by hand.

## 4. Deprecation sweep — fix ALL of them across the whole codebase

An upgrade is not done while it still emits deprecation warnings. Surface them from every channel, then fix
the code (not silence the warning):

```bash
yarn build 2>&1 | grep -iE "deprecat|will be removed|no longer supported"   # build/bundler + transitive
yarn lint  2>&1 | grep -iE "deprecat"                                       # eslint deprecation rules
grep -rInE "@deprecated" node_modules/<changed-pkg>/dist 2>/dev/null | head # APIs the new version retired
```

🔴 **Nothing above warns about a deprecated call that still compiles.** Run `@typescript-eslint/no-deprecated` as an
error over the whole tree, and keep it on once clean: on Trizlink (2026-11-05) green gates hid 109 live uses. Then
sweep what it cannot reach and run any test that skipped. Which items wait and for how long, and what never counts as
adoption: `~/.claude/rules-detail/major-version-adoption.md`.

- **JS/TS:** replace removed/renamed APIs (framework codemods where the vendor ships one, e.g. React/Next
  codemods), update changed import paths, drop options a package no longer honors. Node runtime deprecations
  show as `DeprecationWarning` / `[DEP0xxx]` when the build or a CLI runs.
- **PHP:** run the app/tests with `error_reporting(E_ALL)` so `E_DEPRECATED` surfaces (PHP 8.x deprecations,
  nullable-param, dynamic-property, etc.); fix each at the callsite. `composer update` warns about abandoned
  packages — replace them with the suggested successor.
- Fix the **cause**, never add a blanket deprecation-suppress flag. If a deprecation genuinely cannot be
  resolved yet (upstream has no replacement), record it in `docs/PACKAGES.md` with the reason and the
  re-check condition — the same discipline as an intentional pin.

## 5. Run-to-verify — the app builds AND loads in a controlled browser

Authorized on all the owner's machines (dev-workflow.md run-to-verify amendment). Gates prove it compiles;
this proves it still *runs*. Use a **dedicated/controlled browser profile** (not the owner's everyday profile)
so cookies/extensions/state never interfere — headless is the default, but a **headed** window is fine and is
what the owner asked for here (real benefit: you watch it actually render).

```bash
# start the project's server in the BACKGROUND on its REGISTERED port (5900-5999 / SERVER_PORT), then drive it
yarn preview   # or: yarn dev  /  php artisan serve  /  serve -s build/web  — whatever this project uses
```

- Drive it with the controlled browser (superpowers-chrome `use_browser` / CDP, or the project's own harness).
  Confirm, at minimum: the app **loads with no console errors**, the primary route renders, and one real
  interaction works (sign-in via the project's test-auth hook if it has one, a nav click, a list that fetches).
- A green build with a white-screen runtime (missing env, a broken dynamic import, an ESM/CJS interop break a
  major introduced) is a FAILED upgrade — treat it as such and fix forward.
- **Always clean up:** kill the server and any spawned browser when done. Never leave a server or watcher
  running at the end of the turn. Do not write new automated tests for this — it is manual driving.

## 6. Inventory + hand off

Update `docs/PACKAGES.md` (same path every project) in the SAME commit: bumped versions of note, any new
intentional pin + reason + re-check condition, packages removed, deprecations fixed or deferred. Then hand off
to `aoneahsan-cccs-git-workflow` — one commit for the whole pass; auto-commit/push (and deploy) only within
`~/Documents/ahsan-work/code/`.

## What this pass never does

- ❌ `--target greatest`/`newest`, alpha/beta/RC (unless the owner names a pre-release package).
- ❌ Silence a deprecation instead of fixing it; suppress warnings to make a build "clean".
- ❌ Finish on an undocumented temporary workaround or compatibility shim when a supported solution exists.
- ❌ Leave a dev/preview server or watcher running; start a watch-mode test runner.
- ❌ Write new automated tests (no-automated-tests rule) — run-to-verify is manual.
- ❌ `composer update` with prod credentials, or bump a paid/licensed package outside the owner's entitlement.

## Run-to-verify after an upgrade (moved from SKILL.md)

- **Run-to-verify (authorized on all the owner's machines).** After the gates pass, start the project's server
  on its registered port in the background and drive it in a **controlled/dedicated browser profile** (headed
  is fine — the owner wants to watch it render): confirm it **loads with no console errors**, the main route
  renders, and one real interaction works. A green build with a white screen is a FAILED upgrade. Kill the
  server + browser afterwards; write no new tests.

## PHP / composer.json and other manifests (moved from SKILL.md)

`composer update` only moves **within** existing constraints (same trap as `yarn upgrade --latest`). To
reach latest: `composer require vendor/pkg:^NEW --no-update` → `composer update -W`. Honor the PHP
`platform` version, move **Laravel majors as a set** via the official guide, bump licensed packages (Nova)
only within entitlement, commit `composer.lock`, and **never `composer update` against prod**. Neither
manifest? Map by analogy (`pub`, cargo, go mod).

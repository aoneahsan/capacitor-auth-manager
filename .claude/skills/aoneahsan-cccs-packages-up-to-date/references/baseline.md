# The package baseline and the standard script contract

The **reference implementation** is LifeWell (`lifewell-project-root/lifewell/package.json`). Its latest-stable
refresh landed on 2026-09-22 in commits `20950355` + `a12890c5`. Every React, Capacitor or React + Capacitor
project is measured against this file on every update pass (owner directive 2026-09-23: *"so i will not have
to repeat this again and again for all projects"*).

`package.json` is authoritative for exact versions. This file names **which** packages, **why**, and the
traps. Versions below are the lines current on 2026-09-23. `npx -y npm-check-updates` decides the real latest.

## 1. Toolchain files — every JS project

| File / field | Value | Why |
|---|---|---|
| `.nvmrc` | `24.13.0` (current LTS line) | Node 26 disables `localStorage` and breaks jsdom tests (ledger) |
| `engines.node` | `>=22` or the `.nvmrc` line | Makes the floor visible to tools |
| `packageManager` | `yarn@4.x` | Corepack pins the Yarn that wrote `yarn.lock`. Only `yarn.lock` may exist |
| `.yarnrc.yml` | `nodeLinker: node-modules` + `npmMinimalAgeGate: 0` | Capacitor and Gradle need real `node_modules`. The gate at 0 lets `ncu` reach true latest |
| `.prettierrc` | `semi`, `singleQuote`, `trailingComma: es5`, `printWidth: 100`, `endOfLine: lf` | One format fleet-wide |
| `.husky/pre-commit` (`yarn lint-staged --no-stash --relative --max-arg-length 8000`) + `.lintstagedrc.json` | `eslint --fix` + `prettier --write` on staged `src/**/*.{ts,tsx}`, and `prettier --write` on `*.{json,md,css}` | Keeps the lint gate green commit by commit. `husky` and `lint-staged` are declared as devDependencies whenever the hook exists. 🔴 Under Yarn 4, `husky` runs from `postinstall`, never `prepare` (§5) |

## 2. Runtime dependencies — use what the product needs, from this set

| Concern | Package(s) | Notes |
|---|---|---|
| Framework | `react`, `react-dom` 19 | `@types/react` and `@types/react-dom` move in lockstep |
| Routing | `@tanstack/react-router` + dev `@tanstack/router-plugin`, `@tanstack/router-cli` | Route generation needs `NODE_ENV=production` (see §5) |
| Server data | `@tanstack/react-query` + dev `@tanstack/eslint-plugin-query` | Plugin version = query version |
| Tables | `@tanstack/react-table` **9** + `@tanstack/react-virtual` | v9 is feature-based. Migration: `update-workflow.md` → Known major migrations |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` 4 | |
| Client state | `zustand` 5 | |
| Storage | `strata-storage` 3 | The ONLY thing that touches web storage (`aoneahsan-cccs-strata-storage`) |
| UI primitives | `react-aria-components` + dev `tailwindcss-react-aria-components` | |
| Styling | dev `tailwindcss` 4 + `@tailwindcss/vite`, plus `class-variance-authority` + `tailwind-merge` | |
| i18n | `i18next` + `react-i18next` | Mechanism ships even while English is the only locale |
| Errors | `@sentry/react` | Gated on its DSN env var |
| Backend | `@supabase/supabase-js`, `drizzle-orm` + `postgres`, dev `drizzle-kit` | Drizzle stays on the ledger's stable line |
| Charts | `d3-array`, `d3-scale`, `d3-shape` (+ `@types/d3-*`) | Import the d3 modules you use, never the `d3` umbrella |
| Rich text | `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/core`, `@tiptap/pm`, **`@floating-ui/dom`** | `core`, `pm` and Floating UI are HARD peers. Declare them, or the install warns and a later resolution breaks |
| Markdown | `react-markdown` + `remark-gfm` | Only where content is Markdown |

**Capacitor projects add:**
- `@capacitor/core`, `@capacitor/cli` and `@capacitor/android`, all on one version.
- Only the official plugins actually used (every plugin can inject a permission).
- `native-update` with its required peers `@capacitor/filesystem` + `@capacitor/preferences`. These are
  peers, not app storage.
- `onesignal-cordova-plugin` (receive-only push).
- `@codetrix-studio/capacitor-google-auth` (native Google sign-in; ledger entry).
- 🔴 **`@trapezedev/configure`, always.**
- Full plugin baseline: `aoneahsan-cccs-capacitor-packages-setup`.

## 3. Dev dependencies — the gate stack

| Concern | Package(s) |
|---|---|
| Build | `vite` 8 + `@vitejs/plugin-react` |
| Types | `typescript` **`~6.0.3`** (ledger pin: TS7 breaks typescript-eslint and the Capacitor CLI), `@types/node` |
| Lint | `eslint` **10** + `typescript-eslint` + **`@eslint-react/eslint-plugin`** (`recommended-typescript`) + `eslint-plugin-react-hooks` + `globals` |
| Format | `prettier` |
| Tests | `vitest` 5 + `jsdom` + `@testing-library/dom` + `@testing-library/jest-dom` (`dom` is a hard peer of `jest-dom`) |
| TS scripts | `tsx` |
| Capacitor config | `@trapezedev/configure` + root `apps-config.yaml` |

🔴 **Banned:**
- `@eslint/js` (broken versioning).
- `eslint-plugin-react` (crashes under ESLint 10; replaced by `@eslint-react`).
- `@capacitor-firebase/crashlytics` and `@capacitor-firebase/performance`.
- Jest.
- `pnpm` and npm lockfiles.

## 4. The standard script contract — exact names

Every project uses these names **exactly**, so an agent or the owner can type the same command in any repo.
Include a script only when its concern exists. When a project already has a script with a variant name
(`type-check`, `mobile:sync`, `gate`, `check-all`, `config:apply`, `cap:android`), **rename it to the standard
name** and update every reference in the same commit. That means docs, `.github/` workflows, husky and
lint-staged, the CLAUDE/AGENTS pair and the kit-root records. Never keep two names for one command.

### Every web project

| Script | Command | Notes |
|---|---|---|
| `dev` | `vite` | Never started by an agent unless verification needs it |
| `build` | `[NODE_ENV=production tsr generate &&] tsc -b && vite build --logLevel info [&& <postbuild>]` | Vite 8: `--logLevel info` keeps the gzip table visible. `tsc -b` for project-references tsconfigs |
| `preview` | `vite preview` | On the project's registered port (`~/.dev-ports.json`, 5900–5999) |
| `typecheck` | `[NODE_ENV=production tsr generate &&] tsc -b` | `tsc --noEmit` only for a single-config project |
| `typecheck:clean` | `tsc -b --force` | 🔴 Run after every dependency update. Plain `tsc -b` skips a package-only change |
| `lint` | `eslint . --max-warnings 0` | A zero-warning gate |
| `lint:fix` | `eslint . --fix` | |
| `format` | `prettier --write .` | |
| `format:check` | `prettier --check .` | |
| `test` | `vitest run` | 🔴 Never watch mode. A bare `vitest` is `test:watch` |
| `test:watch` | `vitest` | The owner's use only |
| `gates` | `yarn typecheck && yarn lint && yarn build && yarn test` | The one-shot "is it green" command. 🔴 **Build BEFORE test**: first-load, hydration and prerender tests read `dist/` and would otherwise judge the previous build (trizlink, clearhire, portfolio, labflow). Project `verify:*` gates may sit between build and test |
| `deps:outdated` | `npx -y npm-check-updates` | Read-only preview |
| `deps:update` | `npx -y npm-check-updates -u && yarn install` | 🔴 Only after reading the blocker ledger. Then `typecheck:clean`, `lint`, `test` and `build` |

### TanStack Router

`routes:generate` → `NODE_ENV=production tsr generate`

### Capacitor

| Script | Command | Notes |
|---|---|---|
| `sync:apps-config` | `trapeze run apps-config.yaml` | 🔴 **Exact.** Mandatory in every Capacitor project, byte for byte, no extra flags (the Android project path defaults to `android`). It **prompts** `Apply? (y/N)` and a non-TTY run applies nothing, so an agent runs `yarn sync:apps-config -y` |
| `cap:sync` | `cap sync android` | `sync`, never `copy`, after any plugin change |
| `cap:open:android` | `cap open android` | |
| `android:build:debug` | `cd android && ./gradlew assembleDebug` | Agent-runnable when RAM allows |
| `android:bundle:release` | `cd android && ./gradlew bundleRelease` | Unsigned output only. Signing and upload stay owner-only |

Keep an existing `cap:run:android` for the owner, but agents never run `cap run`. A project with an atomic
version command keeps it as `bump:android`. It must update `apps-config.yaml`, the guarded Gradle pair and
`package.json` together (LifeWell's `scripts/bump-android-version.ts`).

### Supabase + Drizzle

`db:generate` (`drizzle-kit generate`) · `db:check` (`drizzle-kit check`). Anything touching the hosted
database reads its URL from the environment and fails loudly when that variable is unset (LifeWell's
`supabase:types`/`db:pull` pattern). A URL is never passed as a flag.

🔴 **No new `.sh`, `.py` or `scripts/` files to satisfy this contract** (house rule). Every standard script
is a one-line CLI call.

## 5. Traps this baseline already paid for

- 🔴 **Yarn 4 never runs a project's own `prepare` script, so `"prepare": "husky"` never installs the
  hook.** Measured 2026-09-25 with Yarn 4.17.1 in an empty project: `postinstall` ran on the first install,
  `prepare` did not. A project with `"prepare": "husky"` has its hook only where someone once ran `husky` by
  hand; every fresh clone commits unchecked. The supported form, per husky's own Yarn 2+ note, is
  `"postinstall": "husky"`, merged with any existing command (e.g. `"postinstall": "wxt prepare && husky"`).
  Yarn skips an unchanged project's `postinstall` on a repeat install, so an existing checkout runs
  `yarn postinstall` once. Verify with `git config core.hooksPath` → `.husky/_`. A project published to
  npm also needs `pinst` so that consumers do not run it.
- 🔴 **On Windows, lint-staged 17 fails a large commit with "The command line is too long".** It splits long
  file lists only when `--max-arg-length` is set, and that option defaults to 0. Windows caps a command line
  at 8,191 characters, so a 91-file commit failed on 2026-09-25. With the `--no-stash` rule below, the full
  hook line is therefore `yarn lint-staged --no-stash --relative --max-arg-length 8000`. The two added flags
  give shorter paths and a split under the cap, and are harmless on macOS and Linux.
- 🔴 **lint-staged backs up through `git stash` by default** (`git stash create` + `store`, dropped after), on the one
  stash stack every checkout and session shares - which the house rule bans for any subcommand and any reason.
  Seen on windowsweep 2026-09-25 (`Done backing up original state (<sha>)` in a commit's hook output). The hook
  runs **`yarn lint-staged --no-stash`**. It gives up only the backup stash and, with it, the undo when a task fails:
  lint-staged 17 still hides a partially staged file's unstaged changes through a patch file of its own, stash or not
  (`lib/gitWorkflow.js`, `prepare`; read in 17.5.1 on 2026-09-25, correcting this line's first wording).
- 🔴 **`deps:update` rejects every ledger-pinned package** (`npx -y npm-check-updates -u --reject typescript && yarn install`
  while TypeScript 7 is blocked). `ncu -u` moves a package past its own tilde range, so a plain `deps:update` breaks the
  ledger's pin the first time anyone runs it. Record the pin and its re-enable condition in `docs/PACKAGES.md`.
- **A repository whose ROOT is a published npm package and which holds an app in a subfolder** (windowsweep: the
  CLI at the root, the Tauri app in `desktop/`): husky goes in the SUB-APP's `package.json`,
  `"postinstall": "cd .. && husky desktop/.husky"`, with the hook
  `cd desktop && yarn lint-staged --no-stash --relative --max-arg-length 8000` (the full line above; `--relative` is
  then relative to `desktop/`, where the config lives). The root `package.json` ships to every consumer, so a root
  `postinstall` would run on their installs; this form needs no `pinst`, and a commit that stages no `desktop/` file
  is a no-op.

- **The TanStack Router circular-require warning.** `tsr generate` prints a `_replaceRouteChunk`
  circular-require warning under a development `NODE_ENV`, and `NODE_ENV=production` skips that HMR branch.
  This is a recorded workaround with a removal condition (ledger).
- **Trapeze and guarded Gradle variables.** Trapeze's stock `versionName`/`versionCode` keys overwrite
  guarded Gradle variables with literals. Target the `ext { appVersionCode / appVersionName }` block instead:

  ```yaml
  platforms:
    android:
      gradle:
        - file: app/build.gradle
          target: { ext: {} }
          replace:
            appVersionCode: $VERSION_CODE
            appVersionName: '"$VERSION_NAME"'
  ```

  With iOS removed, the YAML is Android-only.
- **Trapeze on Gradle.** Where `defaultConfig` holds plain literals, use the stock `versionName`/`versionCode`
  keys (trizlink, labflow, portfolio, habitforge). Prove the YAML writes by planting env overrides
  (`VERSION_NAME=9.99.0 VERSION_CODE=99 npx trapeze run apps-config.yaml -y`), then restore. Trapeze
  **drops an inline comment** on a line it rewrites, so keep comments on their own line; otherwise every run
  is a diff. Check that `packageName` equals the published applicationId before the first run, because
  Trapeze rewrites it. The YAML is Android-only; delete any `ios:` block.
- **TanStack Router 1.171.** `router.state.statusCode` and `router.state.redirect` are gone, at runtime and
  not only as types. A prerender that checked `statusCode !== 200` would silently render nothing. Read
  `router._serverResult` (`{type:'render',status}` or `{type:'redirect',redirect}`), which is what TanStack's
  own SSR handler reads, and refuse when it is absent. `errorComponent` props are now `ErrorComponentProps`
  with `error: unknown`, so narrow before reading `.name`. A test that reuses one module-level router
  across pages hangs on its second `load()`: give each case `vi.resetModules()` plus a fresh import, the
  same way a browser page load gets a fresh module graph.
- **Vite 8.3's native-config warning.** Vite 8.3 prints *"Your Vite config uses features that are
  unsupported by `configLoader: 'native'`"* for every module in `vite.config.ts`'s import graph that
  imports without an extension, through a directory index, or JSON without attributes. Fix the imports:
  - add `.ts` / `/index.ts`
  - add `with { type: 'json' }`
  - add `allowImportingTsExtensions` in the no-emit tsconfigs

  Never set `VITE_CONFIG_NATIVE_IGNORE_WARNING`.
- **Chunk size is split, never raised.** A `chunkSizeWarningLimit` above 500 is a silenced warning; delete
  it. Tiptap 3.31 made the lazy editor chunk about 525 kB. Split it with Rolldown
  `build.rolldownOptions.output.codeSplitting.groups`: `tiptap` plus `prosemirror`
  (`prosemirror-|@floating-ui|orderedmap|rope-sequence|w3c-keyname|linkifyjs`, `priority: 1`).
  🔴 Put `use-sync-external-store` in the `react` group (`priority: 2`). Left ungrouped, it is captured by
  `tiptap` and drags the whole editor into first load, because TanStack shares it. Re-run the
  first-load budget after every grouping change.
- **Amplitude.** Its destination plugin registers asynchronously, and an event applied before that is dropped
  with *"Event not tracked, no destination plugins on the instance"*. Keep `init(...).promise` and make
  `track` wait for it. A call made before `init` is invoked still uses the SDK's own pre-init queue.
- **The Google Auth RC peer notice.** `@codetrix-studio/capacitor-google-auth`'s published `latest` is an RC
  whose peer still names an old Capacitor. The notice stays **visible**, never muted by `resolutions` or
  `packageExtensions`.
- **`eslint-plugin-jsx-a11y` peer lag.** Its 6.10.2 is still the newest release and peers only up to
  `^9`, yet it runs under ESLint 10. It is accepted and visible, and is not a reason to pin ESLint.
- **strata-storage 3's default prefix.** The documented one-line opt-out is `keyPrefix: false` (clearhire, trizlink), and it is required wherever anything outside the library reads a physical key by name, such as a pre-paint theme script. Where nothing does, keep the default: `migrateLegacyKeys` adopts the pre-3.0 keys on read (labflow). A test fixture that writes a raw key must use the full envelope `{ value, created, updated }`, because 2.9+ ignores `{ value }` alone. Original note: Its default web key prefix is now `strata:`. `adapters.<name>.prefix` wins
  over `keyPrefix`, so a project that sets it keeps its physical keys. A project that does not set it must
  compare its key names before and after the upgrade and pin its old prefix explicitly, or every stored value
  (theme, session) looks lost. Proven on habitforge, 2026-09-17.

**Last updated:** 2026-09-25 (--no-stash costs only the backup and the undo, read in lint-staged's source; deps:update rejects ledger pins. Earlier the same day: lint-staged runs with `--no-stash`; husky in a sub-app of a published package - windowsweep. Earlier the same day: Yarn 4 never runs `prepare`: husky installs from `postinstall`). Earlier 2026-09-23, refined the same day by the five-project rollout (clearhire, trizlink, aoneahsan-portfolio, habitforge and labflow); fleet tracker `~/Documents/ahsan-work/code/docs/tracking/package-baseline-rollout-2026-09-23-tracker.json`

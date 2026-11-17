---
name: aoneahsan-cccs-packages-up-to-date
description: 'Dependency management, the "update packages" pass, and npm release publishing: the nvm/npm/yarn hierarchy, npm-check-updates to latest stable, the known-blocker ledger overriding "latest", deprecation sweeps, docs/PACKAGES.md, publishing behind a content-regression and secret gate, and deprecating a bad release. Use when adding, removing or upgrading a dependency, on "update packages", when a build breaks after an update, whenever npm-package work is finished, or when a release turns out bad.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Keeping packages current

When the owner says **"update packages"**, run the whole pass end to end: every manifest to the latest safe
version, every deprecation fixed across the codebase, then prove it **builds AND loads**. Full ordered
runbook: `references/update-workflow.md`; the standards below are what each step must honor.

## The tool hierarchy — three tiers, never mixed

| Tier | Tool | Scope |
|---|---|---|
| 1 | **`nvm`** | install/update Node **and the npm it bundles** (`nvm install --lts`). Never `npm install -g npm`. |
| 2 | **`npm`** | **all** global installs — including installing `yarn` itself |
| 3 | **`yarn`** | **all** local project dependencies |

**`pnpm` is retired** — only `yarn.lock` may exist; delete `package-lock.json` and `pnpm-lock.yaml`.

## 🔴 The baseline and the script contract

Every update pass also brings the project to `references/baseline.md`: the common package set (LifeWell is the
reference) and the **exact standard script names**. A variant name is renamed, and every reference to it is
updated in the same commit. Proven major-version recipes are in `update-workflow.md` → Known major
migrations.

## Upgrading JS: latest stable, always

```bash
npx -y npm-check-updates -u    # rewrites package.json to latest STABLE
yarn install
yarn typecheck && yarn lint && yarn build
```

`yarn upgrade --latest` is **not** equivalent — it only moves within existing semver ranges.

🔴 **Latest stable, every project** (owner, 2026-09-18: *"we use latest stable versions"*): fix what breaks,
never pin back; pin only a ledger-listed *broken* latest. ESLint 10 is fleet-wide. **After any update,
`tsc -b --force`** — plain `tsc -b` passes a package-only change unseen.

🔴 **Durable fixes only** (owner, 2026-09-22): resolve upgrade fallout with the package's current supported
API/configuration and fix the root cause. Do not finish on a compatibility shim, warning suppression, or
"fix for now". When upstream genuinely has no supported solution, the narrow workaround must be documented
with its reason, re-check trigger, and removal condition or removal steps in `docs/VERSION-BLOCKERS.md` or
`docs/PACKAGES.md`.

- **Stable only** — never `--target greatest`/`newest` (alpha/beta/RC). Run **in each project's own root**,
  once per yarn workspace, never a meta-root. **Keep the new versions and fix the fallout** ("we stay on
  updated versions") rather than reverting. **Yarn quarantine stays off** — `npmMinimalAgeGate: 0` in the home
  and project `.yarnrc.yml`, or Yarn 4.10+ quarantines just-published versions and blocks `ncu` from true latest.

## PHP / `composer.json`

`composer update` only moves within constraints; **never `composer update` against prod**. Read
`references/update-workflow.md` → *PHP / composer.json and other manifests* before upgrading a PHP, pub,
cargo or go manifest.

## After upgrading: kill deprecations, then prove it runs

- 🔴 **A major is adopted across the whole codebase in the same pass, never worked around:**
  `~/.claude/rules-detail/major-version-adoption.md`.
- **Fix every deprecation the upgrade surfaces, across the whole codebase** — from `yarn build` / `yarn lint`
  output, `@typescript-eslint/no-deprecated`, Node `DeprecationWarning`s, and PHP `E_DEPRECATED`. Fix the callsite
  (vendor codemods where they exist); never a blanket suppress. Only a case with no supported path at all is
  recorded in `docs/PACKAGES.md` with its re-check condition, like a pin.
- **Run-to-verify:** after the gates pass, load the app in a controlled browser — a green build with a white
  screen is a FAILED upgrade. Read `references/update-workflow.md` → *Run-to-verify after an upgrade* for the
  exact procedure.

## 🔴 Check the blocker ledger FIRST

Some packages' *latest stable* is broken by the **ecosystem**, not by our code. Before any upgrade, read
`~/.claude/rules/package-version-known-issues.md`. If the target is listed, **pin to the recorded safe
version** and keep the pin until its stated re-enable condition is met.

**Active blocker:** `typescript` 7.0.x → pin **`typescript ~6.0.3`**. Read `references/active-blockers.md`
before touching TypeScript, tsconfig paths, or recording a new ecosystem blocker.

## Removing what is not used

Read `references/audit.md` → *Adding and removing a dependency* before adding or removing a package.

🔴 **Capacitor exception:** `@trapezedev/configure` is mandatory configuration tooling even when it has no
application imports. Every Capacitor project retains it, root `apps-config.yaml`, and the exact script
`"sync:apps-config": "trapeze run apps-config.yaml"`; never classify any of the three as unused or redundant.

**Banned outright** unless the owner names them: `@capacitor-firebase/crashlytics` and
`@capacitor-firebase/performance` (Gradle plugin + console wiring, noisy runtime errors). Use Sentry for
errors, native APIs or Amplitude for performance.

## Publishing to npm — automatic, behind a gate

**Finish work on an npm package → publish it, without asking** (owner directive 2026-07-25). Only a
brand-new package's *first* publish still asks; majors publish but must be reported as majors.

Every gate step is a hard stop: clean pushed tree · green typecheck/lint/build · version above the registry ·
**content-regression diff against the published latest** · tarball secret sweep · smoke-install of every
declared entry point · verify from the registry afterwards.

A release later **found** broken gets **deprecated** — exact version only, never `npm unpublish`. Read
`references/publishing.md` before any publish or deprecation.

## The inventory

Every project keeps **`docs/PACKAGES.md`** (same path everywhere): each manifest unit, what every dependency
is for, intentional pins + reasons, and what was removed. Update it in the same commit as any add/remove/upgrade.

Runbooks: `references/update-workflow.md` (the update pass) · `references/audit.md` (audit + pin format) ·
`references/publishing.md` (the publish gate).

## Related skills

Dependencies and the release live here. The package *as a product* lives in
`aoneahsan-cccs-npm-package` (metadata, exports, build, tarball, docs ladder) and
`aoneahsan-cccs-npm-package-readme` (the shared README pattern). **A README ships inside the tarball**, so
it is release content — bring it to the pattern before the gate runs.

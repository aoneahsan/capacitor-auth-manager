# Overview — `aoneahsan-cccs-packages-up-to-date`

## Purpose

Keeps every project on current, stable dependencies without letting an ecosystem-broken "latest" take the
toolchain down, and runs the owner's full **"update packages" pass** end to end — every manifest
(`package.json` + `composer.json`) to latest safe, every deprecation fixed across the codebase, then a
build-and-load verification in a controlled browser. The owner's standing position is that projects stay up
to date as a matter of course, and that the only acceptable exception is a major release that breaks an
essential, unreplaceable tool.

## What this skill does

- Fixes the three-tier tool hierarchy — `nvm` for Node and npm, `npm` for all global installs including yarn,
  `yarn` for all local dependencies — and records that pnpm is retired with the reason.
- Gives the upgrade procedure (`npm-check-updates -u`, then install, then gates) and explains why
  `yarn upgrade --latest` does not do the same job.
- Requires the **known-blocker ledger** to be consulted *before* any upgrade, and carries the current active
  blocker: TypeScript 7 breaks both typescript-eslint and the Capacitor CLI, so projects pin `~6.0.3`.
- Sets the keep-the-upgrade-and-fix-the-fallout stance rather than reverting on breakage.
- Requires Yarn's `npmMinimalAgeGate` to stay at `0` so the quarantine never blocks reaching true latest.
- Defines the pre-add evaluation, the safe removal sequence, the two banned Capacitor Firebase packages, and
  the `docs/PACKAGES.md` inventory that every project maintains at the same path.
- Carries the **PHP / `composer.json`** half by analogy: `composer update` only moves within existing
  constraints, so reaching latest means widening the constraint then updating, honoring the PHP platform
  version and moving Laravel majors as a set — never against prod.
- Requires a **deprecation sweep** after any upgrade: every deprecation surfaced by the build, the linter,
  Node, or PHP `E_DEPRECATED` is fixed at the callsite (or recorded like a pin), never blanket-suppressed.
- Ends the pass with **run-to-verify**: after the gates, the app is started on its registered port and driven
  in a controlled browser profile to confirm it loads with no console errors and one real interaction works —
  a green build with a white screen is a failed upgrade. Full ordered runbook: `references/update-workflow.md`.
- Carries the **npm publish authorization** (owner directive 2026-07-25): finishing work on an npm package
  publishes it, without asking — only a brand-new package's *first* publish still asks, and majors publish but
  are reported as majors. The authorization is paired with a seven-step gate whose every step is a hard stop,
  including a **content-regression diff against the published latest** and a tarball secret sweep. That diff
  exists because `strata-storage@2.8.2` passed typecheck, lint, build and install while silently dropping the
  required `npx cap sync` documentation, and sat as `latest` for 25 days. Full gate: `references/publishing.md`.
- Carries the other half of that story: **a released version later found broken gets deprecated**, also
  automatically. The gate protects releases going out; deprecation is the only thing that reaches people
  already installing a bad one. Constrained hard — the exact version only (no version, or a range, sweeps up
  good releases), only after the fix is published and verified, a message stating fault *and* remedy, and
  **never `npm unpublish`**, which breaks every existing dependent. It is reversible, which is what makes
  acting on reasonable suspicion correct.

## When it gets invoked

- The owner says **"update packages"** / "update dependencies to latest" — the full end-to-end pass.
- Adding, removing or upgrading any dependency (JS `package.json` or PHP `composer.json`).
- A build, lint or typecheck breaks — or a deprecation warning appears — after a dependency update.
- Auditing an unfamiliar or inherited project.
- Before a release, or as part of a project-finalisation pass.
- **Work on an npm package is finished** — the package gets published, automatically.
- A release is being cut, or someone asks whether something should be published.
- **A published release turns out to be bad** — it gets deprecated so consumers are warned.
- Someone proposes "update everything to latest".

## Where it applies

Every project with a package manifest. The concern maps by analogy to non-JS stacks (`pub`/`pubspec.yaml`,
Composer, cargo, go mod) — the tool names change, the discipline does not.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-003, R-010) and
`_source-understanding/files/prompt-logs.md` (stay-on-latest with the TS6 exception, keep-and-fix after bulk
upgrades, the ncu tooling list).

## Related skills

`aoneahsan-cccs-typescript` (why the TS6 pin exists) · `aoneahsan-cccs-capacitor` (the `cap sync` half of that
blocker) · `aoneahsan-cccs-coding-standards` (the gates an upgrade must still pass) ·
`aoneahsan-cccs-laravel` (the Composer/PHP side) · `aoneahsan-cccs-git-workflow` (the one commit the pass ends
with) · `aoneahsan-cccs-documentation` (where `docs/PACKAGES.md` sits).

## Maintenance

**Volatile.** The active-blocker list changes as the ecosystem moves. This skill points at
`~/.claude/rules/package-version-known-issues.md` rather than duplicating it — verify against that file
whenever the TS7 situation is revisited.

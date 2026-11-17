# Overview — `aoneahsan-cccs-capacitor`

## Purpose

The general Capacitor skill: adding the native shell to a React project and operating it day to day. Its
centre of gravity is the environment-loading trap, because that failure is silent — the build succeeds, the
app installs, and a feature is simply dead on device.

## What this skill does

- Establishes that **every React web project gets Capacitor**, and connects that to why mobile-first
  responsiveness is non-negotiable.
- Documents the **`capacitor.config.ts` env trap** in full: why `process.env` is empty and `import.meta.env`
  absent during `cap sync`, the dependency-free `process.loadEnvFile` fix, and the two traps inside the fix
  (first-wins ordering, `ENOENT` on a missing file).
- Requires verifying the **generated** `capacitor.config.json` rather than the source, because the config file
  is typically outside both `tsconfig.include` and the lint ignores — so neither gate catches it.
- Requires failing loudly on a missing required value, converting a silent broken release into a build error.
- Carries the **TypeScript 6 pin** as it applies to `cap sync`.
- Requires the `appId` to be annotated as permanent, and gives the domain-reversal convention.
- Requires platform branching **at the call site** rather than inside a helper with a silent fallback.
- States the **single-inset-owner** rule for safe areas.

## When it gets invoked

- Adding Capacitor to a project, or scaffolding a new one.
- Editing `capacitor.config.ts`, or running `cap sync`.
- Writing code that must behave differently on web and native.
- A native build behaves differently from web, or a native feature does nothing.
- Handling status-bar or navigation-bar overlap.

## Where it applies

Every React project — all of them ship an Android app.

## Sources

`_source-understanding/projects/ztools-capacitor-android.md` (the shipped config, the env fix with its
docblock, platform branching, the edge-to-edge branch) and
`_source-understanding/files/generic-project-rules.md` (R-027, R-028, R-035, R-036).

## Related skills

`aoneahsan-cccs-capacitor-packages-setup` (the plugin set and audit) · `-android-finalization` (shipping) ·
`-typescript` (the pin) · `-nodejs` (the same env-loading problem outside a bundler) ·
`-frontend-development` (safe areas).

## Maintenance

Point at `~/.claude/rules/capacitor-plugins-and-issues.md` for the live issue register rather than restating
it — that file is where new native issues are recorded fleet-wide.

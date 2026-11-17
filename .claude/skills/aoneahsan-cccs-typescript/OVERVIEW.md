# Overview — `aoneahsan-cccs-typescript`

## Purpose

TypeScript configuration and typing practice, including the one version pin that currently governs every
project in the fleet. It exists mostly to stop a well-intentioned upgrade from silently killing linting and
Capacitor sync.

## What this skill does

- Carries the **TS6 pin** (`~6.0.3`) with both concrete reasons — typescript-eslint's parser crashes on TS7's
  removed JS API, and `@capacitor/cli` cannot transpile `capacitor.config.ts` — plus the live command that
  tests whether the block has lifted, and the note that TS 6.1+ is already outside the supported peer range.
- Prescribes the **TS7-forward-compatible tsconfig migration** (drop `baseUrl`, relative `paths`, drop
  `ignoreDeprecations`) that is safe to apply today.
- Sets the strictness stance: `strict: true` without experimental extras, `any` banned in favour of `unknown`,
  type the boundary and infer the interior, derive types rather than duplicating them, and prefer
  discriminated unions to optional-field soups.
- Requires production source maps to stay off, in every build tool.
- Gives a three-way triage for arguing with the compiler, and requires any type assertion to carry a comment
  justifying it.

## When it gets invoked

- Creating or editing a `tsconfig.json`.
- Upgrading TypeScript, or reviewing an `ncu` run that proposes it.
- Typing an API response, a form schema, or any module boundary.
- The compiler is rejecting a change and you are choosing between fixing, narrowing and asserting.
- Scaffolding a new TypeScript project.

## Where it applies

Every TypeScript project — web app, extension, Node service or library.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-041 strictness and pragmatism, source-map policy)
and `_source-understanding/files/prompt-logs.md` (the dated TS7 exception), corroborated against
`_source-understanding/projects/ztools-capacitor-android.md`, where `typescript ^6.0.3` is the shipped pin.

## Related skills

`aoneahsan-cccs-packages-up-to-date` (the blocker-ledger procedure this pin is an instance of) ·
`aoneahsan-cccs-capacitor` (the `cap sync` half of the breakage) · `aoneahsan-cccs-coding-standards` (the
ESLint stance these settings pair with) · `aoneahsan-cccs-javascript`.

## Maintenance

**Volatile.** The TS7 block is expected to lift. Re-verify with the peer-dependency command before repeating
the pin as current, and update `~/.claude/rules/package-version-known-issues.md` when it does.

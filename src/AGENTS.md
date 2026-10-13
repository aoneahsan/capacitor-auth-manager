# Capacitor Auth Manager TypeScript source

**Updated:** 2026-10-13. This guide covers `src/`; `CLAUDE.md` links here. Read the package root
`AGENTS.md`, `definitions.ts`, the target file and its closest test before editing. The next
routine context pass is eligible 2026-11-12.

Only Google authentication is enabled in 3.x. Provider registry entries and build exclusions
must agree; other web providers remain unregistered and their native counterparts are disabled.
The package returns credentials without importing Firebase. Preserve side-effect-free Node/SSR
imports, lazy `getAuth()`, dynamic provider loading and `sideEffects: false`. Keep strict types,
named exports and `.js` suffixes on relative ESM imports. Public type/API changes need matching
README, AI integration guide, docs and tarball smoke verification. Run typecheck, lint, build,
unit tests and tarball smoke; real OAuth still needs device validation.

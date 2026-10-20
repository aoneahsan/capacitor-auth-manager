# AGENTS.md — capacitor-auth-manager

**Last Updated:** 2026-10-20

Contributor + AI-assistant guide for this MIT-licensed Capacitor authentication plugin.

**Context checked:** 2026-10-13. This public `main` repository lives in the parent
`../` private coordination root beside `capacitor-auth-manager-docs/`; remote `o` pushes the
package. The parent `project-root` branch is independent and must never merge into this branch.
The next routine context pass is eligible 2026-11-12. Read the target file and only the
matching native/source/docs guide. The active fleet state is at
`/home/ahsan/Documents/01-code/docs/tracking/fleet-maintenance-tracker.json`.

## What this is

Firebase-agnostic **Google authentication** for Capacitor + web — a drop-in alternative to
`@codetrix-studio/capacitor-google-auth`. `auth.signIn(AuthProvider.GOOGLE)` returns a Google credential
`{ idToken, accessToken?, serverAuthCode?, user }` on web (Google Identity Services), iOS (GoogleSignIn) and
Android (Credential Manager); the app does its own Firebase `signInWithCredential`. Works with React, Vue,
Angular, and vanilla JS.

**Status: Google-first, on every layer.** Only Google is enabled. The other providers' web code lives in
`src/providers/web/` (un-registered, build-excluded — `AuthErrorCode.PROVIDER_NOT_ENABLED`), and their
native code lives in `android/disabled-native-providers/` + `ios/disabled-native-providers/` (not compiled,
not shipped) so the plugin pulls **no** Facebook/Microsoft SDKs. Each provider is re-enabled and verified
one at a time.

## Project shape

- `src/` — TypeScript: `core/` (auth manager, provider registry, platform), `providers/` (base + `web/` +
  `native/google-native-provider.ts`), `react/` `vue/` `angular/` adapters, `utils/`, `definitions.ts`.
- `ios/Plugin/` — Swift plugin (Google: GoogleSignIn). `android/src/main/` — Java plugin (Google: Credential
  Manager). `*/disabled-native-providers/` — kept-but-not-built native code for future providers.
- `dist/` — build output (generated; not committed). `scripts/configure.js` — the published config CLI (`bin`).

## Local development

```bash
corepack enable                 # Yarn 4.18.1 is pinned via "packageManager" (Node >= 24)
corepack yarn install --immutable
corepack yarn build             # clean + tsc + rollup → dist (ESM + CJS + browser)
corepack yarn lint              # eslint — must be 0 errors / 0 warnings
corepack yarn smoke:tarball     # packs the tarball, installs it in a scratch dir, imports it under bare Node
corepack yarn prettier          # format
```

Google/auth behavior tests run with `yarn test`. The tarball smoke test (`test/tarball-smoke.test.js`, node:test) — it guards the
Node ESM / SSR import path that no repo build exercises. Real Google auth flows are validated manually on devices:
the native code compiles in a clean Capacitor 8 app, but a green build is not a runtime test — verify Google
sign-in on a device before rolling a version out.

## Hard rules

- **TypeScript:** strict, no `any`, `export type` for type-only exports, and **every relative import carries
  its `.js` extension** — the published ESM must resolve under bare Node, not only under bundlers.
- **No import-time side effects:** the `auth` singleton is lazy (`getAuth()`), storage access is guarded;
  `sideEffects: false` has to stay true.
- **Tree-shaking:** keep `sideEffects: false`; providers load via dynamic `import()` — no eager provider imports.
- **No Firebase coupling, no secrets in code.** The package returns a credential; the app owns Firebase.
- **Logging:** use the package logger, never `console.*` directly.
- **One provider at a time, every layer:** to re-enable a provider, restore its registry loader, remove it
  from `tsconfig.build.json`'s exclude, move its native file back from `*/disabled-native-providers/`, re-add
  its native dependency, harden it, and verify the build + on device.
- **No production source maps.** Conventional-commit messages.

## Issue queue

Open defects: [`docs/REPORTED-ISSUES.md`](docs/REPORTED-ISSUES.md) — check it at session start; fixed entries
move to [`docs/RESOLVED-ISSUES.md`](docs/RESOLVED-ISSUES.md) with date and version.

## Release guidance

`AI-INTEGRATION-GUIDE.md` is the consumer integration contract. Keep it version-aligned with the independent docs site and include it in the packed artifact. Run `yarn test`, `yarn smoke:tarball`, and `yarn smoke:native android` / `ios` for release validation. Never claim a compile check verifies real OAuth sign-in.

## Links

- [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md) · [Support](./.github/SUPPORT.md)
- Docs: https://github.com/aoneahsan/capacitor-auth-manager-docs
- Author: Ahsan Mahmood — aoneahsan@gmail.com — https://aoneahsan.com

## Stop-work Git gate

<!-- RULE:stop-work-git-gate v2026-10-20 -->

Before stopping, commit every legitimate change and work-progress checkpoint in this repository and each independent nested repository, fetch and merge the designated upstream, push the documented working branch, then verify an empty worktree and `0 0` ahead/behind. Never stash, discard, reset, rebase, or force-push. If synchronization is blocked, report the exact repository, branch, blocker, and next action instead of calling the work complete. The full workflow remains authoritative in `~/.claude/rules/git-workflow.md`.

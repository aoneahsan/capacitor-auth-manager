# AGENTS.md — capacitor-auth-manager

Contributor + AI-assistant guide for this MIT-licensed Capacitor authentication plugin.

## What this is

Firebase-agnostic **Google authentication** for Capacitor + web — a drop-in alternative to
`@codetrix-studio/capacitor-google-auth`. `auth.signIn(AuthProvider.GOOGLE)` returns a Google credential
`{ idToken, accessToken?, serverAuthCode?, user }` on web (Google Identity Services), iOS (GoogleSignIn) and
Android (Credential Manager); the app does its own Firebase `signInWithCredential`. Works with React, Vue,
Angular, and vanilla JS.

**Status: Google-first.** Only Google is enabled. The other providers' code lives in the repo but is
un-registered (`AuthErrorCode.PROVIDER_NOT_ENABLED`) and excluded from the published build; each is
re-enabled and verified one at a time.

## Project shape

- `src/` — TypeScript: `core/` (auth manager, provider registry, platform), `providers/` (base + `web/` +
  `native/google-native-provider.ts`), `react/` `vue/` `angular/` adapters, `utils/`, `definitions.ts`.
- `ios/Plugin/` — Swift plugin (Google: GoogleSignIn). `android/src/main/` — Java plugin (Google: Credential Manager).
- `dist/` — build output (generated; not committed). `scripts/configure.js` — the published config CLI (`bin`).

## Local development

```bash
npm install
npm run build      # clean + tsc + rollup → dist (ESM + CJS + browser)
npm run lint       # eslint — must be 0 errors / 0 warnings
npm run prettier   # format
```

There is **no automated test suite** — auth flows are validated manually on real devices. Native code
(Swift/Java) isn't compiled in CI; verify native changes on a device.

## Hard rules

- **TypeScript:** strict, no `any`, absolute imports, `export type` for type-only exports.
- **Tree-shaking:** keep `sideEffects: false`; providers load via dynamic `import()` — no eager provider imports.
- **No Firebase coupling, no secrets in code.** The package returns a credential; the app owns Firebase.
- **Logging:** use the package logger, never `console.*` directly.
- **One provider at a time:** only Google is registered. To re-enable another, restore its registry loader,
  remove it from `tsconfig.build.json`'s exclude list, harden it, and verify on device.
- **No production source maps.** Conventional-commit messages.

## Links

- [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md) · [Support](./.github/SUPPORT.md)
- Docs: https://github.com/aoneahsan/capacitor-auth-manager-docs
- Author: Ahsan Mahmood — aoneahsan@gmail.com — https://aoneahsan.com

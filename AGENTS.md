# AGENTS.md — capacitor-auth-manager

Contributor + AI-assistant guide for this MIT-licensed Capacitor authentication plugin.

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
npm install
npm run build      # clean + tsc + rollup → dist (ESM + CJS + browser)
npm run lint       # eslint — must be 0 errors / 0 warnings
npm run prettier   # format
```

No automated test suite — auth flows are validated manually on real devices. The native code DOES compile in
a clean Capacitor 8 app (verified via `gradle assembleDebug` + `pod lib lint`), but a green build is not a
runtime test — verify Google sign-in on a device.

## Hard rules

- **TypeScript:** strict, no `any`, absolute imports, `export type` for type-only exports.
- **Tree-shaking:** keep `sideEffects: false`; providers load via dynamic `import()` — no eager provider imports.
- **No Firebase coupling, no secrets in code.** The package returns a credential; the app owns Firebase.
- **Logging:** use the package logger, never `console.*` directly.
- **One provider at a time, every layer:** to re-enable a provider, restore its registry loader, remove it
  from `tsconfig.build.json`'s exclude, move its native file back from `*/disabled-native-providers/`, re-add
  its native dependency, harden it, and verify the build + on device.
- **No production source maps.** Conventional-commit messages.

## Links

- [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md) · [Support](./.github/SUPPORT.md)
- Docs: https://github.com/aoneahsan/capacitor-auth-manager-docs
- Author: Ahsan Mahmood — aoneahsan@gmail.com — https://aoneahsan.com

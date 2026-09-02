# Changelog

All notable changes to `capacitor-auth-manager` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2026-09-03

Google sign-in hardened on every layer. Closes all five entries that `2.4.3` documented in
`docs/REPORTED-ISSUES.md` and fixes the runtime defects found while reviewing the native bridge. Native code
compiles are verified by the owner on a separate Android build machine before this version is published.

### Fixed

- **ISSUE-001 — bare Node ESM could not import the package.** Every relative specifier in `src/` now carries
  its `.js` extension (155 specifiers across 41 files), so `dist/esm` resolves under Node's ESM resolver as
  well as under bundlers. Guarded by the new tarball smoke test.
- **ISSUE-002 — importing the package threw `window is not defined`.** The `auth` singleton is created lazily
  on first use (a `Proxy` keeps `import { auth }` unchanged), and `WebStorage` falls back to in-memory storage
  when `window` is absent or the browser refuses storage access (private mode). `"sideEffects": false` is now
  true.
- **ISSUE-003 — `@capacitor/core` was declared optional but required.** It is a required peer now.
- **ISSUE-004 — `capacitor-biometric-authentication` was installed for every consumer.** Removed from
  `optionalDependencies`; it returns as an optional peer when the biometric provider is re-enabled.
- **ISSUE-005 — `engines.node` was untested and disagreed with `.nvmrc`.** The floor is now `>=24.0.0`
  (owner decision: current and latest Node only, no legacy targets) and CI builds, lints and runs the tarball
  smoke test on Node 24 and 26. Node is a build/install requirement only — the package runs in a browser or a
  webview.
- **Web One-Tap dismissed by the user hung `signIn()` forever.** A dismissed prompt now rejects with
  `USER_CANCELLED`; a suppressed prompt rejects with `POPUP_BLOCKED` (or falls back, see Added).
- **Native `getCurrentUser()` returned `{}` and the app treated it as a signed-in user.** The bridge now
  normalizes any result without a string `uid` to `null`, so a cold start with no session is "signed out"
  instead of authenticated-with-an-empty-user.
- **Android `getCurrentUser()` resolved the same plugin call twice** when no provider was active. It answers
  exactly once and remembers which provider owns the restored session.
- **Android manifest declared `READ_SMS`, `RECEIVE_SMS` and `USE_BIOMETRIC`** for providers that are disabled.
  Only `INTERNET` remains; the SMS permissions are Play-restricted and were a store-rejection risk for every
  consumer.
- Per-call sign-in options (`nonce`, `loginHint`, the new flow selectors) now reach the native side; they
  were previously dropped because the manager flattens them before calling the provider.

### Added

- **`GoogleAuthOptions.webFlow`** (`'auto' | 'one-tap' | 'popup'`, default `'auto'`): One-Tap first, then a
  Google Identity Services OAuth2 **popup fallback** whenever the browser does not display One-Tap (cooldown,
  FedCM opt-out, third-party-cookie settings). The popup returns `accessToken` plus the Google profile;
  Firebase accepts `GoogleAuthProvider.credential(idToken ?? null, accessToken)`.
- **`GoogleAuthOptions.androidFlow`** (`'auto' | 'bottom-sheet' | 'button'`, default `'auto'`): the
  Credential Manager bottom sheet first, then the explicit **Sign in with Google button flow**
  (`GetSignInWithGoogleOption`) when no authorized account is offered — that flow can add an account.
- Both selectors are also accepted per call: `auth.signIn({ provider, options: { webFlow: 'popup' } })`.
- `getAuth()` export alongside `auth` for callers who prefer an explicit accessor.
- Web `getIdToken()` and `revokeAccess()` implementations (revoke uses the OAuth2 token when present).
- **Tarball smoke test** (`yarn smoke:tarball`, `node:test`): packs the package, installs the tarball into a
  scratch directory and imports it under bare Node (ESM and CJS). Wired into `prepublishOnly`.

### Changed

- `@capacitor/core` peer: optional → required.
- Android: `androidx.credentials` 1.3.0 → 1.5.0, `security-crypto` 1.1.0-alpha06 → 1.1.0 (stable),
  AGP/compileSdk/minSdk fallbacks aligned with Capacitor 8 (8.13.0 / 36 / 24), `lintOptions` → `lint`,
  the unused direct `play-services-auth` dependency removed (still provided transitively), Facebook/MSAL
  ProGuard rules dropped.
- `packageManager: yarn@4.17.1` declared so corepack picks the right Yarn.
- Google provider manifest no longer names a non-existent `@google/gsi` npm package.

### Not changed on purpose

- iOS `GoogleSignIn ~> 7.1` stays. A major SDK bump without a compile check is not acceptable; it moves in
  a release that is verified on a Mac.

## [2.4.4] - 2026-07-25

### Fixed

- **The README stated the previous version.** The at-a-glance `Version` row is a static duplicate of
  `package.json.version`, so it drifted the moment the version was bumped — it shipped stale in eight of the
  fleet's packages at once. The row, and any native version string, now move with the release.

## [2.4.3] — 2026-07-25

**Documentation and metadata only — no runtime changes.** Brings the package to the house README
standard and, importantly, **documents two High-severity defects that have been shipping since before
this release**. They are stated plainly in the README's Limitations section rather than left for a
consumer to discover at runtime:

- **The published ESM build does not resolve under bare Node.** `moduleResolution: "bundler"` emits 133
  extensionless relative specifiers across 33 files. Bundlers resolve them; Node's ESM resolver does
  not, so SSR, Node-resolution test runners and `node --import` all fail.
- **Importing the package throws `window is not defined`.** A module-scope singleton in
  `src/core/auth-manager.ts` constructs a `WebStorage` that reads `window.localStorage` unguarded. This
  also makes `sideEffects: false` untrue.

Neither is fixed here — both need a code change and a version bump beyond a documentation patch. Every
conventional gate passes while they ship: typecheck, lint, build, the exports-map walk and even an
esbuild bundle are all green. Only installing the tarball and importing it under bare Node catches them.
Tracked in `docs/REPORTED-ISSUES.md` as ISSUE-001 and ISSUE-002.

### Changed

- README rewritten to the canonical package pattern; `Readme.md` renamed to `README.md`.
- `homepage` moved off the npmjs.com page onto the documentation site.
- `funding` added; `keywords` reduced from 24 to 9 honest terms.
- `files` allowlist corrected to include the `bin` script explicitly; inert `.npmignore` removed.

## [2.4.2] — 2026-06-30

**Native now actually compiles — Google-only native (verified).** `2.4.1` shipped native sources that
had never been built in a real app; an end-to-end integration compile (a throwaway Capacitor app, real
Android `gradle assembleDebug` + iOS `pod lib lint`) surfaced and fixed the breakage. **Use `2.4.2`, not
`2.4.1`** (which is deprecated).

### Changed

- **Native is Google-only.** Removed the Facebook (`FBSDKLoginKit` / `facebook-login`) and Microsoft
  (`MSAL`) native dependencies so the plugin no longer drags heavy auth SDKs into every consumer app. The
  disabled providers' native code moved to `android/disabled-native-providers/` and
  `ios/disabled-native-providers/` (kept for re-enablement; not compiled, not shipped). `ProviderFactory`
  (Android) and `createProvider` (iOS) are trimmed to Google; the JS layer already reports
  `PROVIDER_NOT_ENABLED` for the rest.
- iOS podspec slimmed to `Capacitor` + `GoogleSignIn ~> 7.1`; removed the dangling
  `SWIFT_OBJC_BRIDGING_HEADER` (the file never existed; GoogleSignIn 7 is pure Swift).

### Fixed (native compile errors that blocked every consumer build)

- **Android:** `com.facebook.android:facebook-login:17.0.3` was unresolvable → build failed before any
  Java compiled. `GoogleAuthProvider` caught `GoogleIdTokenParsingException`, a checked exception
  `GoogleIdTokenCredential.createFrom` doesn't declare in googleid 1.1.1. `getIdToken` called the throwing
  `JSObject.getBoolean(...)` unguarded → unreported `JSONException`. Verified with `gradle :…:assembleDebug`.
- **iOS:** `CapacitorAuthManager` passed `AuthPersistence` / `AuthProvider` enums where the storage API
  expects `String` (`.rawValue`). `Plugin.removeAllListeners(_:)` now `override public`s Capacitor 8's
  built-in and delegates to `super`. Verified with `pod lib lint`.

> Both platforms now build in a clean Capacitor 8 app. Still verify Google sign-in on a real device before
> the fleet rollout (a successful compile is not a runtime test).

## [2.4.1] — 2026-06-30

**Google-first production refocus.** This release turns the package into a working, **Firebase-agnostic
Google authentication plugin** across **web, iOS and Android** — a drop-in alternative to
`@codetrix-studio/capacitor-google-auth`. The remaining providers are being re-enabled **one at a time**
as each is hardened and verified on device; until then they report a clear `PROVIDER_NOT_ENABLED` error.

> **Versioning note:** by maintainer choice this is a **patch**. Future providers land as **minor** bumps,
> fixes as patches, and a `3.0.0` only once all providers are working again. If your app used a non-Google
> provider on `2.4.0`, stay on `2.4.0` until that provider is re-enabled.

> **Native build caveat:** the iOS (Swift) and Android (Java) sources in this release were written to the
> official SDK contracts but are **not compiled in CI**. Validate `2.4.1` in **one** app (web + one Android
> device + one iOS device) before rolling it out to a fleet.

### Added

- **Native dispatch.** `auth.signIn(AuthProvider.GOOGLE)` (and the React/Vue/Angular `useAuth().signIn`)
  now route to the **native Google SDK on iOS/Android** and to **Google Identity Services on web** — the
  same call on every platform. Previously the modern API always ran the web flow, even inside a device webview.
- **`GoogleNativeProvider`** — a platform-bridge provider that delegates to the `CapacitorAuthManager`
  Capacitor plugin (native Google SDK) and returns `{ idToken, accessToken?, serverAuthCode?, user }`.
- **Android Google rebuilt on Credential Manager** (`androidx.credentials` + `GoogleIdTokenCredential`),
  replacing the deprecated, broken `GoogleSignIn` activity-result path (which never resolved).
- **Web Google rebuilt on the GIS id-token flow** (`google.accounts.id`) — no client secret, no backend;
  returns a Google `idToken` you can feed to `signInWithCredential(GoogleAuthProvider.credential(idToken))`.
- `AuthCredential.serverAuthCode`, `GoogleAuthOptions.iosClientId` / `filterByAuthorizedAccounts` /
  `autoSelectEnabled` / `nonce`, and `AuthErrorCode.PROVIDER_NOT_ENABLED`.

### Changed

- **Only Google is enabled.** The other 14 providers are un-registered and excluded from the published
  build; their web implementations remain in the repo for re-enablement. `signIn()` for any of them throws
  `AuthErrorCode.PROVIDER_NOT_ENABLED` with a clear message.
- **No secrets persisted by default.** The manager no longer writes `idToken` / `accessToken` /
  `refreshToken` / `serverAuthCode` to the default (unencrypted) storage — only a non-secret session
  snapshot. Short-lived tokens are re-derived via the provider's silent restore. Inject a secure storage
  adapter if you want token persistence.
- **Packaging:** `prepack` now builds `dist/` (so `npm pack` produces an importable tarball, not just
  `npm publish`); `prepublishOnly` runs build + lint; added `engines.node >=18`; `@angular/core` peer range
  widened to include `^22`; `CHANGELOG.md` now ships; added `./package.json` export; LICENSE copyright
  updated to 2024–2026.

### Fixed

- iOS Google: `emailVerified` was wrongly derived from the profile image; replaced the deprecated
  `UIApplication.shared.windows` presenter lookup.
- Web Google: removed the insecure client-side OAuth code→token exchange that required a `client_secret`
  in the browser.

## [2.4.0] — 2026-05-27

**No runtime behavior change.** Type-safety and tooling cleanup. Public types were tightened (see below), so TypeScript consumers may surface new, helpful type errors — hence a minor (not patch) bump. No public method was removed or renamed.

### Changed (type safety)

- Eliminated **all 37 remaining `no-explicit-any`** occurrences — the linter now reports **0 errors and 0 warnings**.
- **`StorageInterface` is now generic**: `get<T = unknown>(key): Promise<T | null>` and `set<T = unknown>(key, value: T)` (was `Promise<any>` / `value: any`). Existing custom-storage implementations remain compatible; direct callers now get `unknown` by default and should pass a type argument (`storage.get<AuthUser>(key)`) or narrow.
- **Angular adapter** method parameters now use real types instead of `any`: `configure(config: AuthManagerConfig)`, `initialize(config?)`, `signIn(options?)`, `signOut(options?: SignOutOptions)`, and `AuthModuleConfig.providers: Record<string, ProviderOptions>`.
- `catch (error: any)` blocks across the credential/biometric/registry providers now use a shared `getErrorMessage(error: unknown)` helper (`src/utils/error-message.ts`).
- `provider-registry` loader types and `platform` checks narrowed from `any` to precise types; `phone-password` backend payload and `biometric` credential params are now typed.
- Genuinely dynamic boundaries (optional-peer-dependency dynamic imports of `@capacitor/preferences` and `capacitor-biometric-authentication`) retain a single documented `// eslint-disable-next-line` instead of an undocumented `any`.

### Changed (tooling)

- Completed the ESLint 9→10 migration started in 2.2.0: renamed `eslint.config.js` → `eslint.config.mjs` and migrated the deprecated `.eslintignore` into the flat config's `ignores`. `npm run lint` output is now free of deprecation notices.

## [2.3.0] — 2026-05-26

**No breaking changes.** Backward-compatible minor release. This is an **internal refactor only** — no public method signature, runtime behavior, or provider list changed. There are still **15 web providers**.

### Internal

- Completed audit finding **F-39**: the 7 web providers that previously implemented `AuthProviderInterface` directly (`magic-link`, `sms`, `email-code`, `email-password`, `username-password`, `phone-password`, `biometric`) now extend the shared `BaseAuthProvider` — the same base used by the OAuth and Firebase providers. All **15** web providers now share one construction, event, state, and capability-detection path, removing the duplicated lifecycle/state machinery the audit flagged.
- Provider constructors accept **either** the injected `BaseProviderConfig` (factory/registry path) **or** the provider's own bare config object (direct construction), via a shared `resolveProviderConfig` helper. Existing `new XProvider(config)` usage from `capacitor-auth-manager/providers/web` keeps working unchanged.
- Per-provider `linkAccount`/`unlinkAccount` no-op throwers were removed in favor of `BaseAuthProvider`'s `OPERATION_NOT_ALLOWED` defaults (completing F-44). Provider-specific capability behavior is preserved (biometric `unlinkAccount` and magic-link/sms/email-code `revokeAccess` still clear their stored/pending state).
- Base capability-default error messages reworded to a consistent "… is not supported by provider …".
- `no-explicit-any` lint warnings reduced from 45 to 37.

### Verification

- `npm run build` clean · `npm run test:run` → 79 pass · `npm run lint` → 0 errors (37 warnings).

## [2.2.0] — 2026-05-26

**No breaking changes.** This is a backward-compatible minor release — no public method signature was removed or changed in a breaking way. It repairs broken runtime paths, hardens security, completes the stub providers, and updates dependencies. There are **15 web providers**: apple, biometric, email-code, email-password, facebook, firebase, github, google, linkedin, magic-link, microsoft, phone-password, slack, sms, username-password.

### Dependencies

- Updated all dependencies to current stable. Dev/build majors applied: `@types/node` 25, `eslint` 10, `typescript` 6, `@capacitor/*` 8, plus rollup, vitest, prettier, happy-dom, and others.
- Widened peer ranges so existing consumers are not broken:
  - `@capacitor/core`: `^7.4.2 || ^8.0.0` (optional — only for the native plugin / `CapacitorPreferencesStorage`).
  - `@angular/core`: extended through `^21.0.0`.
  - `react` `16.8`–`19`, `vue` `^3` remain supported.
- `@capacitor/preferences` is an optional peer, required only for `CapacitorPreferencesStorage`.
- iOS podspec deployment target raised from 13.0 to 14.0.

### Security

- **PKCE (S256)** added to the authorization-code OAuth flow (manual flows — Slack, LinkedIn) per RFC 7636: a `code_verifier` is generated and persisted with `state`/`nonce`, and `code_challenge` + `code_challenge_method=S256` are sent on the authorization request. Default-on for those flows; respects `pkceEnabled`. (Google uses Google Identity Services and Apple uses its SDK — both manage PKCE themselves.)
- **OIDC nonce + ID-token `exp` validation.** The returned ID token's `nonce` is compared to the stored value (`auth/invalid-nonce` on mismatch) and the `exp` claim is checked. ID-token **signatures are not verified client-side** — consumers must re-validate ID tokens against the provider's JWKS server-side before trusting claims.
- **Pluggable secure storage.** `configure()` accepts a `storage` option (any `StorageInterface`). New exported `CapacitorPreferencesStorage` backs storage with `@capacitor/preferences` (native key-value) so native tokens stay out of the webview's `localStorage`. The default web storage remains `localStorage`, which is readable by any XSS/third-party script — documented honestly; inject secure storage on native. Capacitor Preferences is not hardware-encrypted; use a Keychain/Keystore-backed adapter for secrecy at rest.
- **Biometric web fallback now uses real AES-GCM** with a non-extractable IndexedDB key, replacing base64 encoding (existing base64 values remain decodable for compatibility).
- **`client_secret` deprecated for browser use.** Browser-facing `clientSecret`/`appSecret` fields are no longer read in browser token/refresh/revoke calls (a secret in the JS bundle is recoverable) and emit a one-time warning when supplied in a web context. Fields kept for backward compatibility.
- **`AuthError.details` is sanitized** — token/password keys are redacted and only JSON-safe primitives are retained.
- CSPRNG (`crypto.randomUUID` / `crypto.getRandomValues`) used for UID fallbacks; developer-supplied credential endpoints warn if non-HTTPS.

### Fixes

- **Primary `auth` API was broken at runtime for OAuth and credential providers** — the provider registry constructed `BaseAuthProvider` subclasses with raw options instead of a `BaseProviderConfig`, so storage/logger/options were `undefined`. The registry now builds a proper config and injects shared storage + logger. This repaired path is what the React/Vue/Angular adapters use.
- **Credential threading** — `auth.signIn({ provider, credentials })` now reaches credential providers correctly (credentials spread to where each provider reads them).
- **Provider name resolution** — underscore enum values (`username_password`, `email_code`, `phone_password`, `email_magic_link`) now resolve to the correct registry loaders; added missing loaders for `email-code` and `phone-password`.
- **Session restore** now runs after `configure()` supplies providers, so a persisted session is rehydrated on reload (previously the auto-init-in-constructor left it dead).
- **GitHub sign-in completes** via a developer-supplied `tokenExchangeProxy` (alias `tokenEndpoint`); the per-init `message` listener and popup interval no longer leak. Without a proxy, sign-in throws `auth/missing-config`.
- **Slack and LinkedIn fetch real user profiles** (Slack `openid.connect.userInfo`, LinkedIn `/v2/userinfo`) instead of returning hardcoded placeholder identities.
- **Firebase sign-in method** is derived from standard options/credentials, with a new `defaultMethod` fallback (previously branched on an undocumented field the manager never sent).
- **Microsoft** per-sign-in `scopes`/`loginHint`/`prompt` are mapped explicitly into the MSAL request.
- **Passwordless pending state** (SMS / email-code / magic-link) is persisted (non-secret metadata only) so verification survives reload/redirect.
- Auto-refresh timer no longer overflows the 32-bit `setTimeout` ceiling for far-future expiry; an untargeted `signOut` clears all refresh timers; `refreshToken` token access is null-guarded.
- `web.ts` `getIdToken` no longer double-parses already-parsed storage; `getCurrentUser` isolates per-provider failures and sets the current provider; Apple `refreshToken` returns `auth/operation-not-allowed`; SMS/email-code `refreshToken` return `auth/operation-not-allowed`.
- In-memory `persistence: 'memory'` now correctly maps to in-memory storage (previously fell through to `localStorage`).

### Features

- **Account-management methods on the `auth` singleton** (and surfaced through the React/Vue/Angular adapters): `linkAccount`, `unlinkAccount`, `revokeAccess`, `getIdToken`, `updateProfile`, `deleteAccount`. Each delegates to the active provider and throws `auth/operation-not-allowed` if unsupported.
- New `isProviderConfigured(name)` and `getConfiguredProviders()` accessors on the singleton (also used by the adapters instead of reaching into private state).
- New config field `GitHubAuthOptions.tokenExchangeProxy` (alias `tokenEndpoint`) and `FirebaseAuthOptions.defaultMethod`.
- New exports: `WebStorage`, `CapacitorPreferencesStorage`, `StorageInterface`, and the shared `defaultLogger` (plus `Logger`, `LogLevel`, `LoggerConfig`).

### Internal

- **Centralized logging.** All package logging routes through a `Logger`; zero direct `console.*` calls remain outside the logger module. Default level `warn`; adjustable via `VITE_LOG_LEVEL` / `LOG_LEVEL` (build-time) or `defaultLogger.setLevel()` (runtime). The logger deliberately does not patch the host's global `console` or read the host's `localStorage` (documented deviations appropriate for a published library).
- All standalone providers throw `AuthErrorCode` enum members instead of bare string codes; added additive enum members (e.g. `CREDENTIALS_REQUIRED`, `INVALID_CODE`, `CODE_EXPIRED`, `INVALID_TOKEN`, `STORAGE_ERROR`, `PROVIDER_UNSUPPORTED_OPERATION`).
- Typing: replaced `any` in exported public types with concrete types. One acknowledged widening to a precise type — `AuthManagerConfig.providers` is now `Record<string, ProviderOptions>` instead of `any`. Reduced SDK-boundary `any` (minimal interface shapes for Firebase/MSAL/Facebook/GitHub) and internal mapper typing (lint `no-explicit-any` warnings 138 → 45).
- Extracted provider manifest data into `provider-manifests.ts` (registry file 752 → 281 lines).
- tsconfig `moduleResolution` `node10` → `bundler`, `module` `ES2020` → `ESNext`, added `rootDir`; ESLint consolidated onto unified `typescript-eslint` (dropped the banned `@eslint/js`).

### Verification

- `npm run build` succeeds; `npm run test:run` — 79 tests pass; `npm run lint` — 0 errors.

## Earlier releases

`0.0.1`, `0.0.2`, `1.0.0`, `1.1.0` and `2.1.0` were published before this changelog was started, and no
per-version record of them was kept. They are listed here so the gap is visible rather than silent; the
published artefacts remain on
[npm](https://www.npmjs.com/package/capacitor-auth-manager?activeTab=versions). Treat `2.2.0` as the first
release with a documented history.

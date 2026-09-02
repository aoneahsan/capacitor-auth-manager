<div align="center">

<img src="https://capacitor-auth-manager-docs.aoneahsan.com/img/logo.svg" alt="Capacitor Auth Manager logo" width="120" />

<h1>capacitor-auth-manager</h1>

<p><strong>Firebase-agnostic Google sign-in for Capacitor and the web — one call, same result on every platform.</strong></p>

[![npm version](https://img.shields.io/npm/v/capacitor-auth-manager.svg)](https://www.npmjs.com/package/capacitor-auth-manager)
[![downloads](https://img.shields.io/npm/dm/capacitor-auth-manager.svg)](https://www.npmjs.com/package/capacitor-auth-manager)
[![license](https://img.shields.io/npm/l/capacitor-auth-manager.svg)](https://github.com/aoneahsan/capacitor-auth-manager/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/capacitor-auth-manager.svg)](https://www.npmjs.com/package/capacitor-auth-manager)
[![bundle size](https://img.shields.io/bundlephobia/minzip/capacitor-auth-manager.svg)](https://bundlephobia.com/package/capacitor-auth-manager)
[![node](https://img.shields.io/node/v/capacitor-auth-manager.svg)](https://nodejs.org)

[Docs](https://capacitor-auth-manager-docs.aoneahsan.com) · [npm](https://www.npmjs.com/package/capacitor-auth-manager) · [GitHub](https://github.com/aoneahsan/capacitor-auth-manager) · [Changelog](https://github.com/aoneahsan/capacitor-auth-manager/blob/main/CHANGELOG.md) · [Support](https://github.com/aoneahsan/capacitor-auth-manager/issues)

</div>

> [!IMPORTANT]
> - **Google is the only enabled provider in `2.5.x`.** The other fourteen are present in the source but
>   un-registered — calling one throws `AuthErrorCode.PROVIDER_NOT_ENABLED`. They are re-enabled one at a
>   time, each verified on a device first.
> - **`@capacitor/core` is a required peer** as of `2.5.0` — the published bundle registers the Capacitor
>   plugin even for a web-only build. Bare Node ESM and server-side imports work since `2.5.0`.

Capacitor Auth Manager gives a Capacitor app one Google sign-in call that behaves the same on web, iOS and
Android, and hands back a raw `idToken` to use as you like. It pulls in no `firebase` dependency, so it fits
apps built on Firebase Auth and apps built on their own backend equally well. Typed React, Vue and Angular
adapters ship with it, so the sign-in button is a few lines in whichever framework you already use.

| | |
|---|---|
| **Version** | `2.5.0` |
| **License** | MIT |
| **Node** | `>=24.0.0` |
| **Platforms** | Web · iOS · Android |
| **Install size** | 264 kB tarball · ~17.4 kB min+gzip for the root entry |
| **Types** | Bundled `.d.ts` (ESM + CJS) |
| **Status** | Google provider in production use · remaining providers staged |

<a id="table-of-contents"></a>
## 🧭 Table of Contents&nbsp;[#](#table-of-contents)

- [💡 Why capacitor-auth-manager](#why-capacitor-auth-manager)
- [✨ Features](#features)
- [📱 Platform Support](#platform-support)
- [📋 Requirements](#requirements)
- [📦 Installation](#installation)
- [🚀 Quick Start](#quick-start)
- [🛠️ Usage](#usage)
- [⚙️ Configuration](#configuration)
- [🔧 API Reference](#api-reference)
- [🧩 Types](#types)
- [💻 Command Line](#command-line)
- [🎛️ Advanced Features](#advanced-features)
- [🚑 Recovery & Troubleshooting](#recovery-troubleshooting)
- [🚧 Limitations](#limitations)
- [❓ FAQ](#faq)
- [📚 Documentation](#documentation)
- [🔄 Changelog](#changelog)
- [🗺️ Roadmap](#roadmap)
- [🤝 Contributing](#contributing)
- [💬 Support](#support)
- [📄 License](#license)
- [👤 Author](#author)
- [🔗 Links](#links)
- [🏷️ Keywords](#keywords)

<a id="why-capacitor-auth-manager"></a>
## 💡 Why capacitor-auth-manager&nbsp;[#](#why-capacitor-auth-manager)

Google sign-in in a Capacitor app is normally two implementations wearing one button. On the web you open a
Firebase popup; inside the native webview that popup is unreliable, so you add a native plugin and a second
code path with a different result shape. The branch then leaks into your UI, your tests and your error
handling.

This package collapses that into `auth.signIn(AuthProvider.GOOGLE)`. It routes to Google Identity Services on
the web, the GoogleSignIn SDK on iOS and Credential Manager on Android, and returns the same
`{ user, credential }` shape from all three. What you do with the `idToken` afterwards — hand it to Firebase,
or verify it on your own server — stays your decision.

| | `capacitor-auth-manager` | Firebase popup + a separate native plugin |
|---|---|---|
| Call sites for one button | one | two, behind a platform branch |
| Result shape | identical on all three platforms | differs per path |
| `firebase` dependency | none | required on web |
| Framework adapters | React, Vue, Angular included | write your own |
| Providers available today | Google | whatever each piece supports |

**Not the right tool when** — you need a provider other than Google today; you need a Google **refresh
token** in the browser (neither web flow issues one — use a backend exchange); or you already have a
Firebase-popup web flow that works and no native build to support.

<a id="features"></a>
## ✨ Features&nbsp;[#](#features)

- **One call per platform** — the same `signIn` on web, iOS and Android, returning the same shape.
- **Firebase-agnostic** — returns a raw `idToken`, and pulls no `firebase` package into your tree.
- **Modern native SDKs** — Android Credential Manager and iOS GoogleSignIn rather than deprecated APIs.
- **Typed framework adapters** — a `useAuth` hook for React, composables for Vue, an injectable
  `AuthService` and route guards for Angular.
- **Observable auth state** — subscribe once with `onAuthStateChange` and let the UI follow.
- **Pluggable storage** — web and Capacitor Preferences backends ship with it, and it accepts your own
  `StorageInterface` when you need Keychain or Keystore.
- **No token persistence by default** — sessions restore through the Google SDK rather than through
  `localStorage`.

<a id="platform-support"></a>
## 📱 Platform Support&nbsp;[#](#platform-support)

| Platform | Supported | Notes |
|---|---|---|
| Web | ✅ | Google Identity Services. One-Tap / FedCM returns an `idToken`; the OAuth2 popup fallback returns an `accessToken` (`webFlow`). |
| Android | ✅ | Credential Manager bottom sheet, falling back to the Sign in with Google button flow (`androidFlow`). `serverClientId` is required to receive an `idToken`. |
| iOS | ✅ | GoogleSignIn 7.x. Returns `idToken`, `accessToken`, and `serverAuthCode` when configured. |
| Node / SSR | ✅ import | Importing is side-effect free since `2.5.0`; sign-in itself still needs a browser or a device. |

Native sources for both platforms compile in a clean Capacitor 8 app, verified with Gradle `assembleDebug`
and `pod lib lint`. A successful compile is not a runtime test — sign in once on a real device before rolling
a new version across several apps. The maintained end-to-end example is `examples/react` in the private
repository (a Capacitor app wired to a Firebase project).

<a id="requirements"></a>
## 📋 Requirements&nbsp;[#](#requirements)

| Requirement | Version | Why |
|---|---|---|
| Node | `>=24.0.0` | build and install only; the package itself runs in a browser or a webview. Current + latest Node only — no legacy targets |
| `@capacitor/core` | `^7.4.2 \|\| ^8.0.0` | **required** peer — the published bundle registers the Capacitor plugin, so install it even for a web-only build |
| `@capacitor/preferences` | `^6 \|\| ^7 \|\| ^8` | optional peer — only for `CapacitorPreferencesStorage` |
| `react` | `^16.8 \|\| ^17 \|\| ^18 \|\| ^19` | optional peer — only for `capacitor-auth-manager/react` |
| `vue` | `^3.0.0` | optional peer — only for `capacitor-auth-manager/vue` |
| `@angular/core` | `^12` – `^22` | optional peer — only for `capacitor-auth-manager/angular` |

You also need Google OAuth client IDs: a **Web** client for every platform, plus an **Android** client
registered with your signing fingerprints and an **iOS** client if you ship those platforms.

<a id="installation"></a>
## 📦 Installation&nbsp;[#](#installation)

```bash
yarn add capacitor-auth-manager @capacitor/core
```

For the native plugin, sync it into the platform projects. Without this step iOS and Android never load it:

```bash
npx cap sync
```

Then finish the per-platform OAuth setup, which cannot be done from JavaScript:

- **Android** — add your `google-services.json`, register the app's SHA-1 and SHA-256 fingerprints against an
  Android OAuth client, and pass your **Web** client ID as `serverClientId`. Credential Manager will not
  return an `idToken` without it. The plugin adds no manifest permissions of its own.
- **iOS** — add `GIDClientID` to `Info.plist` (or pass `iosClientId`), and add the reversed client ID as a URL
  scheme under `CFBundleURLTypes`.

The bundled [command-line helper](#command-line) can write most of this for you.

<a id="quick-start"></a>
## 🚀 Quick Start&nbsp;[#](#quick-start)

Configure once at startup, then sign in from anywhere.

```ts
import { auth, AuthProvider } from 'capacitor-auth-manager';

auth.configure({
  providers: {
    [AuthProvider.GOOGLE]: {
      clientId: 'YOUR_WEB_OAUTH_CLIENT_ID',
      serverClientId: 'YOUR_WEB_OAUTH_CLIENT_ID', // required on Android for an idToken
      iosClientId: 'YOUR_IOS_OAUTH_CLIENT_ID',
    },
  },
  persistence: 'local',
});

const result = await auth.signIn(AuthProvider.GOOGLE);
console.log(result.user.email, result.credential.idToken);
```

`AuthProvider.GOOGLE` is the typo-safe form of the string `'google'`; either works.

<a id="usage"></a>
## 🛠️ Usage&nbsp;[#](#usage)

### Hand the credential to Firebase

Identical on web, iOS and Android — the `idToken` is all Firebase needs.

```ts
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

const result = await auth.signIn(AuthProvider.GOOGLE);
await signInWithCredential(getAuth(), GoogleAuthProvider.credential(result.credential.idToken));
```

### Verify on your own backend instead

```ts
const { credential } = await auth.signIn(AuthProvider.GOOGLE);
await fetch('/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: credential.idToken }),
});
```

Always verify the token's signature server-side. This package does not verify it in the browser.

### React

```tsx
import { useAuth, AuthProvider } from 'capacitor-auth-manager/react';

function LoginButton() {
  const { user, signIn, signOut, isLoading } = useAuth();
  if (isLoading) return <span>Checking…</span>;
  if (user) return <button onClick={() => signOut()}>Sign out {user.email}</button>;
  return <button onClick={() => signIn(AuthProvider.GOOGLE)}>Sign in with Google</button>;
}
```

Vue exposes the same surface as composables from `capacitor-auth-manager/vue`, and Angular as an injectable
`AuthService` plus `AuthGuard` from `capacitor-auth-manager/angular`.

### React to auth state anywhere

```ts
const unsubscribe = auth.onAuthStateChange((state) => {
  console.log(state.user ? `signed in as ${state.user.email}` : 'signed out');
});
```

### Migrating from `@codetrix-studio/capacitor-google-auth`

The token moves from `result.authentication.idToken` to `result.credential.idToken`; the native account
chooser and the Firebase handoff behave as before.

```ts
// before
await GoogleAuth.initialize({ clientId });
const u = await GoogleAuth.signIn();
const token = u.authentication.idToken;

// after
auth.configure({ providers: { [AuthProvider.GOOGLE]: { clientId, serverClientId, iosClientId } } });
const res = await auth.signIn(AuthProvider.GOOGLE);
const token = res.credential.idToken;
```

<a id="configuration"></a>
## ⚙️ Configuration&nbsp;[#](#configuration)

`auth.configure()` takes the manager options; each provider takes its own block.

| Option | Type | Default | What it does |
|---|---|---|---|
| `providers` | `Record<AuthProvider, ProviderOptions>` | `{}` | Per-provider configuration. |
| `persistence` | `'local' \| 'session' \| 'none'` | `'local'` | Where auth state is kept between loads. |
| `storage` | `StorageInterface` | web storage | Custom backend — pass `CapacitorPreferencesStorage` or your own. |

Google provider options:

| Option | Platform | What it does |
|---|---|---|
| `clientId` | web (required), Android fallback | Web OAuth client ID; becomes the id token's `aud`. |
| `serverClientId` | Android (required), iOS | Web OAuth client ID. Credential Manager needs it to return an `idToken`. |
| `iosClientId` | iOS | iOS OAuth client ID, if not set as `GIDClientID` in `Info.plist`. |
| `scopes` | all | Extra OAuth scopes. Defaults to `openid email profile`. |
| `hostedDomain` | all | Restrict sign-in to one Google Workspace domain. |
| `loginHint` | all | Pre-fill an account. |
| `filterByAuthorizedAccounts` | Android | Show only previously authorised accounts. |
| `autoSelectEnabled` | Android | Allow one-tap auto-select for returning users. |
| `nonce` | web | Bind the request to an id-token `nonce` claim, which the package validates. |
| `webFlow` | web | `'auto'` (default: One-Tap, then the OAuth2 popup if One-Tap is not shown) · `'one-tap'` · `'popup'`. Also accepted per call in `signIn({ options })`. |
| `androidFlow` | Android | `'auto'` (default: bottom sheet, then the Sign in with Google button flow if no account is offered) · `'bottom-sheet'` · `'button'`. Also accepted per call. |

The same Google options can live in `capacitor.config` under the plugin block instead of in application code.
Full reference: [Configuration](https://capacitor-auth-manager-docs.aoneahsan.com/getting-started/configuration).

<a id="api-reference"></a>
## 🔧 API Reference&nbsp;[#](#api-reference)

A signature index. Full documentation is on the
[docs site](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton).

| Export | Signature | Docs |
|---|---|---|
| `auth.configure` | `(config: AuthManagerConfig) => void` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.signIn` | `(provider: AuthProvider, options?: SignInOptions) => Promise<AuthResult>` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.signOut` | `(options?: SignOutOptions) => Promise<void>` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.getCurrentUser` | `() => AuthUser \| null` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.isAuthenticated` | `() => boolean` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.onAuthStateChange` | `(cb: AuthStateChangeCallback) => () => void` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.getIdToken` | `(options?: GetIdTokenOptions) => Promise<string \| null>` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.refreshToken` | `(options?: RefreshTokenOptions) => Promise<AuthResult>` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.revokeAccess` | `() => Promise<void>` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `auth.deleteAccount` | `() => Promise<void>` | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) |
| `AuthError` · `isAuthError` | error class and type guard | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/errors) |
| `WebStorage` · `CapacitorPreferencesStorage` | `StorageInterface` implementations | [→](https://capacitor-auth-manager-docs.aoneahsan.com/api/storage) |

Subpath exports: `capacitor-auth-manager`, `/react`, `/vue`, `/angular`, `/core`, `/providers/web`.

<a id="types"></a>
## 🧩 Types&nbsp;[#](#types)

The shapes you actually touch. Every export is typed; see
[Types](https://capacitor-auth-manager-docs.aoneahsan.com/api/types) for the full set.

```ts
interface AuthResult {
  user: AuthUser;
  credential: AuthCredential;
}

interface AuthCredential {
  providerId: string;        // 'google.com'
  signInMethod: string;
  idToken?: string;          // web One-Tap, iOS, Android
  accessToken?: string;      // web popup flow, iOS
  serverAuthCode?: string;   // iOS, when serverClientId is set — exchange it on your server
}

interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

interface StorageInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

<a id="command-line"></a>
## 💻 Command Line&nbsp;[#](#command-line)

An interactive helper that writes the platform OAuth wiring described in [Installation](#installation).

```bash
npx capacitor-auth-configure
```

It asks which platforms you target and which client IDs you hold, then updates `capacitor.config`,
`Info.plist` and the Android configuration accordingly. It takes no flags and prompts for every answer, so
run it in a real terminal rather than in CI.

<a id="advanced-features"></a>
## 🎛️ Advanced Features&nbsp;[#](#advanced-features)

- **Custom secure storage** — implement `StorageInterface` over Keychain or Keystore and pass it as
  `storage` instead of the default web storage.
- **Nonce validation** — supply `nonce` on web and the package checks the returned id token's claim against it.
- **Google's own button** — when One-Tap is inside its cooldown window, the web provider exposes a
  `renderButton(element)` escape hatch that draws Google's official button.
- **Log level control** — `defaultLogger.setLevel('debug')`, or the `VITE_LOG_LEVEL` / `LOG_LEVEL` build
  variables, without touching `console` directly.
- **Config in `capacitor.config`** — keep the Google block in native config instead of application code.

<a id="recovery-troubleshooting"></a>
## 🚑 Recovery & Troubleshooting&nbsp;[#](#recovery-troubleshooting)

| Symptom | Cause | Fix |
|---|---|---|
| `idToken` is `null` on Android | `serverClientId` missing, or the SHA fingerprint is not registered | Pass your **Web** client ID as `serverClientId` and register the app's SHA-1/SHA-256 on the Android OAuth client |
| `PROVIDER_NOT_ENABLED` | that provider is not enabled in `2.4.x` | Only Google is available today — see [Roadmap](#roadmap) |
| `window is not defined` on the server | you are on `< 2.5.0` | Upgrade — the singleton is lazy and storage is guarded since `2.5.0` |
| `Cannot find module '…/core/auth-manager'` under Node | you are on `< 2.5.0` | Upgrade — every relative specifier carries its `.js` extension since `2.5.0` |
| `POPUP_BLOCKED` on web with `webFlow: 'one-tap'` | One-Tap is suppressed (cooldown, FedCM opt-out, third-party cookies) | Use the default `webFlow: 'auto'` (falls back to the popup) or `'popup'`, or render Google's button via `renderButton(element)` |
| `USER_CANCELLED` / `POPUP_CLOSED_BY_USER` | the user closed One-Tap or the popup | Expected — show your own "try again" |
| No Google account offered on Android | the bottom sheet has no authorized account | The default `androidFlow: 'auto'` falls back to the Sign in with Google button flow, which can add an account |
| `Cannot find module '@capacitor/core'` | the peer is not installed | `yarn add @capacitor/core` — it is a required peer |
| Native plugin never runs | `npx cap sync` was not run after install | Run it, then rebuild the native project |

<a id="limitations"></a>
## 🚧 Limitations&nbsp;[#](#limitations)

Stated as plainly as the features, because each one otherwise costs an afternoon.

- **Google is the only working provider.** Fourteen others exist in the source and throw
  `PROVIDER_NOT_ENABLED` when called.
- **`@capacitor/core` is a required peer.** The published bundle registers the Capacitor plugin even in a
  web-only build, so the dependency is declared honestly rather than as optional.
- **Web returns one token per flow.** One-Tap yields an `idToken` and no `accessToken`; the OAuth2 popup
  yields an `accessToken` and no `idToken`. Firebase accepts either
  (`GoogleAuthProvider.credential(idToken ?? null, accessToken)`); your own backend must accept both.
- **Android returns an `idToken` only.** Access tokens and `serverAuthCode` come from the separate Google
  Authorization API, not from Credential Manager sign-in. Only iOS returns everything.
- **No id-token verification in the browser.** Signature and claim checks belong to your server, or Firebase.
- **Native runtime is not covered by CI.** Both platforms are verified to compile, not to sign in. Test a new
  version on one real device before rolling it out widely.
- **`serverAuthCode` must never be exchanged client-side.** It is returned on iOS for your backend to use.

<a id="faq"></a>
## ❓ FAQ&nbsp;[#](#faq)

**Do I need Firebase to use this?**
No. It returns a raw `idToken` and never imports `firebase`. Handing that token to Firebase is one supported
option among several.

**Can I use it on the web only, without a native build?**
Yes — skip `npx cap sync`. You still need `@capacitor/core` installed, because the published bundle imports it.

**Why is there no `accessToken` on web?**
The web path uses the Google Identity Services id-token flow, which is what lets it work with no client secret
and no backend. To call Google APIs from the browser, use the GIS token client alongside this package.

**Which client ID goes where?**
The **Web** client ID is used as `clientId` on web and as `serverClientId` on Android. The iOS client ID is
separate. This catches nearly everyone once.

**When will the other providers land?**
One at a time, each verified on a device first. See [Roadmap](#roadmap).

**Is it safe to use in a Next.js or Nuxt app?**
Only in client components, or behind a dynamic import. A top-level server import throws — see
[Limitations](#limitations).

<a id="documentation"></a>
## 📚 Documentation&nbsp;[#](#documentation)

| Document | Read it when |
|---|---|
| [Introduction](https://capacitor-auth-manager-docs.aoneahsan.com/intro) | deciding whether this fits your app |
| [Installation](https://capacitor-auth-manager-docs.aoneahsan.com/getting-started/installation) | setting it up the first time |
| [Quick start](https://capacitor-auth-manager-docs.aoneahsan.com/getting-started/quick-start) | you want a working button in five minutes |
| [Configuration](https://capacitor-auth-manager-docs.aoneahsan.com/getting-started/configuration) | tuning manager or provider options |
| [Google provider](https://capacitor-auth-manager-docs.aoneahsan.com/providers/google) | wiring client IDs and scopes correctly |
| [Android](https://capacitor-auth-manager-docs.aoneahsan.com/platforms/android) · [iOS](https://capacitor-auth-manager-docs.aoneahsan.com/platforms/ios) · [Web](https://capacitor-auth-manager-docs.aoneahsan.com/platforms/web) | one platform behaves differently from the others |
| [React](https://capacitor-auth-manager-docs.aoneahsan.com/frameworks/react) · [Vue](https://capacitor-auth-manager-docs.aoneahsan.com/frameworks/vue) · [Angular](https://capacitor-auth-manager-docs.aoneahsan.com/frameworks/angular) · [Vanilla JS](https://capacitor-auth-manager-docs.aoneahsan.com/frameworks/vanilla-js) | integrating with your framework |
| [API reference](https://capacitor-auth-manager-docs.aoneahsan.com/api/auth-singleton) | you need an exact signature |
| [FAQ](https://capacitor-auth-manager-docs.aoneahsan.com/faq) | something surprised you |

<a id="changelog"></a>
## 🔄 Changelog&nbsp;[#](#changelog)

Latest release: **`2.4.4`** — documentation only: the at-a-glance table above reported the previous version, because it is a static duplicate of `package.json`. Full history in the changelog.

Full history: [CHANGELOG.md](https://github.com/aoneahsan/capacitor-auth-manager/blob/main/CHANGELOG.md).

<a id="roadmap"></a>
## 🗺️ Roadmap&nbsp;[#](#roadmap)

- Re-enable the remaining providers one at a time, each hardened and then verified on a device.
- Android access-token and `serverAuthCode` support through the Google Authorization API.
- A `3.0.0` once every provider works again.

Dates are deliberately absent; each item ships when it is verified rather than when it is scheduled.

<a id="contributing"></a>
## 🤝 Contributing&nbsp;[#](#contributing)

Fork and open a pull request — see
[CONTRIBUTING.md](https://github.com/aoneahsan/capacitor-auth-manager/blob/main/.github/CONTRIBUTING.md) for
setup, standards, and how to request collaborator access. `main` is protected: every change lands through a
reviewed pull request. Security issues follow
[SECURITY.md](https://github.com/aoneahsan/capacitor-auth-manager/blob/main/.github/SECURITY.md) rather than
the public tracker.

<a id="support"></a>
## 💬 Support&nbsp;[#](#support)

Questions and bugs: [open an issue](https://github.com/aoneahsan/capacitor-auth-manager/issues).

If this package saves you time, you can support its maintenance at
[aoneahsan.com/payment](https://aoneahsan.com/payment?project-id=capacitor-auth-manager&project-identifier=capacitor-auth-manager).

<a id="license"></a>
## 📄 License&nbsp;[#](#license)

MIT © Ahsan Mahmood — see
[LICENSE](https://github.com/aoneahsan/capacitor-auth-manager/blob/main/LICENSE).

<a id="author"></a>
## 👤 Author&nbsp;[#](#author)

**Ahsan Mahmood** — [aoneahsan.com](https://aoneahsan.com) · [GitHub](https://github.com/aoneahsan) ·
[LinkedIn](https://linkedin.com/in/aoneahsan) · [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com)

<a id="links"></a>
## 🔗 Links&nbsp;[#](#links)

| | |
|---|---|
| Documentation | https://capacitor-auth-manager-docs.aoneahsan.com |
| npm | https://www.npmjs.com/package/capacitor-auth-manager |
| Repository | https://github.com/aoneahsan/capacitor-auth-manager |
| Issues | https://github.com/aoneahsan/capacitor-auth-manager/issues |
| Changelog | https://github.com/aoneahsan/capacitor-auth-manager/blob/main/CHANGELOG.md |
| Support the project | https://aoneahsan.com/payment |

<a id="keywords"></a>
## 🏷️ Keywords&nbsp;[#](#keywords)

*capacitor · authentication · google-sign-in · oauth · id-token · capacitor-plugin · react · vue · angular*

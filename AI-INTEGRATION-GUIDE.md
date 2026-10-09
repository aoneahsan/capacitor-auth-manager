# Capacitor Auth Manager: AI integration guide

Release: **3.0.0**. Audience: Claude Code, Codex, and developers integrating Google sign-in.
Use this guide from the installed package; the npm README and [documentation](https://capacitor-auth-manager-docs.aoneahsan.com) describe the same release.

<a id="table-of-contents"></a>
## 🧭 Table of Contents&nbsp;[#](#table-of-contents)

- [Contract](#contract)
- [Setup](#setup)
- [Firebase handoff](#firebase)
- [Platform setup](#platform-setup)
- [Tokens and state](#tokens-and-state)
- [Errors and security](#errors-and-security)
- [App acceptance checks](#acceptance)

<a id="contract"></a>
## 🔧 Contract&nbsp;[#](#contract)

| Decision | Contract |
|---|---|
| Enabled provider | `AuthProvider.GOOGLE` only; other recognized providers throw `PROVIDER_NOT_ENABLED` |
| Application responsibility | Google OAuth registration, Firebase initialization, app sessions, authorization, translations |
| Package responsibility | Platform dispatch, Google SDK invocation, normalized `{ user, credential }`, observable local state |
| Firebase dependency | None; install Firebase in the app |
| Node | ≥24 for installation/tooling; imports are server-safe, sign-in runs in a browser or native app |
| Capacitor | `@capacitor/core` is required even on web; peers support 7.4.2 and 8.x |
| Native floors | Android API 24; iOS 15; native builds require JDK 21 |
| Upgrade from 2.4.x | Node floor rises, iOS floor rises, Angular peers are 22.x; web may return an access token instead of an ID token |

Read the actual installed `.d.ts` declarations before inventing a method. Public imports are
`capacitor-auth-manager`, `/core`, `/react`, `/vue`, `/angular`, `/providers/web`, and `/package.json`.
The `/providers/web` entry exports `GoogleAuthProviderWeb`; construct it with Google options or an injected provider config.
React exports `useAuth`, `useAuthState`, `useUser`, `useIsAuthenticated`, `useAuthProvider`.
The root exports the `auth` singleton, `AuthProvider`, `AuthErrorCode`, `AuthError`, `isAuthError`, storage classes, logger, and shared types.

<a id="setup"></a>
## 📦 Setup&nbsp;[#](#setup)

```bash
yarn add capacitor-auth-manager@3.0.0 @capacitor/core firebase
# Native applications only, after the platform projects exist:
yarn cap sync
```

Use the app's existing Capacitor CLI and keep its core, CLI, Android, and iOS versions aligned.
Configure once in the browser application bootstrap, before rendering enabled sign-in controls.
OAuth client IDs are public identifiers; client secrets never belong in a frontend or Capacitor config.

```ts
import { auth, AuthProvider } from 'capacitor-auth-manager';

export async function prepareGoogle(clientId: string, iosClientId?: string) {
  auth.configure({
    providers: {
      [AuthProvider.GOOGLE]: {
        clientId,
        serverClientId: clientId,
        iosClientId,
        webFlow: 'popup',
      },
    },
    persistence: 'memory',
  });
  await auth.prepare(AuthProvider.GOOGLE);
}
```

`prepare()` loads Google Identity Services or initializes the native SDK without opening a sign-in prompt.
Disable the app's sign-in button until preparation succeeds. Call sign-in from a direct click, never an effect,
a timeout, or a background refresh. Keep `configure()` outside render loops; configure before `prepare()`.
A provider instance keeps its initial options until disposed; do not rotate client IDs during a session.

<a id="firebase"></a>
## 🚀 Firebase handoff&nbsp;[#](#firebase)

The consuming app initializes Firebase and supplies its `Auth` instance. This function works with both web flows and native credentials:

```ts
import { auth, AuthProvider } from 'capacitor-auth-manager';
import { GoogleAuthProvider, signInWithCredential, signOut, type Auth } from 'firebase/auth';

export async function signInGoogle(firebaseAuth: Auth) {
  const { credential } = await auth.signIn(AuthProvider.GOOGLE);
  const { idToken, accessToken } = credential;
  if (!idToken && !accessToken) throw new Error('Google returned no usable credential');
  try {
    return await signInWithCredential(
      firebaseAuth,
      GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null),
    );
  } catch (error) {
    await auth.signOut().catch(() => undefined);
    throw error;
  }
}

export async function signOutGoogle(firebaseAuth: Auth) {
  // Attempt both sign-outs; failure in one must not skip the other.
  const results = await Promise.allSettled([signOut(firebaseAuth), auth.signOut()]);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') throw failed.reason;
}
```

Use Firebase's `onAuthStateChanged` to drive protected routes and your app's authenticated UI.
The package's `user` and `isAuthenticated` indicate the local Google flow, not a verified Firebase session.
For authenticated backend requests, get a **Firebase** ID token from `firebaseAuth.currentUser.getIdToken()`;
`auth.getIdToken()` returns a **Google** ID token and is not interchangeable with it.

<a id="platform-setup"></a>
## 📱 Platform setup&nbsp;[#](#platform-setup)

| Platform | Required configuration |
|---|---|
| Web | Enable Google in Firebase Auth. Register production and development origins on the Web OAuth client and app domains in Firebase Auth. Load GIS from `https://accounts.google.com/gsi/client`; allow the Google endpoints required by your CSP. Popup flows require a click and appropriate COOP settings. |
| Android | Register the exact application ID and debug, release, and Play App Signing SHA-1/SHA-256 fingerprints. Use the Web OAuth client ID as `serverClientId`. A Google account/Play Services must be available. `google-services.json` belongs to the consuming Firebase app configuration, not this package. |
| iOS | Register the exact bundle ID and iOS OAuth client. Set `iosClientId` or `GIDClientID`, and the reversed iOS client ID in `CFBundleURLTypes`. CocoaPods consumers use GoogleSignIn 10.x; set the deployment target to iOS 15 or later. With Capacitor 8 use `yarn cap add ios --packagemanager CocoaPods`; this package currently has no Swift Package Manager manifest. |

[Web](https://capacitor-auth-manager-docs.aoneahsan.com/platforms/web),
[Android](https://capacitor-auth-manager-docs.aoneahsan.com/platforms/android), and
[iOS](https://capacitor-auth-manager-docs.aoneahsan.com/platforms/ios) cover the native steps.

<a id="tokens-and-state"></a>
## 🧩 Tokens and state&nbsp;[#](#tokens-and-state)

| Flow | Credential fields |
|---|---|
| Web `webFlow: 'popup'` | `accessToken`; no `idToken` or refresh token |
| Web `webFlow: 'one-tap'` | `idToken`; no access token |
| Web `webFlow: 'auto'` (default) | One-Tap ID token or popup access token; suppression may require another click to open a popup |
| Android | `idToken`; no access token/server auth code from the sign-in call |
| iOS | `idToken`, `accessToken`, optional `serverAuthCode` when configured |

`auth.getIdToken({forceRefresh: true})` can prompt again. A popup-only web session has no Google ID token.
Use Firebase for background app-session refresh; avoid calling Google interactive refresh on a timer.
`auth.signOut()` clears the package's local session; also sign out Firebase as shown above.
Android `revokeAccess()` clears local/Credential Manager state, not Google's server-side grant.
Account linking, account deletion, and profile updates in Firebase belong to Firebase's API.

Default JS storage persists profile metadata, never token strings. Android credentials are kept in process memory;
iOS relies on GoogleSignIn's SDK Keychain and no longer duplicates credentials in UserDefaults.
The major upgrade removes the package's legacy Android credential store and iOS credential copies; users may need to sign in again.
`CapacitorPreferencesStorage` is not encrypted secure storage. If your app persists secrets, it owns a reviewed Keychain/Keystore adapter.
A cached profile is not an authorization decision. Firebase/server verification is required.

<a id="errors-and-security"></a>
## 🚑 Errors and security&nbsp;[#](#errors-and-security)

| Signal | App action |
|---|---|
| `USER_CANCELLED`, `POPUP_CLOSED_BY_USER` | Return to the idle sign-in UI |
| `POPUP_BLOCKED` | Retry from a fresh click with `webFlow: 'popup'`; preload via `prepare()` |
| `MISSING_CONFIGURATION` | Correct client IDs/native setup; do not retry in a loop |
| `NETWORK_ERROR`, SDK load failure | Show a translated retry action after connectivity recovers |
| `OPERATION_NOT_ALLOWED` during sign-in | An operation is already pending; keep the button disabled |
| `INVALID_TOKEN`, `INVALID_NONCE`, `TOKEN_EXPIRED` | Reject the credential and reauthenticate |
| `PROVIDER_NOT_ENABLED` | Use Google; other providers are roadmap code |

Use `isAuthError(error)` and `AuthErrorCode` to map errors to the app's i18n keys. Catch rejected event-handler
promises; never log credentials, tokens, or client secrets. The browser validates issuer, audience, subject,
expiry, a configured nonce, and a configured Workspace domain, but does not verify JWT signatures.
Google/Firebase/server verification establishes trust. Never send an OAuth access token to an ID-token-only backend.

For a custom ID-token backend, choose the One-Tap/native ID-token path, require `credential.idToken`, verify
signature/issuer/audience/expiry/nonce on the server, and issue your own session. Do not decode a token and trust its claims.

<a id="acceptance"></a>
## 🧪 App acceptance checks&nbsp;[#](#acceptance)

Verify a fresh sign-in, returning sign-in, cancel/retry, blocked popup, offline/retry, cold restart, token expiry,
and sign-out on each deployed platform. Verify release signing fingerprints and production origins, not only debug setup.
Confirm Firebase receives the expected user, protected routes follow Firebase state, and storage/logs contain no secret tokens.
Native compile checks and mocked Google tests cannot certify your OAuth configuration or a real-device sign-in.

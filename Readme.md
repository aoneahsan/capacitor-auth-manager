# Capacitor Auth Manager

Firebase-agnostic **Google authentication** for Capacitor + web — a drop-in alternative to
`@codetrix-studio/capacitor-google-auth`. One API (`signIn(AuthProvider.GOOGLE)`) returns a Google
credential `{ idToken, accessToken?, serverAuthCode?, user }` on **web, iOS and Android**; your app feeds
the `idToken` into Firebase (or anything else). Works with React, Vue, Angular, and vanilla JS.

> **Status (2.4.x): Google-first.** The package is being brought to production **one provider at a time**.
> Right now **Google is enabled** (web + iOS + Android). The other 14 providers' code lives in the repo but
> is un-registered — calling them throws `AuthErrorCode.PROVIDER_NOT_ENABLED` — and each is re-enabled and
> verified on device one at a time. See the [changelog](./CHANGELOG.md).

## Why this exists

For native Google sign-in in a Capacitor app you normally reach for `@codetrix-studio/capacitor-google-auth`.
This package does the same job (native Google ID token → your Firebase `signInWithCredential`) but is yours
to maintain, uses the modern **Android Credential Manager** and **GoogleSignIn** SDKs, keeps the **same call
on every platform**, and stays **Firebase-agnostic** (no `firebase` dependency pulled in).

## Install

```bash
npm install capacitor-auth-manager
# then, for the native plugin:
npx cap sync
```

`@capacitor/core` is an optional peer — needed only for the native (iOS/Android) plugin. Framework adapters
(`react` / `vue` / `@angular/core`) are optional peers too; install only what you use.

## Provider support

| Provider | Web | iOS | Android | Status |
|---|---|---|---|---|
| **Google** | ✅ GIS id-token | ✅ GoogleSignIn | ✅ Credential Manager | **Enabled** |
| Apple, Microsoft, Facebook, GitHub, Slack, LinkedIn, Firebase, Magic-link, SMS, Email/Phone/Username+password, Email-code, Biometric | — | — | — | ⏳ coming, one at a time (`PROVIDER_NOT_ENABLED`) |

## Quick start

Configure once, then sign in. Use the exported **`AuthProvider` enum** (recommended — typo-safe; the plain
string `'google'` also works).

```ts
import { auth, AuthProvider } from 'capacitor-auth-manager';

auth.configure({
  providers: {
    [AuthProvider.GOOGLE]: {
      clientId: 'YOUR_WEB_OAUTH_CLIENT_ID',        // web + Android serverClientId fallback
      serverClientId: 'YOUR_WEB_OAUTH_CLIENT_ID',  // REQUIRED on Android to receive an idToken
      iosClientId: 'YOUR_IOS_OAUTH_CLIENT_ID',     // iOS (or set GIDClientID in Info.plist)
    },
  },
  persistence: 'local',
});

const result = await auth.signIn(AuthProvider.GOOGLE);
// The same field is populated on web, iOS and Android:
const idToken = result.credential.idToken;
```

### Hand the credential to Firebase (identical on every platform)

```ts
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

const result = await auth.signIn(AuthProvider.GOOGLE);
await signInWithCredential(
  getAuth(),
  GoogleAuthProvider.credential(result.credential.idToken),
);
```

### React

```tsx
import { useAuth, AuthProvider } from 'capacitor-auth-manager/react';

function LoginButton() {
  const { user, signIn, signOut } = useAuth();
  if (user) return <button onClick={() => signOut()}>Sign out</button>;
  return <button onClick={() => signIn(AuthProvider.GOOGLE)}>Sign in with Google</button>;
}
```

`useAuth()` also returns `isLoading`, `isAuthenticated`, `error`, `refreshToken`, `getIdToken`, and
`revokeAccess`. Vue (`capacitor-auth-manager/vue`) and Angular (`capacitor-auth-manager/angular`) expose the
same surface as composables / an injectable `AuthService`; both re-export `AuthProvider`.

## What you get back

`signIn` resolves to an `AuthResult`:

```ts
{
  user: { uid, email, emailVerified, displayName, photoURL, providerData: [...], metadata: {...} },
  credential: {
    providerId: 'google.com',
    signInMethod: 'google.com',
    idToken?: string,        // present on web, iOS, Android
    accessToken?: string,    // iOS; web/Android: see notes below
    serverAuthCode?: string, // iOS when serverClientId + offline access; exchange on YOUR server only
  },
}
```

Per-platform token availability (honest):

- **Web** (Google Identity Services id-token flow): returns **`idToken`** only — no `accessToken`. If you
  need to call Google APIs from the browser, use the GIS token client separately.
- **iOS** (GoogleSignIn): `idToken` + `accessToken` (+ `serverAuthCode` when `serverClientId` is set).
- **Android** (Credential Manager): returns **`idToken`** reliably. `accessToken` / `serverAuthCode` require
  the separate Google Authorization API and are not returned by the sign-in call (planned).

For the Firebase `signInWithCredential` handoff, the **`idToken` is all you need** on every platform.

## Native setup

### Android

1. In Google Cloud / Firebase, create an **Android** OAuth client and add your app's **SHA-1/SHA-256**
   signing fingerprints; create (or reuse) a **Web** OAuth client.
2. Pass that **Web** client id as `serverClientId` (Credential Manager needs it to return an idToken).
3. Add your app's `google-services.json` to the Android project as usual.
4. The device must have a Google account signed in (Credential Manager shows that account chooser).

No extra AndroidManifest permissions are required by this plugin.

### iOS

1. Create an **iOS** OAuth client in Google Cloud.
2. Add `GIDClientID` (your iOS client id) to `Info.plist`, or pass it as `iosClientId`.
3. Add the **reversed client id** as a URL scheme in `Info.plist` → `CFBundleURLTypes`
   (e.g. `com.googleusercontent.apps.XXXX`).
4. For a `serverAuthCode`, also set `serverClientId` (your Web client id).

### Capacitor config

You can also set the Google options in `capacitor.config` under the plugin block instead of `auth.configure`.

## Migrating from `@codetrix-studio/capacitor-google-auth`

```ts
// before
await GoogleAuth.initialize({ clientId });
const u = await GoogleAuth.signIn();
await signInWithCredential(getAuth(), GoogleAuthProvider.credential(u.authentication.idToken));

// after
import { auth, AuthProvider } from 'capacitor-auth-manager';
auth.configure({ providers: { [AuthProvider.GOOGLE]: { clientId, serverClientId, iosClientId } } });
const res = await auth.signIn(AuthProvider.GOOGLE);
await signInWithCredential(getAuth(), GoogleAuthProvider.credential(res.credential.idToken));
```

The id token moves from `result.authentication.idToken` to `result.credential.idToken`. Everything else
(the native account chooser, the Firebase handoff) behaves the same.

## Configuration (`GoogleAuthOptions`)

| Option | Where | Purpose |
|---|---|---|
| `clientId` | web (required), Android fallback | Web OAuth client id; the id token's `aud`. |
| `serverClientId` | Android (required for idToken), iOS | Web OAuth client id for Credential Manager / `serverAuthCode`. |
| `iosClientId` | iOS | iOS OAuth client id (or set `GIDClientID` in Info.plist). |
| `scopes` | all | Extra OAuth scopes (default `openid email profile`). |
| `hostedDomain` / `loginHint` | all | Restrict to a Workspace domain / prefill an account. |
| `filterByAuthorizedAccounts`, `autoSelectEnabled` | Android | Credential Manager UX (returning-user / one-tap auto-select). |
| `nonce` | web | Bind the request to an id-token `nonce` claim (validated). |

## Security & storage

- **No secrets are persisted by default.** Short-lived id tokens are re-derived from the Google SDK's silent
  restore rather than written to `localStorage` / `@capacitor/preferences`. Inject a `StorageInterface`
  (ideally Keychain/Keystore-backed) if you need token persistence at rest.
- The web flow uses the GIS **id-token** flow specifically so **no client secret and no backend** are
  required. A `serverAuthCode` (iOS) must be exchanged on **your** server, never in the browser.
- The package does not verify id-token signatures in the browser — validate the id token server-side (or via
  Firebase) before trusting its claims.

## Caveats

- The iOS (Swift) and Android (Java) sources are written to the official SDK contracts but are **not compiled
  in CI**. Validate a new version in **one** app (web + one Android device + one iOS device) before rolling
  out to many apps.
- Web Google sign-in uses One-Tap / FedCM `prompt()`; if One-Tap is suppressed (cooldown), render Google's
  official button via the provider's `renderButton(element)` escape hatch, or use your own Firebase popup on web.

## Contributing & support

- [Contributing](./.github/CONTRIBUTING.md) · [Security policy](./.github/SECURITY.md) ·
  [Support](./.github/SUPPORT.md) · [Changelog](./CHANGELOG.md)
- Docs: https://github.com/aoneahsan/capacitor-auth-manager-docs
- Author: Ahsan Mahmood — aoneahsan@gmail.com — https://aoneahsan.com

## License

[MIT](./LICENSE) © 2024–2026 Ahsan Mahmood

## Links

- npm: https://www.npmjs.com/package/capacitor-auth-manager
- Repository: https://github.com/aoneahsan/capacitor-auth-manager

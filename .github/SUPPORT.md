# Support

## Getting help

- **Docs:** https://github.com/aoneahsan/capacitor-auth-manager-docs (API reference + guides)
- **Issues:** search [existing issues](https://github.com/aoneahsan/capacitor-auth-manager/issues) first;
  open a new one with the issue templates if your question isn't answered.
- **Security:** see [SECURITY.md](./SECURITY.md) — do not file security reports as public issues.

## Before opening an issue

For Google sign-in problems, please include:

- platform (web / iOS / Android) and OS version,
- the package version (`npm ls capacitor-auth-manager`),
- your `auth.configure` options **with secrets redacted** (clientId/serverClientId presence, not values),
- the exact error `code` (e.g. `AuthErrorCode.PROVIDER_NOT_ENABLED`) and message,
- on Android: whether a Google account is signed in on the device and whether `serverClientId` is the
  **Web** OAuth client id; on iOS: whether `GIDClientID` + the reversed-client-id URL scheme are set.

## Commercial / direct contact

Ahsan Mahmood — aoneahsan@gmail.com — https://aoneahsan.com

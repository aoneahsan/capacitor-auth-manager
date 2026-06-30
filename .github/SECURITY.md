# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Email **aoneahsan@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce (or a proof of concept), and
- the affected version(s).

You'll get an acknowledgement as soon as possible, and a fix or mitigation plan once the report is
triaged.

## Scope notes

`capacitor-auth-manager` is **Firebase-agnostic**: it returns a Google credential
(`{ idToken, accessToken?, serverAuthCode?, user }`) to your app and does **not** manage your Firebase
session. A few security-relevant design points:

- **No secrets are persisted by default.** Short-lived tokens are re-derived from the platform Google
  SDK's silent restore rather than written to `localStorage` / `@capacitor/preferences`. If you inject a
  storage adapter, prefer a hardware-backed one (Keychain / Keystore).
- **Never put an OAuth client secret in client code.** The web flow uses the Google Identity Services
  id-token flow precisely so no secret or backend is required. `serverAuthCode` (when present) must be
  exchanged on **your** server, never in the browser.
- Always validate the returned `idToken` server-side (or via Firebase) before trusting it.

## Supported versions

The latest published `2.4.x` release receives security fixes.

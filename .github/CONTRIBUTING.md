# Contributing to capacitor-auth-manager

Thanks for your interest in improving the package! It's MIT-licensed and contributions are welcome.

## Project status

The package is being brought to production **one provider at a time**. As of `2.4.x` only **Google** is
enabled (web + iOS + Android); the other providers' implementations live in the repo but are
un-registered and excluded from the published build. They are re-enabled, hardened and verified one at a
time. PRs that harden the Google path or prepare the next provider are especially welcome — please open an
issue first so we can agree on scope and avoid duplicated work.

## Development setup

```bash
# Node >= 18, npm is fine for the library build
npm install
npm run build      # clean + tsc + rollup
npm run lint       # eslint (must be 0 errors / 0 warnings)
npm run prettier   # format
```

There is **no automated test suite** (auth flows are validated manually on real devices). Please verify
your change builds and lints cleanly, and—if it touches native code—describe how you tested it on a
device.

## Ground rules

- **TypeScript:** strict, no `any`, absolute imports, `export type` for type-only exports.
- **Tree-shaking:** keep `sideEffects: false`; providers load via dynamic import — don't add eager imports.
- **No secrets / no Firebase coupling.** The package returns a credential; the app owns Firebase.
- **Logging:** use the package logger, never `console.*` directly.
- **Native parity:** if you change a Google behavior on one platform, check whether the web / iOS / Android
  equivalents need the same change.
- **Conventional commits** for messages (`feat:`, `fix:`, `docs:`, `chore:` …).

## Pull requests

1. Fork + branch from `main`.
2. Keep the change focused; update `CHANGELOG.md` and relevant docs in the same PR.
3. Ensure `npm run build` and `npm run lint` are clean.
4. Open the PR with a clear description and testing notes.

## Reporting bugs / requesting features

Use the issue templates. For security issues, see [SECURITY.md](./SECURITY.md) (do not open a public issue).

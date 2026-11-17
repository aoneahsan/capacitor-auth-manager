# Native Update v4 integration and migration

Verify volatile facts against `~/.claude/rules/native-update-package.md` when present.

## Contents

- [Install and platform floor](#install-and-platform-floor)
- [Environment and initialization](#environment-and-initialization)
- [Foreground update flow](#foreground-update-flow)
- [Advanced manual download](#advanced-manual-download)
- [v3 to v4 migration](#v3-to-v4-migration)
- [Rollback and verification](#rollback-and-verification)
- [Publishing](#publishing)

## Install and platform floor

```bash
yarn add native-update @capacitor/filesystem @capacitor/preferences
yarn cap sync
```

Use Capacitor 8, Node 24.16+, Java 21, Android min API 26 with compile/target 36, and iOS 14+. Rebuild the
native shell after installing or upgrading; OTA cannot replace native plugin code.

## Environment and initialization

```bash
VITE_NATIVE_UPDATE_API_URL=https://nativeupdatebe.aoneahsan.com/api
VITE_NATIVE_UPDATE_API_KEY=nu_app_…
VITE_NATIVE_UPDATE_PUBLIC_KEY=
```

The `nu_app_` key is client-shippable after applying web-origin or Android/iOS client restrictions. The public
key is not secret. Keep empty values supported: missing production configuration means OTA off.

```ts
export async function initOta() {
  if (!Capacitor.isNativePlatform()) return;

  const apiKey = import.meta.env.VITE_NATIVE_UPDATE_API_KEY;
  const publicKey = import.meta.env.VITE_NATIVE_UPDATE_PUBLIC_KEY;
  if (!apiKey || !publicKey) return;

  await NativeUpdate.initialize({
    filesystem: Filesystem,
    preferences: Preferences,
    appId,
    serverUrl: import.meta.env.VITE_NATIVE_UPDATE_API_URL,
    apiKey,
    publicKey,
    channel: 'production',
    requireSignature: true,
    enableSignatureValidation: true,
    enableDeltaUpdates: true,
    autoCheck: false,
    autoUpdate: false,
  });

  await NativeUpdate.notifyAppReady();
}
```

Call this once per boot before starting an update check. Do not hide `notifyAppReady()` behind authentication,
a route, or an optional feature flag. Configuration is immutable after initialization; use `reset()` and one
fresh initialization to change a locked field.

## Foreground update flow

Start this after first paint without awaiting it in the boot-critical path:

```ts
export async function checkAndApplyUpdate() {
  if (!Capacitor.isNativePlatform() || !otaConfigured) return;

  const update = await NativeUpdate.checkForUpdate();
  if (!update.available) return;

  const accepted = update.mandatory || (await Dialog.confirm({
    title: 'Update available',
    message: update.notes ?? 'A new version is ready to install.',
  })).value;
  if (!accepted) return;

  await NativeUpdate.downloadUpdate();
  await NativeUpdate.applyUpdate();
}
```

`downloadUpdate()` without options fetches the complete current manifest. When it contains a compatible
`NUDELTA/1` patch, the client validates the patch checksum, source checksum, operation bounds, target size,
and final checksum. Any failure uses the signed full bundle instead.

## Advanced manual download

Use the manual path only for custom progress/state UX. Preserve every security/delta field:

```ts
const update = await NativeUpdate.checkForUpdate();
if (update.available && update.url && update.latestVersion && update.checksum) {
  const bundle = await NativeUpdate.download({
    url: update.url,
    version: update.latestVersion,
    checksum: update.checksum,
    signature: update.signature,
    signatureAlgorithm: update.signatureAlgorithm,
    delta: update.delta,
  });
  await NativeUpdate.set(bundle);
  await NativeUpdate.reload();
}
```

The URLs are short-lived signed backend URLs; download promptly and never cache a manifest as release state.

## v3 to v4 migration

1. Upgrade the native platform/toolchain floors and rebuild the installed binary.
2. Configure an RSA public key. v4 production accepts only `RSA-SHA256` (PKCS#1 v1.5 with SHA-256).
3. Remove runtime reconfiguration. `setUpdateUrl()` does nothing; use `reset()` then initialize again.
4. Replace RSA-PSS/ECDSA claims or keys with supported RSA signing.
5. Prefer the convenience update methods so `signatureAlgorithm` and `delta` cannot be dropped.
6. For intentionally unsigned local fixtures, set both `requireSignature:false` and
   `allowUnsignedDevelopmentUpdates:true`. Release builds still reject them and HTTPS stays mandatory.

## Rollback and verification

| Event | Result |
|---|---|
| Healthy boot calls `notifyAppReady()` | Pending bundle is confirmed |
| Two cold starts do not confirm | Previous bundle is restored |
| Boot checksum/signature fails | Immediate rollback |
| Delta validation fails | Signed full bundle is downloaded |

Place `native-update-implementation-testing-t{X}` in the footer and bump it for each test build. Verify full
download, delta success, deliberately invalid delta fallback, checksum/signature rejection, and rollback on
physical Android and iOS devices.

## Publishing

```bash
export NATIVE_UPDATE_TOKEN="$(grep -oE 'nu_pat_[A-Za-z0-9_]+' ~/.secrets/native-update/management-access-token | head -1)"
npx native-update deploy ./dist --app com.example.app --version 1.0.1 --wait
```

Use `--wait` in CI so a failed queued job exits non-zero. A 202 response is accepted, not live; only active
builds reach devices. Provisioning apps, `nu_app_` keys, signing keys, and private keystore backups is covered
by `aoneahsan-cccs-native-update-management-api`.

If the package/platform misbehaves, record the consumer issue at `docs/NATIVE_UPDATE_PACKAGE_ISSUES.md` and
file the full reproduction in the package repo's `docs/REPORTED-ISSUES.md`.

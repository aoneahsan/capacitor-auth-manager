# Disabled native providers (iOS)

These Swift implementations are kept for reference / future re-enablement but are intentionally
**outside the pod source** (`podspec` source_files is `ios/Plugin/**`) and **not shipped** in the npm
tarball (`files` ships only `ios/Plugin/`). As of 2.4.x the plugin is Google-only, so the pod no longer
depends on the Facebook SDK (FBSDKLoginKit) or MSAL.

To re-enable a provider: move its file back to `ios/Plugin/`, restore its `case` in
`CapacitorAuthManager.swift`'s `createProvider`, re-add its pod dependency in the podspec, harden it, and
verify the build + on device.

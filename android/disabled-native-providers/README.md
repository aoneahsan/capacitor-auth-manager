# Disabled native providers (Android)

These native provider implementations are kept for reference and future re-enablement but are
intentionally **outside the compiled source set** (`src/main/java`) and **not shipped** in the npm
tarball (`files` ships only `android/src/main/`). As of 2.4.x the plugin is Google-only.

To re-enable a provider: move its file back under
`src/main/java/com/aoneahsan/capacitor_auth_manager/`, restore its case in `ProviderFactory.java`,
re-add its dependency in `build.gradle`, harden it, and verify the build + on device.

# Overview — `aoneahsan-cccs-capacitor-packages-setup`

## Purpose

The package and configuration baseline for a React + Capacitor project — used both when setting one up and
when auditing an existing one before release. It is the checklist that answers "is this project actually
wired correctly?"

## What this skill does

- Establishes **strata-storage as the storage layer**, replacing `localStorage`, `@capacitor/preferences`,
  IndexedDB, cookies and session storage, and explicitly marks this as superseding the older
  Preferences-based rule while grandfathering existing projects.
- Requires all storage access to flow through a single adapter module so the migration is a one-file change.
- Lists the **official plugin set**, split into the always-useful and the only-if-the-feature-exists groups,
  with the reminder that each of the latter costs a permission.
- Flags **`@ionic/pwa-elements`** as required for official plugins to work on web at all.
- Lists the **Capawesome additions** and requires removing any that duplicate an official plugin.
- Carries the two edge-to-edge traps: adding the plugin requires disabling core `SystemBars` insets handling,
  and `android.includePlugins` is a strict allowlist that renders an omitted plugin inert.
- Covers **native-update** for OTA with its verification-marker practice.
- Fixes the auth and push choices, and names the two banned Capacitor Firebase packages.
- Requires auditing the **merged** manifest for permissions.

## When it gets invoked

- Setting up a new React project, or adding Capacitor to one.
- Auditing an existing project before release or as part of finalisation.
- Adding a native capability — camera, geolocation, push, scanning.
- Choosing a storage API, or migrating off `localStorage`.
- Reviewing which plugins a project actually needs.

## Where it applies

Every React + Capacitor project.

## Sources

`_source-understanding/projects/ztools-capacitor-android.md` (the shipped stack, and the four gaps against the
current standard) and `_source-understanding/files/prompt-logs.md` (the owner's explicit brief naming
strata-storage, native-update, pwa-elements and the minimum-permissions requirement).

## Related skills

`aoneahsan-cccs-capacitor` (config and day-to-day use) · `-android-finalization` (permissions and shipping) ·
`-native-update` · `-react-state-zustand` (the storage adapter) · `-packages-up-to-date`.

## Maintenance

⚠️ ztools — the reference project — does **not** yet meet four items here (no strata-storage, no
native-update, no pwa-elements, iOS removal half-done). Recorded in its understanding record as findings, not
fixed.

# Overview — `aoneahsan-cccs-native-update`

## Purpose

Integrate or migrate the owner's `native-update` v4 package in a Capacitor app so signed web-layer releases
arrive through verified full or delta delivery and survive the rollback-confirmation contract.

## What this skill does

- Applies the v4 platform floor and prevents a v4 web/native-shell mismatch.
- Establishes RSA-SHA256 production signing and the explicit debug-only unsigned escape hatch.
- Uses locked initialization, the canonical `/api` base, and immediate `notifyAppReady()` on every boot.
- Prefers the delta-aware convenience flow and preserves signature/delta metadata in custom flows.
- Enforces optional-versus-mandatory update UX, first-delivery constraints, and physical-device verification.
- Routes consumer and package-repository issues into their fixed records.

## When it gets invoked

- Adding Native Update to a Capacitor application or upgrading v3 to v4.
- Implementing foreground/manual OTA prompts or a release marker.
- Debugging update-check, signature, delta fallback, apply/reload, or rollback behavior.
- Determining whether a change can ship OTA or still requires a native store release.

## Sources and siblings

Current source map: `_source-understanding/projects/native-update-platform.md`. Living contract:
`~/.claude/rules/native-update-package.md`. Management/release automation:
`aoneahsan-cccs-native-update-management-api`. Issue filing: `aoneahsan-cccs-report-project-issues`.

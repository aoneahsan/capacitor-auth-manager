# Capacitor Auth Manager iOS plugin

**Updated:** 2026-10-13. This guide covers `ios/`; `CLAUDE.md` links here. Read the package root
guide, active Swift Google provider, podspec and native smoke script before work. Context next
eligible 2026-11-12.

GoogleSignIn is the enabled native provider. Other provider files under
`disabled-native-providers/` are historical source and must stay out of the shipped target until
one provider is deliberately re-enabled and tested across all layers. Preserve the documented
iOS minimum and avoid Firebase coupling or token logging. Run package checks and clean iOS
simulator compilation where available; a real OAuth flow still needs a device and configured
client IDs.

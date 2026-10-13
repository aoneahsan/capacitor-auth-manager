# Capacitor Auth Manager Android plugin

**Updated:** 2026-10-13. This guide covers `android/`; `CLAUDE.md` links here. Read the package
root guide, Google plugin Java source, Gradle configuration and native smoke script before work.
Context next eligible 2026-11-12.

Google uses Android Credential Manager. Other provider sources under `disabled-native-providers/`
are retained but not compiled. Keep Java/Gradle changes compatible with the supported Capacitor 8
consumer and the documented JDK/SDK pins in `docs/PACKAGES.md`. The package must not depend on
Firebase or expose credentials in logs. Run package build/tests and clean native debug/minified
release smoke before a version change; compilation does not prove real sign-in on a device.

# Packages (npm) and their websites

A package cannot update itself in someone else's app, so its update flow is the channel that reaches the people
using it:

- **A broken or insecure release is deprecated** the day it is found
  (`npm deprecate <pkg>@<range> "<reason, the version to move to>"`; `aoneahsan-cccs-packages-up-to-date`), so
  every install and `npm outdated` shows the warning.
- **Breaking changes ship a migration section** in the README and CHANGELOG, and are announced in the release
  newsletter.
- **When the package talks to our own backend** (native-update, FilesHub clients), the backend answers outdated
  clients with a machine-readable `minClientVersion`. The package logs it once at warn level and exposes it
  through its API, so the consuming app can show its own notice.
- **The package's website and docs site are web products** and follow `web.md` and the layer 2 contract.

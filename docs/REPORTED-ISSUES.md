# Reported issues

Open entries below. Resolved entries remain in [RESOLVED-ISSUES.md](./RESOLVED-ISSUES.md).

### ISSUE-009 — docs site: wrong web token claim, stale Android FAQ, theme and font not applied
- **Found:** 2026-11-03, LinkedIn card captures (docs build `main.85291707.js`).
- `/providers/overview` line 40 says `result.credential.idToken` is populated on web; the web popup returns no ID token.
  The `/platforms/android` Firebase snippet passes only `idToken`.
- FAQ line 16 says the package uses Credential Manager; since 3.1.0 Android tries GoogleSignIn first.
- The dark theme renders Infima's `#1b1b1d`, not the `#0b1220` declared in `custom.css:44-45`.
- `custom.css:23` names Inter but the font is never loaded, so pages render in the system font.
- **2026-11-09 progress:** Corrected token, peer, Android-flow and CI copy. Changed the dark selector to
  `html[data-theme='dark']` so it wins over Infima's equally targeted rule, and bundled Inter's Latin
  weights 400/500/600/700. The docs build passes; browser preview and live verification are still due.
- **Priority:** medium for the two content errors (developers copy them), low for theme and font.

### ISSUE-010 — Android build prints a deprecated-API note from `GoogleLegacySignIn.java`
- **Found:** 2026-11-04, the November package release pass; reported downstream in every consumer's Android build.
- **Where:** `android/src/main/java/com/aoneahsan/capacitor_auth_manager/GoogleLegacySignIn.java:7-14` imports
  `com.google.android.gms.auth.api.signin.*` from `play-services-auth:21.6.0` (`android/build.gradle`). Google
  deprecated that API, and 22.0.0 removed it.
- **Why it was not removed:** it is the FIRST path of the default `androidFlow: 'auto'`
  (`GoogleAuthProvider.java:14-24`). 3.0.0 used Credential Manager alone, and Play-installed production builds were
  refused before any account picker appeared (RESOLVED-ISSUES, the 3.1.0 fix). Dropping the legacy path brings
  that failure back. Hiding the note with `@SuppressWarnings` would be suppression, not a fix.
- **Fix plan:** (1) add device-side telemetry for which path signed the user in (`legacy` vs `credential-manager`) and
  the Credential Manager exception class when it fails, through the existing `AuthLogger`/result mapper; (2) on
  Play-installed builds of two production apps, test Android 14+ devices with Google enabled and disabled as the
  credential provider; (3) if Credential Manager passes, flip `auto` to Credential Manager first with the legacy
  fallback (minor), then remove `GoogleLegacySignIn` and `play-services-auth` in the next major. If it still
  fails without UI, keep the legacy path until Google ships a supported silent ID-token API, and re-check on every
  `play-services-auth` and `androidx.credentials` release.
- **Priority:** low (build note only; sign-in works). Needs the owner for the Play-installed device test.

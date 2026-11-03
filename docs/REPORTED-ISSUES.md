# Reported issues

No open issues. Resolved entries remain in [RESOLVED-ISSUES.md](./RESOLVED-ISSUES.md).

### ISSUE-008 — README version and CI statements are stale
- **Found:** 2026-11-03, while writing the LinkedIn series from the code.
- `README.md:34` and `:469` still show 3.0.0 (npm and package.json are 3.1.1), the same drift as ISSUE-006.
- `README.md:118`, `:424` and `:486-487` describe CI and pull-request review; commit `4f6110a` removed every GitHub
  workflow on 2026-10-31.
- **Fix:** derive the version from package.json (or a release check), and describe the local gates instead of CI.
  **Priority:** medium (npm page text).

### ISSUE-009 — docs site: wrong web token claim, stale Android FAQ, theme and font not applied
- **Found:** 2026-11-03, LinkedIn card captures (docs build `main.85291707.js`).
- `/providers/overview` line 40 says `result.credential.idToken` is populated on web; the web popup returns no ID token.
  The `/platforms/android` Firebase snippet passes only `idToken`.
- FAQ line 16 says the package uses Credential Manager; since 3.1.0 Android tries GoogleSignIn first.
- The dark theme renders Infima's `#1b1b1d`, not the `#0b1220` declared in `custom.css:44-45`.
- `custom.css:23` names Inter but the font is never loaded, so pages render in the system font.
- **Priority:** medium for the two content errors (developers copy them), low for theme and font.

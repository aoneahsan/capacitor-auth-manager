# Reported issues

No open issues. Resolved entries remain in [RESOLVED-ISSUES.md](./RESOLVED-ISSUES.md).

### ISSUE-008 — README version and CI statements are stale
- **Found:** 2026-11-03, while writing the LinkedIn series from the code.
- `README.md:34` and `:469` still show 3.0.0 (npm and package.json are 3.1.1), the same drift as ISSUE-006.
- `README.md:118`, `:424` and `:486-487` describe CI and pull-request review; commit `4f6110a` removed every GitHub
  workflow on 2026-10-31.
- **Fix:** derive the version from package.json (or a release check), and describe the local gates instead of CI.
  **Priority:** medium (npm page text).

# Reported issues

### ISSUE-008 — Rendered Google button cannot return its ID token after One-Tap is suppressed

**Status:** Fix prepared; awaiting package release · **Reported:** 2026-11-09 · **Affects:** `capacitor-auth-manager@3.1.1`, Google web provider

**Symptom** — An ID-token-only backend cannot use the OAuth2 popup's access token. After One-Tap is
suppressed, selecting the rendered Google button does not settle the sign-in promise.

**Cause** — The `one-tap` flow rejects a suppressed prompt and clears its credential resolver. The
button shares Google's credential callback, which then ignores the later ID token.

**Fix prepared** — `webFlow: 'button'` arms a bounded ID-token wait without opening One-Tap. The
rendered-button example uses that flow. A regression test covers suppression followed by the button.

Resolved entries remain in [RESOLVED-ISSUES.md](./RESOLVED-ISSUES.md).

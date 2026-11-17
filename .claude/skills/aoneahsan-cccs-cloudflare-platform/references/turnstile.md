# Turnstile — end-to-end setup

Turnstile is the CAPTCHA / bot-protection of record: free, privacy-friendly, no puzzle. Set it up end to end —
a widget, a server-side siteverify check, the frontend wiring, and a real validation pass before claiming
success. Canonical: `https://developers.cloudflare.com/turnstile/`. If the docs and this file disagree, trust
the docs.

**No script files** (No-Scripts rule): run the API/`wrangler` commands directly; the source skill's helper
scripts are not reproduced here.

## The flow

1. **Auth + account.** Turnstile widget creation needs a token with `Account.Turnstile:Edit` (and
   `Account.Workers Scripts:Edit` if you deploy the siteverify Worker). Do NOT use `wrangler login` for this —
   its OAuth scope excludes those. Provide the token via `export CLOUDFLARE_API_TOKEN=…` (never pasted into a
   log) on the shared account (`CLOUDFLARE_ACCOUNT_ID` if the token spans several).
2. **Domains.** Always include `localhost` and `127.0.0.1` for dev; add the production host(s). A widget is
   scoped to its domain list.
3. **Create the widget** (managed mode) via the Cloudflare API / dashboard → get the **sitekey** (public,
   safe to ship) and the **secret** (server-only). The secret goes to `~/.secrets/` and a Worker secret —
   never to disk in the repo or the frontend bundle.
4. **siteverify runs server-side.** POST `cf-turnstile-response` + the secret to
   `https://challenges.cloudflare.com/turnstile/v0/siteverify`; act only on `success === true`. On the
   owner's stack this is a Cloudflare Worker (`{project}-turnstile-siteverify`) holding
   `TURNSTILE_SECRET_KEY` via `wrangler secret put` — see `aoneahsan-cccs-cloudflare-workers`.
5. **Frontend.** Render the widget (`<div class="cf-turnstile" data-sitekey="…">` + the Turnstile script) and
   **gate the existing submit handler on the verified response** — keep the existing handler logic; only add
   the gate. In a browser extension, a remote `<script>` violates MV3 — Turnstile there needs a different
   approach; confirm before assuming it fits.
6. **Validate for real.** Load the form, complete the widget, confirm siteverify returns `success: true` and
   the gated action proceeds — before reporting done (`aoneahsan-cccs-verification`).

## Notes

- **Managed mode** is the default (Cloudflare decides interactive vs invisible). Use non-interactive/invisible
  only with a reason.
- Zero-cost: Turnstile's free tier covers all our use; never a paid CAPTCHA.
- Rotate the secret if it ever lands in a shared log.

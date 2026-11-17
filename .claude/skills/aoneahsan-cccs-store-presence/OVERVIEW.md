# Store presence — overview

## Purpose

Stops any record from saying an app is on a store unless the owner's own developer page lists it, and makes
sure every app that is listed carries its real link. Created on 2026-09-17 after the CV said LifeWell's
Android app was "waiting for its Play upload" while it was live, and older records carried Play links for
apps that were never published. The owner's words: confirm whether a project's Android app is live on his
developer accounts, and when it is, fetch and record its URL properly, so he never has to repeat it.

## What this skill does

- Reads the owner's store developer accounts from `~/.claude/policy/store-developer-accounts.json`.
- Fetches each developer page and collects the application ids it lists.
- Matches a project's `applicationId` and returns live, not listed, or unknown.
- Builds the listing URL from the account's pattern and records it on every surface that states stores.
- Removes store links for apps that are not listed, and keeps "internal testing" wording only when the
  project records it.
- Grows the registry when the owner shares a new account or a new store.

## When it gets invoked

- "is this app on Play Store?" · "it is on Play Store, put the link" · "update the Play links"
- Writing or reviewing a CV, README Links block, portfolio-info file, store listing or docs page that
  mentions a store.
- Any change that adds, removes or copies a `play.google.com` link.
- "here is our other store / our new developer account".

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every project with an Android app; browser extensions and other stores once their developer pages are registered |
| Stack override | The id comes from the stack's own declaration (Capacitor, Flutter, React Native, Tauri, bare native) |

## Sources

| Source | Record |
|---|---|
| Owner directive, 2026-09-17 (career-docs CV v2) | `career-docs/docs/decisions/DECISIONS-LOG.md` → D14, D15 |
| The account registry | `policy/store-developer-accounts.json` |

## Related skills

- `aoneahsan-cccs-android-finalization` — getting the app onto the store.
- `aoneahsan-cccs-project-understanding` — where the id and the release track are recorded.

## Maintenance

- **Living registries this skill points at:** `../../policy/store-developer-accounts.json`,
  `../../rules/publishing-compliance.md`
- **Last reviewed:** 2026-09-17

---
name: aoneahsan-cccs-store-presence
description: 'Confirming whether an Android or other store app is really live: read the owner''s developer pages from ~/.claude/policy/store-developer-accounts.json, match the project''s applicationId, record the real listing URL. Use before writing "published", "on Google Play" or "not released" in a CV, README Links block, portfolio-info, store copy or project-live-urls.json; when a Play link is added or removed; when a record disagrees with the owner; when a new developer account or store is announced.'
metadata:
  author: aoneahsan
  source: owner directive 2026-09-17 (career-docs CV v2) + policy/store-developer-accounts.json
---

# Store presence

## Overview

The owner's developer pages list exactly what is live, so they are the proof. A registry field, a docs link,
a green build or an internal-testing track is only a claim.

**The standard:** an app is live when its id appears on one of the owner's registered developer pages (or,
for an app published under a client's account, when its own listing answers 200). Nothing else proves it,
and a live app is always linked.

## When to use

- A CV, README, portfolio-info file, store copy or docs page is about to say an app is (or is not) on a store.
- A Play link is being added, removed or copied from another record.
- The owner says "it is on Play Store" and a record says otherwise, or the reverse.
- The owner shares a new developer account or a new store.

**Not for:** getting an app *onto* a store — that is `aoneahsan-cccs-android-finalization` and
`~/.claude/rules/play-store-submission.md`. This skill only reports and records what is already there.

## Before acting

Read the project's own guidance first (`aoneahsan-cccs-project-understanding`). The id and any recorded
track ("internal testing", "closed testing") come from the project; the verdict comes from the pages.

## The check

1. Read `~/.claude/policy/store-developer-accounts.json`. Every entry in `accounts` is a page to read.
2. Fetch each page with its `fetch` command and collect the ids it lists. A fetch that fails or returns no
   ids is **unknown**, never "not live" — retry, then use the browser fallback in `references/check-procedure.md`.
3. Read the project's id: `applicationId` in `android/app/build.gradle` for Capacitor, or the stack's
   equivalent (`aoneahsan-cccs-android-finalization/references/checklist.md` maps each stack).
4. **Listed** → live. The link is the account's `listingUrlPattern` with the id filled in.
5. **Not listed on any account** → not live. Print no store link. Say "internal testing" or "pending" only
   when the project's own record says so.
6. Record the answer everywhere the project states its stores (table below), in the same change.

## Where the answer goes

| Surface | What to write |
|---|---|
| career-docs fact file | `links` entry `Google Play` + `store_ids.android`; run `uv run cvgen stores --fix` |
| Project `README.md` / `CLAUDE.md` / `AGENTS.md` | the `Play Store:` line of the Links block |
| `~/Documents/01-code/projects/project-live-urls.json` | `playStoreUrl` (empty string when not live) |
| portfolio-info and social content (notebook) | the store line and the CTA link |
| Store listing drafts, docs site | only a link the check confirmed |

Never write a guessed URL, and never keep a stale one because it was already there.

## Quick reference

| What you see | Verdict |
|---|---|
| Id on a registered developer page | Live — link it |
| Listing answers 200, id on no registered page | Live under someone else's account (say whose — e.g. a client's) |
| Listing answers 404 | Not live |
| Internal, closed or open testing only | Not public — do not call it live |
| The store serves an older build than the repo | Live; say "new build pending", never claim the new version is out |

## Growing the registry

A new account or store the owner shares becomes an `accounts` entry; then re-run the check for every
project. Fields and steps: `references/check-procedure.md` §7.

## Common mistakes

| Mistake | What happens | Instead |
|---|---|---|
| Trusting `project-live-urls.json` | Dead links ship | Check the pages |
| Trusting a 200 on a guessed details URL | Someone else's app is claimed | Match the id on the owner's page |
| Treating a failed fetch as "not listed" | A live app loses its link | Unknown until a real read |
| Updating one record after a launch | Records disagree again | Every surface in one change |

## Going deeper

- `references/check-procedure.md` — the exact commands, the browser fallback, the registry schema, how to
  read the id per stack, the record formats, and the 2026-09-17 baseline.

## Related skills

`aoneahsan-cccs-android-finalization` (getting the app there) · `aoneahsan-cccs-project-understanding`
(where the id and track are recorded) · `~/.claude/rules/publishing-compliance.md` (store claims stay true).

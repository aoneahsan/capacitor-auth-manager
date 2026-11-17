# Scorecard format

**Last Updated:** 2026-10-21. Repo: `aoneahsan/projects-finalization-record` (private), local clone
`~/Documents/01-code/projects-finalization-record/`, remote `o`, branch `main`.

## `production/SCORECARD.md` — one row per production root

| Project | Root | Category | Confirmed | Score | Held | Gates | Status | Complete on |
|---|---|---|---|---|---|---|---|---|
| lifewell | `production-projects/lifewell-project-root` | web app | 2026-10-21 | 72 / 100 | extension 10 | 2 of 3 | in progress | — |

`Status` is one of `not started` · `in progress` · `owner chain` (agent work done, store/console steps left) ·
`complete`. `Complete on` is the date the owner confirmed the store release.

## `production/scorecard.json` — the machine copy

```json
{
  "lifewell": {
    "root": "production-projects/lifewell-project-root",
    "category": "web-app",
    "categoryConfirmedOn": "2026-10-21",
    "criteria": { "primary": { "points": 15, "earned": 15, "evidence": "production/lifewell.md#primary" } },
    "held": ["browser-extension"],
    "gates": { "live": true, "supabase": true, "storeConfirmed": false },
    "status": "owner chain",
    "completeOn": null,
    "lastAuditOn": "2026-10-21"
  }
}
```

## `production/<project>.md` — the audit

Sections, in order: category and why · score table (criterion, points, earned, evidence link or what is
missing) · gates · gaps in point order · owner-only steps · could not verify (and why) · run log (date, what
changed the score).

# `docs/product-audit/PROFILE.md` — the per-project audit profile

One file per project, in the repo that holds the project's coordination records: the kit root for a
`<project>-root/` container, otherwise the product repo. For a PUBLIC product repo with no private container,
store it in the record repo instead, at `product-audits/<project>/PROFILE.md`. It is the project-specific
overlay. The global checklists stay generic. **The first run writes it from evidence**, and later runs update
it when a fact changes. It is not a report: no findings, no scores.

## Required sections

```markdown
# <Product> — product audit profile

**Last Updated:** YYYY-MM-DD

## Targets
| Surface | URL / id | Source |
(app origin, marketing site, docs site, store listing, package, API) — URLs from
`~/Documents/01-code/projects/project-live-urls.json`; never invented.

## Category and held items
The completion category (from the scorecard) and the held items, which are never audited as gaps and never suggested.

## Repos
| Repo | Path | Primary branch | Remote | Public? |

## Smallest valuable outcome
The first-value journey in one sentence (e.g. "add one person and one memory, see it after reload").

## Roles and test accounts
Aliases only (`t1+3` = member). Admin is never used to verify user flows.

## Sensitive data classes
(health, children, other people, voice, location, payment) and their processors.

## Project instruments
The project's own gates and probes the audit must use instead of a generic one
(e.g. `yarn gates`, `yarn verify:copy`, `yarn db:policies`, `yarn status`).

## Owner-typed exceptions
| Check | His words (verbatim, ALL CAPS) | The thing | Exactly what is excused | Date |
🔴 Only an exception the owner TYPED IN ALL CAPS, naming the thing and the exception, copied from the project's
`## Owner-typed exceptions` block in `CLAUDE.md` + `AGENTS.md` (`00-house-rules.md`). Never written from an agent's
judgement or recommendation. An excused check is reported as its exception with his words, never as PASS. A deviation
without such a row is a FAIL to fix, never an "accepted exception".

## Leads to re-verify
Historical claims from records or reports, each a hypothesis with its source and date.

## Lane notes
Per-lane, project-specific checks (e.g. LW-SHARE: which resources support share links).
```

Keep it under ~250 lines and point at project docs instead of copying them.

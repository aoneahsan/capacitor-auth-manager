# Evidence, status and priority

What every check result and every finding must carry. A run that cannot meet this contract for a check
reports that check as BLOCKED or NOT_RUN. It never reports PASS.

## Statuses

| Status | Meaning | Must also carry |
|---|---|---|
| `PASS` | The acceptance condition was checked **in this run** and met in the named environment | the evidence ref + environment + revision |
| `FAIL` | Reproducible evidence violates the acceptance condition | a finding (below) |
| `BLOCKED` | A named dependency is missing: access, credential, account, tool, owner decision | exactly what is missing + who can supply it |
| `NA` | The capability is absent, or a held item (`project-completion.md`) | evidence of absence (grep, route map, PROFILE held item). 🔴 Never "deliberately out of scope" by an agent's choice, and never an "accepted exception": only an owner-typed ALL-CAPS exception (`00-house-rules.md`) excuses a check |
| `NOT_RUN` | Applicable but not executed | the reason + next action; it never counts as zero defects |

- Source inspection proves **intent**, not runtime. A local pass is not a live pass. Every environment is annotated separately (`source`, `local-build`, `local-run`, `live`).
- Missing CrUX/field data means field evidence is missing. It is neither a Core Web Vitals pass nor a fail.
- A vendor claim gets a disposition (`confirmed` · `not reproduced` · `partially reproduced` · `not applicable` · `blocked`), and the check keeps its own status.
- Earlier evidence keeps its original timestamp; it is never silently refreshed.

## Minimum evidence per finding

1. A stable `id` (`F-<lane>-NNN`) and its `check_ids` (and `vendor_ids` when a report prompted it).
2. Surface: route pattern, file:line or commit, environment, UTC observation time, revision checked.
3. Reproduction steps, expected behaviour, actual behaviour.
4. Method/tool with version, configuration, sample size and request budget.
5. A sanitized observation: status line, header, assertion output, screenshot path, log excerpt. 🔴 Never include secrets, cookies, tokens, real user content, emails or payment ids.
6. Confidence (`high/medium/low`) and provenance (`static`, `local test`, `live read-only`, `vendor-reported`).
7. Effect on users, security, accessibility or business. No invented money figures.
8. Fix options, effort (`S/M/L`), dependencies, acceptance test, rollback, and `owner_action_required`.

## Priority (order) vs severity (harm)

| P | Meaning | Examples |
|---|---|---|
| **P0** | Active exposure or integrity failure: escalate at once, never exploit further | cross-account read, a secret in a bundle, entitlement granted from a client flag, data loss, mischarge |
| **P1** | A core journey broken, a material exclusion, a false promise, a broad discovery blocker | sign-up fails, keyboard trap on checkout, a price that differs from checkout, prod `noindex`, soft 404s |
| **P2** | Material quality, reliability, discoverability or conversion problem with a credible mechanism | slow signed-in route over budget, thin titles on a template, missing contact path |
| **P3** | Polish, speculative optimisation, optional experiment | `llms.txt`, comparison page, copy experiment |

Order by severity, then reach, exposure, confidence and dependencies, then effort. A missing meta
description never outranks a broken sign-up or an access-control hole.

## Coverage, never a bare score

`REPORT.md` shows counts per status, per lane and per route class, with the denominator
(`applicable = total − NA`). Any optional weighted score names its weights and keeps BLOCKED and NOT_RUN in
the denominator. 🔴 Never write "fully audited", "secure", "compliant", "production-ready" or "100/100" while an
applicable P0/P1 check is FAIL, BLOCKED or NOT_RUN.

## Completion states for a fix (separate fields, never merged)

`implemented-local` → `gates-green` (the project's full gate on the final revision) → `verified-local`
(the failing check re-run and passing) → `deployed` → `live-verified` (the check re-run on the live origin,
plus the `deploy-verification.md` render and bundle-hash proof) → `announced`. A fix is reported at the highest
state it actually reached. A test result from an earlier revision is stale.

## Verifying a fix

Reproduce first. Then pick a discriminating check: the same probe, query, browser step or a pre-approved test
(`01-authorizations.md`, test classes) that failed before and passes after. Re-test the adjacent flows and
permissions. Record the final commit. The **main session** does the verification. 🔴 No reviewer sub-agent, ever.

- **A performance FAIL deferred for "host load" is re-measured with its LCP phase breakdown** (TTFB, load delay, load
  time, render delay) in the same run. Render delay behind JavaScript is a code finding whatever the load average says;
  record the cause and the fix shape rather than deferring it again (Empora E-05, 2026-10-29).
- **Hydration is proven by node identity, not by a quiet console** (Native Update, 2026-10-30): tag the prerendered `<h1>`
  before the bundle runs and check the same node is still connected and React-owned after boot. A page that silently
  client-renders over its server markup passes every console and build check.

---
name: aoneahsan-cccs-product-audit
description: 'The owner''s evidence-first audit-and-fix standard for any project: security, RLS and data lifecycle, payments and plan truth, AI cost, email, journeys, accessibility, mobile, performance, SEO/AEO, trust, conversion, competitor research and the house laws; statuses, P0-P3, run records, PROFILE and audit lanes. Use for /product-audit, "audit everything", a hardening pass, a vendor/SEO/Seeto report to verify, or before calling a project production-ready.'
metadata:
  source: 'Owner request 2026-10-26 (LifeWell root): rebuild the externally generated "Product Audit & Fix Kit" (prompted by a Seeto email about aoneahsan.com) as our own system. Owner answers the same day: runs in projects-finalization-record, full run by default, separate from and cross-linked with /finalize-project, bounded competitor research every run.'
---

# Product audit

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

## Overview

An audit finds what is **actually** wrong with a product from its own code, configuration and observed
behaviour, fixes what an agent may fix, proves each fix again, and leaves everything else visibly open. It is
our own system: an outside report, email or score is a **hypothesis to test**, never a source of truth.

**The standard:** every applicable check ends with a status and evidence. Nothing is silently omitted, and
nothing is PASS without evidence observed in this run.

## 🔴 STOP list — any of these means the run is wrong

- A score, percentage or "100/100" invented from checks that were not run. Report coverage (`ran / applicable`) beside every result.
- A vendor email, Seeto report, old scorecard or tracker treated as a finding or a pass. Map each claim to a check; verify it or mark it a false positive.
- The wrong target: a report about `aoneahsan.com` applied to `lifewell.aoneahsan.com`. Resolve the origin from `~/Documents/01-code/projects/project-live-urls.json`.
- A green build, typecheck, DOM tree or source read reported as runtime proof. Source proves intent; only the running product proves behaviour.
- Weakening auth, RLS, rate limits, consent or a test to make a check pass.
- Fabricated reviews, user counts, testimonials, logos, medical/legal outcomes, competitor weaknesses or structured-data facts.
- Making private app data indexable for SEO, or using `robots.txt` as privacy.
- A real charge, refund, campaign send, store upload, DNS, Search Console or credential change. These are owner-only (list them in `docs/MANUAL-TASKS.md`).
- 🔴 An "accepted exception", "accepted deviation" or NA-by-choice. A rule that does not hold is a FAIL to fix; only an exception the owner typed in ALL CAPS, naming the thing and the exception, excuses it (`00-house-rules.md`).
- A reviewer sub-agent. The owner runs reviews; the main session verifies (`fable-standalone-review.md`).

## Statuses and priority (summary)

`PASS` · `FAIL` · `BLOCKED` (named missing access/input) · `NA` (with evidence the capability is absent) ·
`NOT_RUN` (with reason). **P0** active exposure, cross-account access, secret leak, data loss, mischarge ·
**P1** a broken core journey, inaccessible flow, false promise, live discovery blocker · **P2** material quality ·
**P3** optional experiment. Severity and confidence are separate fields. Full contract:
`references/evidence-and-status.md`.

## Where things live

| Record | Path |
|---|---|
| Per-project profile (targets, roles, data classes, held items, owner-typed exceptions — ALL CAPS, his words, `00-house-rules.md`) | `<project root>/docs/product-audit/PROFILE.md` — format `references/profile-format.md`; the first run writes it |
| Run records (security-sensitive) | private `~/Documents/01-code/projects-finalization-record/product-audits/<project>/<YYYY-MM-DD-HHMM>/` — layout `references/run-artifacts.md` |
| Competitor matrix | `<project>/docs/growth/competitors.md` — `references/competitive-research.md` |
| Owner-only steps | `<project>/docs/MANUAL-TASKS.md` (append; tick only on the owner's confirmation) |

🔴 A CLIENT project keeps its run records in the client's owner-controlled folder, never inside a client repo, and never names FilesHub (`client-projects.md`).

## The check catalogue — load only your lane's file

| Lane (agent) | Reference | IDs |
|---|---|---|
| Security and data (`aoneahsan-ccca-audit-security`) | `references/checklist-security-privacy.md` · `references/checklist-commerce-ai-comms.md` (server side) | ARCH AUTH ACCESS APPSEC DATA PAY AI |
| Experience (`aoneahsan-ccca-audit-experience`) | `references/checklist-experience.md` · comms rendering in `checklist-commerce-ai-comms.md` | UX A11Y MOBILE OPS COMMS |
| Discoverability and growth (`aoneahsan-ccca-audit-discoverability`) | `references/checklist-discoverability.md` · `references/competitive-research.md` | D01–D26 TRUST COMP |
| Every lane | `references/house-laws-map.md` — the owner's own laws as checks (H01…) | H |

How to run each check without writing a script: `references/tooling-commands.md`.

## Run order

1. **Understand.** Read one native guide, the status/resume record, PROFILE and the last run's `RESUME.md`. Resume; never re-plan.
2. **Map.** Write the manifest: repos (swept from inside each), commit, live origins, routes, roles, integrations by name only.
3. **Applicability.** List every check ID in `coverage.md` as applicable, or NA with a reason.
4. **Audit lanes.** Use up to 3 lanes in parallel when `aoneahsan-cccs-resource-aware-dispatch` allows; otherwise run them in sequence in the main context. Every dispatch carries a bounded packet and an EXCLUSIVE SCOPE (its lane file).
5. **Integrate.** De-duplicate, find root causes, and produce `findings.json` plus a P0→P3 backlog, each item tagged `agent` or `owner`.
6. **Ask once.** One batch of every owner-only or outcome-changing question (`aoneahsan-cccs-ask-the-owner`).
7. **Fix waves.** Work P0 first. Dummy first for anything a person sees. One writer per file. Reproduce, then fix, then run the project's full gates.
8. **Re-verify.** Re-run each fixed check on the final code, then live after the deploy (`deploy-verification.md`).
9. **Ship and record.** Commit, push and deploy per the standing grants. Write `REPORT.md` with before → after, plus `RESUME.md`. Feed P0/P1 gaps to the completion audit file (`aoneahsan-cccs-project-completion`).

## Common mistakes

| Mistake | Instead |
|---|---|
| One Lighthouse score as "performance" | Mid-phone LCP/CLS/TBT per key route, cold and warm, public and signed-in; field INP only from field data |
| "RLS enabled" as access proof | Two seeded accounts, a forbidden row, and catalog queries (`pg_policies`, grants incl. `anon` by name) |
| "Sandbox payment worked" as live payments | Four separate states: code · sandbox · production config · owner-run real lifecycle |
| An NA because the check was hard | NA needs evidence the capability is absent; otherwise BLOCKED or NOT_RUN |
| Overwriting the last run | Every run gets a new folder; resume names the old one |

## Related skills

`aoneahsan-cccs-project-completion` (scorecard; `/finalize-project` runs this audit as a phase) ·
`aoneahsan-cccs-verification` · `aoneahsan-cccs-web-e2e-testing` · `aoneahsan-cccs-react-seo` ·
`aoneahsan-cccs-react-aeo` · `aoneahsan-cccs-app-growth` · `aoneahsan-cccs-postgres-multitenancy-rbac` ·
`aoneahsan-cccs-plans-entitlements` · `aoneahsan-cccs-fileshub-ai`.

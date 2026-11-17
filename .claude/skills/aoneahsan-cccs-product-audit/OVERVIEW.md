# Product audit — overview

## Purpose

The owner wants one system of our own that audits any project for every issue that matters (security,
privacy, payments, AI cost, accessibility, performance, mobile, SEO and AI-search visibility, trust,
conversion, competitors and his house laws), fixes what an agent may fix, and proves the result with real
evidence. It replaces an externally generated kit prompted by a Seeto email (2026-10-26); that email and every
tool like it are direction only, never the source of truth.

## What this skill does

- Defines the check catalogue (security/privacy, commerce/AI/comms, experience, discoverability, house laws)
- Defines statuses, evidence, priority and the separate states local · deployed · live-verified
- Keeps each project's `docs/product-audit/PROFILE.md` and its run records in the private record repo
- Splits the audit into three read-only lanes run by `aoneahsan-ccca-audit-*` agents
- Drives the fix waves, the re-verification and the record that `/finalize-project` reads

## When it gets invoked

- `/product-audit` (any mode)
- "audit everything", "find and fix all issues", "is this production-ready", a hardening pass
- A vendor, SEO, Seeto-style or agency report or email that needs verifying
- `/finalize-project`, as its quality phase

## References

- `references/evidence-and-status.md` — statuses, minimum evidence, priority, completion states
- `references/checklist-security-privacy.md` — ARCH, AUTH, ACCESS, APPSEC, DATA
- `references/checklist-commerce-ai-comms.md` — PAY, AI, COMMS
- `references/checklist-experience.md` — UX, A11Y, MOBILE, OPS
- `references/checklist-discoverability.md` — D01–D26 and TRUST
- `references/competitive-research.md` — COMP: the Seeto-style competitor and pricing matrix
- `references/house-laws-map.md` — H01…: the owner's laws as checks
- `references/tooling-commands.md` — direct commands per check family (no scripts)
- `references/run-artifacts.md` — the run folder and its files
- `references/profile-format.md` — the per-project PROFILE

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/*.md` (house laws), `~/.claude/policy/`
- **Last reviewed:** 2026-10-26

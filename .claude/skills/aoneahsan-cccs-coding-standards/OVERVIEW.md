# Overview — `aoneahsan-cccs-coding-standards`

## Purpose

The baseline quality floor for every project aoneahsan owns, independent of language or framework. It exists
so that code review never has to relitigate the same six decisions, and so a new project starts compliant
instead of being audited into compliance later.

## What this skill does

- States the hard rules: no hardcoded secrets, no direct `console.*`, no TODOs or placeholders, delete unused
  code rather than underscore-renaming it, no script files, ~500-line file ceiling.
- Defines the **three-file commit** for environment variables (env module + type declaration + `.env.example`)
  and the loud-at-boot failure contract for required vars, including the never-log-values rule.
- Requires error tracking and analytics to run through one central service each that degrades silently when a
  provider key is absent.
- Gives the ESLint stance — pragmatic, bug-catching, `any` banned, hook deps chosen deliberately — and scopes
  it to new code only.
- Sets the finishing gate: typecheck, lint and build all green with zero warnings, including pre-existing ones.

## When it gets invoked

- Writing or reviewing code in any project, any stack.
- Before any commit, as the pre-finish gate.
- Adding an environment variable, a third-party service, or an analytics event.
- A linter or type checker is producing noise and you are deciding whether to fix, configure, or suppress.
- Auditing an inherited or unfamiliar project for baseline compliance.

## Where it applies

Every project, every language. The rules describe concerns; the project's chosen stack supplies the
mechanism.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-005, R-006, R-017, R-023, R-024, R-029, R-041,
R-046) and `_source-understanding/files/prompt-logs.md` (no CDN URLs, response-time budget, config-over-
symptom fixes).

## Related skills

`aoneahsan-cccs-programming-principles` (design-level reasoning) · `aoneahsan-cccs-documentation` (where the
artefacts live) · `aoneahsan-cccs-git-workflow` (what happens after the gates pass) ·
`aoneahsan-cccs-typescript` (language-specific strictness).

## Maintenance

Re-check when the source record's hash changes, or when a new global rule lands in `~/.claude/rules/`.

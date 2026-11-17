# Web E2E verification — overview

## Purpose

`aoneahsan-cccs-flutter-e2e-testing` has existed for a while; there was no web equivalent, so the owner's
controlled-browser workflow was re-derived from scratch every session. This skill makes it repeatable.

It matters more than a convenience skill because of what it prevents. Four specific traps in this workflow
have each already produced a **PASS on something that was broken** — most damagingly, a sibling project that
reported a feature working twice while it was 100% dead for every non-admin user, because the only test run
used the admin account. Those four are stated at the top of `SKILL.md` rather than buried.

## What this skill does

- Leads with **the four paid-for traps**: admin accounts hide rules bugs, a `(200, 0)` probe proves nothing,
  enumeration protection returns `invalid-credential` not `user-not-found`, and deletion demands fresh
  re-authentication.
- Specifies the **DEV-only UI-less auth hook** — why it exists (an OAuth popup cannot be driven headlessly),
  the three requirements that make it real rather than simulated, and the **`dist/` absence build gate**.
- Gives the pattern for **reading the shared password at runtime** so it reaches the browser without entering
  a transcript, a repo file, or a command echo.
- Names the **account roster** and warns that `t1` is an admin in several projects.
- States the loop — **seed → sign in non-admin → drive → assert against the server → sweep → clean up**.
- Ends with a **STOP list**: the conditions under which a "it works" claim is not yet earned.

## When it gets invoked

- Verifying any feature or module end to end.
- Setting up automation sign-in in a project for the first time.
- Testing multi-user, role-based, or account-deletion flows.
- Before marking a module done or claiming a fix works.
- A responsive sweep against a real build.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every web project; the Capacitor web layer before a device pass |
| Stack override | The concern is *drive the real app as a real non-admin user and assert against the server*. Flutter's arm is `aoneahsan-cccs-flutter-e2e-testing` — same method, canvas-specific driving. |

## Sources

| Source | Record |
|---|---|
| The fleet's per-project hooks, rosters and recorded traps | `~/.claude/rules/automation-test-accounts.md` — pointed at, not copied |
| The rebuild's Definition of Done and CAUTIONS list | `code/production-projects/lifewell-project-root/00-REBUILD-MASTER-PROMPT.md` |
| `@react-aria/test-utils`, for component-level interaction | `_source-understanding/urls/react-aria.md` |

## Related skills

- `aoneahsan-cccs-unit-testing` — the other half of the testing gate
- `aoneahsan-cccs-verification` — the general rule that a claim carries fresh output
- `aoneahsan-cccs-debugging` — root-cause before re-running
- `aoneahsan-cccs-frontend-development` — the responsive width matrix
- `superpowers-chrome:browsing` — the browser control tool this skill drives

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/automation-test-accounts.md` (the account
  roster, the password location, the per-project hook registry and its recorded traps) and
  `~/.claude/rules/dev-workflow.md` (the run-to-verify grant and the kill-the-server rule).
- **Last reviewed:** 2026-07-25

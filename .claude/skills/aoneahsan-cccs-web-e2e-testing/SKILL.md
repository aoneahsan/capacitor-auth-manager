---
name: aoneahsan-cccs-web-e2e-testing
description: 'Agent-driven end-to-end verification of web apps: the DEV-only UI-less auth hook and the build gate proving it never ships, driving a controlled browser over CDP, reading the shared test password at runtime so it never reaches a transcript, seeding server state before asserting, and the traps that made a broken feature report PASS. Use when verifying a feature end to end, setting up automation sign-in, testing multi-user or account-deletion flows, or before claiming a module is done.'
metadata:
  source: rules/automation-test-accounts.md, plus the traps recorded per project in its registry
---

# Web E2E verification

This is **agent-driven verification**, not test authoring — how a change is confirmed to actually work, and
the evidence half of every Definition of Done.

🔴 **The owner's 2026-08-14 grant pre-approves a *required minimum* of written tests, and no part of it is an
E2E suite** (`~/.claude/rules/dev-workflow.md`). E2E stays what it is here: a real browser run by the agent,
evidence captured in the hand-back, and no `*.spec.ts` files accumulating. A written E2E suite needs an
explicit ask, every time.

**The standard: the hook that makes automation possible must not exist in a production build, and its absence
is a gate.**

## 🔴 The four traps — each has already cost real production breakage

| Trap | What happens |
|---|---|
| **Verifying a user flow as an admin account** | Admin branches in RLS pass silently. A sibling project reported PASS **twice** on a feature 100% broken for every ordinary user. **Use a plain account for anything a normal user does.** |
| **Treating `(200, 0)` as proof** | A query returning zero rows satisfies any policy **vacuously**. **Seed data first, then probe.** |
| **Catching only `user-not-found`** | Providers with email-enumeration protection return `invalid-credential` instead. A hook catching one silently fails to provision. **Catch both.** |
| **Deleting an account without re-authenticating** | Deletion triggers a fresh-login demand an email/password test account cannot satisfy through a social popup. **Sign in immediately before deleting.** |

## The hook

The product UI stays Google-only. The hook exists solely because an OAuth popup cannot be driven headlessly —
**not** as an alternative sign-in path.

The backend keeps email/password available for test aliases only. A `before_user_created` hook rejects
non-test email signups, and a custom access token hook rejects non-test password sessions, including an
existing Google account that later gains a password. Auth settings enforce password strength because the
creation hook does not receive the raw password. Provision a plain alias and a separate admin alias through the backend admin API, grant the
admin role through the audited server path, and read the resulting capabilities back before driving `/admin`.
Run ordinary journeys as the plain alias and every admin section as the admin alias. The hook never assigns
roles or accepts a password from a user-facing form. In production, use an approved password-grant session
outside the UI; the development hook must be absent from the shipped bundle.

```ts
// main.tsx — the dynamic import keeps it out of the production bundle
if (import.meta.env.DEV) {
  void import('./services/test-auth.dev').then((m) => m.installTestAuth());
}
// Sets window.__lwTestAuth = {signIn, signUp, signOut, getUser, deleteAccount},
// all Promises. Impl: references/driving.md
```

Three requirements, all load-bearing:

1. **It drives the app's real auth client**, so a `signIn` persists a genuine session and the app boots
   signed-in. A simulated session verifies nothing.
2. **`deleteAccount` reuses the production deletion path**, so deletion is genuinely exercised.
3. **Its absence from the build is a gate:** `yarn build && grep -r "__lwTestAuth" dist/` must find nothing.

Name it per project (`__lwTestAuth`, `__hfTestAuth`, …); registry, roster and password location:
`~/.claude/rules/automation-test-accounts.md`.

## The password never enters a transcript

Read it at runtime from `~/.secrets/test-accounts/` straight into the CDP evaluate, so it goes **shell →
browser** and appears in no transcript, no repo, no command echo. Never pass it as a tool argument, never
echo it, never write it to a file. Recipe: `references/driving.md`.

**Accounts:** `t1` primary · `t1+1` / `t1+2` multi-user · `t1+del` deletion lifecycle.

## The loop

1. **Seed** server state through the backend admin key.
2. **Sign in** as a non-admin through the hook.
3. **Drive** the flow in the dedicated automation browser (`superpowers-chrome` / CDP). 🔴 **Assert
   `get_profile` returns `ahsan-automation` BEFORE the first navigation** — automation must never run in the
   owner's Chrome (`~/.claude/rules/browser-automation.md`). Headed beats headless for visual bugs and for
   showing the owner; kill the browser when done, and never kill one you did not launch.
4. **Assert against the server**, not the screen — the UI can render optimistically over a failed write.
5. **Sweep** 320 · 375 · 768 · 1024 · 1440 · 1920.
6. **Clean up** — delete what was created, kill the dev server.

## STOP — do not claim it works if

- The **dev server is still running**, or the build gate was not run after the last build.
- A fire-and-forget path (analytics, email) was verified by **reading code** rather than one real call.
- You cannot say **which account** each flow ran as — that is not evidence.

## Rationalizations → reality

Every one of these has preceded a false PASS on this fleet:

| Excuse | Reality |
|---|---|
| "t1 is the account I have set up" | t1 is an **admin** in several projects. Use `t1+1`. |
| "The policy clearly allows it" | Reading a policy is not a probe. Run it. |
| "It returned 200" | 200 with **zero rows** passes any policy vacuously. |
| "The UI showed the new row" | Optimistic rendering shows rows that were never saved. |
| "The build is green" | Analytics and email fail **silently by design**. |
| "I'll seed the data after" | Then the probe you already ran proved nothing. |
| "Deletion is too fiddly to test" | The flow most likely to be broken, and irreversible. |

CDP recipe, multi-user isolation and the regression matrix: `references/driving.md`.

## Related skills

`aoneahsan-cccs-unit-testing` (the other half) · `-verification` (fresh output as evidence) ·
`-debugging` (root-cause before re-running) · `-frontend-development` (the responsive sweep) ·
`superpowers-chrome:browsing` (the browser tool).

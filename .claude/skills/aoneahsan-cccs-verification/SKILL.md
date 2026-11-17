---
name: aoneahsan-cccs-verification
description: 'Use the moment you are about to say work is done, fixed, passing, working or ready — before any commit, push, deploy, PR, tracker "complete", or handing back to the owner. Requires fresh command output as evidence for the claim, and a line-by-line re-read of the original request.'
metadata:
  source: superpowers:verification-before-completion (obra, MIT) + the owner's Task-Completion-Verification and run-to-verify rules (rules/dev-workflow.md)
---

# Verification

## Overview

Claiming work is done without checking is dishonesty, not speed. The owner has said "I don't believe you"
after false completions — trust, once broken, is expensive. Before any success claim, run the command that
proves it, read the full output, then state the result *with* that evidence.

**The standard:** no completion claim without fresh verification evidence produced in this same turn. Not run now = not claimable.

## When to use

- About to write "done", "fixed", "works", "passing", "ready" — or any synonym or implication of success.
- Before committing, pushing, deploying, opening a PR, or marking a tracker sub-task complete.
- Before handing back to the owner or moving to the next task.
- After a subagent reports success (verify independently — a report is not evidence).

## The gate

```
Before claiming any status:
1. IDENTIFY  the command that proves the claim
2. RUN       it fresh and in full (this turn)
3. READ      the full output — exit code, failure count
4. VERIFY    output actually confirms the claim
5. THEN      state the claim WITH the evidence
Skipping any step = claiming, not verifying.
```

Gates for the owner's stack: `yarn typecheck && yarn lint && yarn build` (zero warnings/errors), one-shot —
never a dev/watch server as the *default* gate. The standing **run-to-verify** grant in
`~/.claude/rules/dev-workflow.md` still authorizes a background dev server on the project's registered port
plus headless browser checks for end-to-end confirmation — kill the server after. A green build alone never
proves a flow "works" when it can be run for real.

## Requirements re-read (the owner's completion rule)

"Tests pass" is not "requirements met." Before declaring a task complete: re-read the original request,
build a line-by-line checklist, verify each item, and report **Completed / Remaining / Not done (+ why) /
Verification**. Confirm 2–3 times before saying done. State skipped steps and failures honestly with the
output — never round a partial result up to "done".

🔴 **An approved design artefact is part of the original request.** When the project has a click dummy (or
any signed-off reference page), re-reading the request means **opening the dummy page beside the rendered
page** and putting both captures in the report. A UI surface that has not been compared is not verified,
however green its gates. Full rule: `~/.claude/rules/frontend-ui-standards.md` §10.

## 🔴 "Closed" has six parts, and shipping the code is one of them

Owner directive 2026-08-14 — *never leave any phase, task or feature half closed.* Before calling a phase done:
committed **and pushed** · **every subTask status flipped in the same commit as the work** · `lastUpdated` +
a `runHistory` row · every closed queue entry renamed `TASK-` → `DONE-` **and moved** · every ledger/derived
artifact row flipped. (🔴 A review round is NO LONGER a closing condition — reviews are on request only,
`~/.claude/rules/fable-standalone-review.md`.) Full law:
`~/.claude/rules/feature-trackers.md`.

**Work that shipped while its rows still read `pending` reads as "not started" to the next session and "done"
to the one that shipped it.** Reconcile `git log --oneline <branch>` against the tracker at every wave close.

## 🔴 A deploy is verified by pixels, before and after (owner directive 2026-09-25)

Never deploy a build you have not seen render. Build fresh, serve **that exact output**, load it in the
automation browser at 1440 and 390, and confirm **visible content in the screenshot** with zero console
errors. Then stamp it (`pretooluse-deploy-verify-gate.sh --stamp <publicDir> "<what you saw>"`) and deploy.
After the deploy, repeat the check on the **live URL** and compare the served bundle hash with the local
one. Green gates and a populated DOM or semantics tree are not proof: the 2026-09-25 callvault page had
both and was blank. Law and CDP recipe: `rules/deploy-verification.md`.

## Red flags — STOP

- "should", "probably", "seems to", "looks correct"
- "Great!" / "Perfect!" / "Done!" *before* running the check
- About to commit/push/PR without fresh output
- Trusting a subagent's "success" without checking its diff
- "just this once" / "I'm confident" / "I'm tired"
- Any wording implying success with no command run this turn
- Calling a UI surface done without having **opened its approved dummy counterpart**
- A comment asserting something is wired, taken as evidence that it is — grep for the consumer

## Rationalizations → reality

| Excuse | Reality |
|---|---|
| "Should work now" | Run the verification |
| "Linter passed" | Linter ≠ compiler ≠ runtime |
| "The build is green" | Proves compilation, not behavior — run the flow |
| "Subagent said success" | Verify independently (check the diff/files) |
| "Different words, so the rule doesn't apply" | Spirit over letter — it applies |
| "Fire-and-forget, can't really test" | Make one live call — see `aoneahsan-cccs-debugging` |
| "The build is green **and it renders**" | Rendering ≠ rendering **what was approved**. Open the dummy page beside it |
| "I translated the dummy faithfully" | That is an intention. Show the screenshot pair |
| "The new parity test passes" | A test nobody has watched **fail** asserts nothing. Plant the defect, see it go red, restore, quote the message |
| "The comment says it's mounted/wired" | A comment is a claim, not evidence. Grep for the consumer |
| `$?` after a pipe | That is the **last** command's exit code, not the one you care about. `cmd > f 2>&1; echo $?` |

## Related skills

`aoneahsan-cccs-debugging` (root-cause before the fix you're now verifying) · `aoneahsan-cccs-git-workflow`
(verification precedes the commit) · `aoneahsan-cccs-code-review` (independent second check).

<!-- Living registry (link, never copy): ~/.claude/rules/dev-workflow.md (gates + run-to-verify grant). -->

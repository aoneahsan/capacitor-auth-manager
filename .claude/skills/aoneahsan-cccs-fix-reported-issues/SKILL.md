---
name: aoneahsan-cccs-fix-reported-issues
description: "Working the open-issue queue in any of our own projects: detecting reported issues at session start, planning and implementing the fixes, moving resolved entries to the history file. Use at session start when docs/REPORTED-ISSUES.md has open entries, or when asked to check or clear a project's reported issues."
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/projects/files-hub-platform.md
---

# Fix reported issues

Every owned project carries its fix queue at **`docs/REPORTED-ISSUES.md`** (open `### ISSUE-NNN` sections)
with history at **`docs/RESOLVED-ISSUES.md`**. This skill is the workflow that empties the queue.

> Fleet rule: `~/.claude/rules/project-issue-reporting.md` when present. A `SessionStart` hook injects a
> reminder in any project whose queue has open entries — but check the file yourself when starting real work
> in an owned project; the hook is a net, not the contract.

## The workflow

1. **Detect.** At session start (or on the reminder): `grep -n "^### ISSUE-" docs/REPORTED-ISSUES.md`.
   Nothing → proceed with the session's actual task. Entries → surface them to the owner alongside the
   task; unless the owner says otherwise, fixing the queue comes first — an open issue here is a bug
   downstream consumers are living with.
2. **Plan on the Fable role.** Per the model-workflow rule: write the fix plan on the configured Fable model
   (plan file + tracker when multi-phase). Read the entry fully — a well-filed entry already carries repro +
   root cause; verify the root cause against the code rather than trusting it blindly.
3. **Implement on the Opus role**, in the main context, invoking the skills that match the project's stack
   (RULE #0). Fix the CAUSE, not the symptom the reporter happened to see.
4. **Verify** with the project's own gates (typecheck/lint/build/tests as that repo defines them) plus a
   repro check: the exact snippet from the entry no longer misbehaves.
5. **Move the entry** — cut it from `docs/REPORTED-ISSUES.md`, append to `docs/RESOLVED-ISSUES.md` with
   `**Resolved:** YYYY-MM-DD · fixed in <version / deploy marker>` added. Keep the original body intact
   (history stays reviewable). Never delete.
6. **Propagate.** Update the matching global rules KB (mark the quirk RESOLVED with the version); release
   per the project's own rules (a package publishes a new version — native-update's policy — a platform
   deploys with its marker; anything owner-only goes to `docs/MANUAL-TASKS.md`). Tell the reporting
   project's next session via that KB — that is what it reads.

## 🔴 The SECOND queue — `SEARCH-DISCOVERY-ISSUES.md`, and it is not this one

A project can carry **two** independent queues, with different owners and different close rules. Do not
conflate them.

|            | `docs/REPORTED-ISSUES.md`                 | `SEARCH-DISCOVERY-ISSUES.md`                                                            |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Written by | a human or an agent consuming the product | the **search-discovery runner**, `~/Documents/01-code/google-search-console-automation` |
| Lives at   | `docs/`                                   | 🔴 the **repository ROOT**                                                              |
| Marker     | `### ISSUE-NNN`                           | `## <severity> · <title>` with an `Issue id:`                                           |
| Closes to  | `docs/RESOLVED-ISSUES.md`                 | 🔴 **`SEARCH-DISCOVERY-FIXED-ISSUES.md`**                                               |
| Closes on  | the gates passing                         | 🔴 a **deployed** fix, proved on the **LIVE** surface                                   |

**Detect it the same way you detect the first:** at session start, if `SEARCH-DISCOVERY-ISSUES.md` exists at
the root, read its findings and surface them. Working it is not optional (owner directive 2026-09-08) — the
runner reports and verifies, it never changes application code, so nothing gets fixed unless the project
fixes it.

**Its loop differs from steps 4–5 above in one way that matters: DEPLOY comes before the move.** Fix →
deploy → fetch the LIVE URL and prove it → move the entry verbatim (keep the `Issue id`; it is the key the
runner re-verifies by) into `SEARCH-DISCOVERY-FIXED-ISSUES.md`, wrapped in its exact fixed markers with the
full 40-character fix commit, RFC3339 deployment time and live evidence → **delete its text from the issues
file** → commit and push both ledgers → when the queue is empty, continue the project's own remaining work.

The move is an owner/project claim. The runner imports it as pending, verifies it independently against the
live acceptance check and only then closes it. Failed or inconclusive verification reopens the issue. Never
manufacture the claim from Git history, a hosting timestamp or other deployment inference.

Use the exact import shape for every move:

```markdown
<!-- search-discovery:fixed:start issue=<exact issue id> -->

- **Fix commit:** `<full 40-character commit>`
- **Deployed at:** <RFC3339 timestamp with timezone>
- **Live evidence:** <what was checked on the deployed surface>

<the unchanged ## issue block from SEARCH-DISCOVERY-ISSUES.md>
<!-- search-discovery:fixed:end -->
```

⚠️ **Never move an owner-only finding** (a sitemap submission, a property verification, a DNS record).
Agent-side completeness is not the finding being closed. Leave it, mark it his, add the
`docs/MANUAL-TASKS.md` row.

⚠️ Its generated block says edits are replaced on the next run. The importer accepts only the exact issue
removals represented in the fixed ledger, verifies all remaining issue bytes and refreshes the generated
hash. Never edit that block to reword a finding.

🔴 An open **high**-severity finding stalls the project's entire search pipeline: the runner does not process
that project again until the highs verify fixed.
Every severity must clear before project completion; high/critical severity controls the processing hold.

Finding classes and what each actually means: `aoneahsan-cccs-search-indexing`.

## Rules

- **One issue at a time**, oldest first unless severity says otherwise; each fix verified before the next.
- An entry that turns out to be **not a bug** (misuse, stale version) still moves to RESOLVED — with the
  explanation, so it is not re-filed.
- A fix you cannot complete (needs owner input, credentials, a device) stays OPEN with a dated progress
  note; blocking questions go to the owner per `aoneahsan-cccs-ask-the-owner`.
- The queue never holds partially-moved entries — the move in step 5 is one edit pair, same commit as the
  fix.

Filing new issues is the sibling: `aoneahsan-cccs-report-project-issues`.

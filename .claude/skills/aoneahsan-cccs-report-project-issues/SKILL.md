---
name: aoneahsan-cccs-report-project-issues
description: "Reporting issues found in our own projects — native-update, FilesHub, strata-storage or any other — into the target project's fixed issue queue so the project knows it must fix them. Use when an integration, test run or consumer project surfaces a bug in one of our own packages, or when deciding where a finding belongs."
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/projects/files-hub-platform.md + projects/strata-storage-package.md
---

# Report project issues

When something the owner OWNS misbehaves — a package, a platform, an API — the finding does not stay in the
consuming project's chat history or docs. It gets filed **in the target project's repo**, where the next
session opened there will see it and fix it.

> The fleet rule (paths, format, flow) lives in **`~/.claude/rules/project-issue-reporting.md`** when this
> machine has it. This skill is the portable procedure.

## The two fixed files (same paths in EVERY project)

- **`docs/REPORTED-ISSUES.md`** — open issues only, each one a `### ISSUE-NNN — <title>` section.
- **`docs/RESOLVED-ISSUES.md`** — history; entries move here on fix, never get deleted.

Create the pair if the target repo lacks them, and add a one-line pointer to the queue in the target's root
`CLAUDE.md` **and** `AGENTS.md` in the same change — a queue the project's guidance never mentions is a
queue nobody reads.

## What a filed entry must contain

Enough that a session with **zero context** can fix it without re-discovery:

```markdown
### ISSUE-NNN — <one-line title>

**Status:** OPEN · **Reported:** YYYY-MM-DD from <consumer project> · **Affects:** <package>@<version>, <file/area>

**Symptom** — verbatim errors/output, where it appears, how often.
**Repro** — minimal steps or snippet.
**Root cause** — if diagnosed, with file:line evidence; say plainly when it is undiagnosed.
**Suggested fix** — if any; mark clearly as suggestion.
```

Number sequentially per project (`ISSUE-01`, `ISSUE-02`, …) — continue from the highest across BOTH files.

## The three-place discipline

1. **Target repo queue** (above) — the actionable fix queue. Public repo? Fine — honest queues are
   precedent; just no secrets or private-project internals in the entry.
2. **Global rules KB mirror** — when the issue affects other consumers, mirror the quirk/workaround into the
   matching KB (`~/.claude/rules/fileshub-api.md`, `native-update-package.md`,
   `capacitor-plugins-and-issues.md`) so the fleet inherits it while the fix is pending.
3. **The consumer's own conventions stay** — e.g. `docs/NATIVE_UPDATE_PACKAGE_ISSUES.md` in each
   native-update consumer, per that package's rule.

## What NOT to do

- ❌ Work around the bug downstream and record it nowhere — the next project re-hits it.
- ❌ File it only in the consuming project — the owner fixes issues in the OWNING project.
- ❌ Vague entries ("uploads sometimes fail") — no verbatim symptom + repro means re-discovery.
- ❌ Delete resolved entries — they move to `docs/RESOLVED-ISSUES.md` with date + fixing version.
- ❌ Edit unrelated files in the target repo while filing; commit only the queue + guidance pointers.

Fixing the queue is the sibling skill: `aoneahsan-cccs-fix-reported-issues` (session-start check → plan on
configured Fable model → fix on configured Opus model → move to resolved; explicit owner model choice wins).

## 🔴 The search-discovery queue is a SECOND queue, and it is not yours to file into

`SEARCH-DISCOVERY-ISSUES.md` at a project's **repository root** is written by the search-discovery runner
(`~/Documents/01-code/google-search-console-automation`), not by a consuming session. **Never file into it,
and never edit its generated block to reword a finding.**

What a project session DOES owe it (owner directive 2026-09-08): watch it, fix and **deploy** what it
reports, prove the fix on the LIVE surface, then move each closed entry into
**`SEARCH-DISCOVERY-FIXED-ISSUES.md`** with the exact issue markers, full fix commit, RFC3339 deployment
time and live evidence, and delete its text from the issues file. Commit and push both ledgers. This move is
a claim pending independent runner verification; it is never inferred from deployment metadata. The workflow
lives in `aoneahsan-cccs-fix-reported-issues`; the finding classes in `aoneahsan-cccs-search-indexing`.

If you find a genuine defect in the RUNNER itself, that is an ordinary reported issue and it belongs in the
runner project's own `docs/REPORTED-ISSUES.md`.

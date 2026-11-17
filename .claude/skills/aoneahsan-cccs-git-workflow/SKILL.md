---
name: aoneahsan-cccs-git-workflow
description: "Commit, push, sync and gitignore rules: one commit per prompt, push-don't-just-commit, merge over rebase, the private-vs-public secrets split, and the mandatory 'What to test' section every PR body carries. Use when finishing any task, before starting work in a repo, when opening or updating a PR, when a push is rejected or a merge conflict appears, or when deciding whether a project may be auto-committed."
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Git workflow

## One commit per prompt

Finish the **whole** task, then make **one** commit. Not twenty. The owner's words: _"instead of having
20/50/100 commits for 1 prompt, which is very annoying and needless."_

Exceptions: the owner asks for separate commits, or the work spans genuinely independent modules.

## Sync at both ends

State must be clean **before you start** and **after you finish** — no uncommitted changes, nothing unpushed.

```
git add <specific files>          # prefer explicit paths over -A; never blanket -A in ahsan-notebook
git commit -m "<conventional message>"   # hooks run normally — never --no-verify
git fetch <remote> <branch>
git merge <remote>/<branch>       # or fast-forward when behind-only; merge over rebase
git push <remote> <branch>
```

**Push is not optional.** A commit that only exists locally is not done. If the push is rejected: pull,
resolve conflicts, commit, push again, then confirm local and remote agree.

**Merge, don't rebase** when reconciling divergent branches — rebase only when nothing else works and no
shared history is rewritten.

🔴 **NEVER `git stash`** — any subcommand, any reason: one global stack shared by every branch and session, so a
later `pop` can apply someone else's work. Commit to `wip/<slug>` or use `git worktree add` in the workspace
`temp/` instead (`~/.claude/rules/git-workflow.md`, `one-temp-folder.md`).

🔴 **The remote is always `o`, never `origin`** (owner, 2026-11-06; never ask). Clone with `-o o`, and rename a
found `origin` on sight. It is local, so it needs no commit. Scope and the tool-owned checkouts left alone:
`~/.claude/rules-detail/git-workflow.md`.

```
git clone -o o <url>
git remote rename origin o
```

🔴 **Check the remote against the protected list before you push.** Some repos are READ-ONLY — currently the
`legaleagle*` family, which still serves a real law firm. No push, no PR, no branch, no settings change,
until the owner removes the entry: `~/.claude/rules/protected-repos.md`.

## Auto-commit, auto-push, auto-deploy — scope matters

| Location                                                                                                          | Commit + push                                                                                                                                                                                                                                                                                                                                                                                                                      | Deploy                                               |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Anything under `code/`                                                                                            | ✅ automatic, no asking, directly on the working branch                                                                                                                                                                                                                                                                                                                                                                            | ✅ automatic once gates pass                         |
| The `code` workspace ROOT itself (trackers, `PROJECT-DEPLOYMENT-STATUS.md`)                                       | ✅ commit **and push** — since 2026-08-12 it has a private remote, `code-folder-root`, with **one branch per machine**. Tracks the root only; every project folder is gitignored. 🔴 Never merge one machine's branch into another's                                                                                                                                                                                               | n/a                                                  |
| A project container — `<project>-project-root/` or `<project>-root/` (root records plus independently versioned nested repos) | ✅ initialize the container itself, ignore nested Git repos, and commit + push root-owned files to a **private repo's `project-root` branch**. Use the private product repo; for a public product, create/use its private marketing-website repo (Strata pattern). Restrict remote `o` to that branch. Unrelated history, **never merged**. Never wrap an ordinary project. | n/a                                                  |
| **`ahsan-notebook`** — the owner's PRIVATE personal notebook, and where `~/.claude` rules, skills and agents live | ✅ automatic — **never ask** (2026-07-25). 🔴 It **commits secrets by design** — never delete or redact one, never propose rewriting its history, never make it public. Commit your own paths, not `add -A`                                                                                                                                                                                                                        | n/a                                                  |
| Any of the owner's **own projects**                                                                               | ✅ work on and push directly to the decided primary branch; no PR unless explicitly requested. If protection requires it, use the configured Repository-admin bypass through ordinary `git push`, keep protection enabled for everyone else, quote `Bypassed rule violations`, and never force-push, use `--admin`, or weaken the ruleset. GitHub private visibility alone does not make it a client repo. (Confirmed 2026-08-25.) | According to the project's production-approval rules |
| Client repos and anything else outside those three                                                                | ❌ only when explicitly asked                                                                                                                                                                                                                                                                                                                                                                                                      | ❌ never automatic                                   |

The owner's direct-primary-branch authorization does not override the explicit READ-ONLY denylist or a
CLIENT project's separate workflow. Resolve ownership and the decided primary branch from project records;
do not infer either from repository visibility or a conventional branch name.

A rule change or tracker update left uncommitted is lost to the next machine — that is why those two repos
moved into the automatic column.

**Client projects are never auto-deployed**, regardless of how routine the change feels. Signed builds, store uploads, and device tests stay owner-only everywhere. **`npm publish` is automatic** for
npm packages under standing authorization (see `publishing-compliance.md`); only a brand-new package's first
publish still asks.

## .gitignore — the private/public split decides secrets

**Ask which it is, and never guess.** For a fleet pass, confirm from the remote
(`gh repo view <owner>/<repo> --json visibility`) rather than assuming.

- **Private** → tracking `.env` is the owner's deliberate choice (`git add -f .env`).
- 🔴 **Public** → never `.env`, keys or keystores; a tracked one is `git rm --cached`, ignored, and the owner told
  to **rotate** it — never rewrite history unasked.

Always-ignored patterns, Capacitor native source vs build, and re-verification: `references/procedures.md` →
".gitignore — the private/public detail" — read it before editing any `.gitignore`.

## The PR body says what to test — every PR, derived from the diff

Owner directive 2026-08-25: every PR body carries a **`## What to test`** section near the top, written from the
diff for someone who did not do the work — never a generic checklist:

- one numbered flow per user-visible change (account — **non-admin** for a gate — route, action, observable result);
- the failure paths that matter, and the seed data that must exist first;
- a regression sweep for refactors (1440 and 390 when layout is involved);
- a "known, not this PR" list, plus any environment step;
- 🔴 **kept current in the same push** — a stale test plan is trusted, so it is worse than none.

It is not the verification section (what _you_ ran). Read `references/procedures.md` → "The PR \"What to test\"
section" before writing any PR body.

For the commit-message convention, the conflict-resolution sequence and the fleet-write guard, read
`references/procedures.md`. For isolated worktrees (the parallel-agent escape hatch) and how to finish and
merge a branch, read `references/worktrees-and-branch-finishing.md`.

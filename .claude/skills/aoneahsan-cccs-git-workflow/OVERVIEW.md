# Overview — `aoneahsan-cccs-git-workflow`

## Purpose

Keeps repository history readable and local/remote state honest, and encodes which projects the agent may
commit, push and deploy without asking. It exists because a stream of micro-commits per prompt is genuinely
hard to review, and because a commit that never got pushed reads as finished work that does not exist.

## What this skill does

- Enforces **one commit per prompt**: complete the whole task first, then commit once.
- Requires local and remote to be in sync at **both** the start and the end of a task, with push treated as
  part of "done" rather than an optional follow-up.
- Gives the reconciliation order — pull, resolve, commit, push — and sets **merge over rebase**.
- Requires the remote to be `o`, never `origin`: clone with `-o o`, rename a found `origin` on sight.
- Requires the owner's own projects to use their decided primary branch directly, including ordinary pushes
  through the configured Repository-admin bypass when protection requires it; protection remains enabled,
  and force-pushes are always forbidden.
- States the auto-commit / auto-push / auto-deploy scope: everything under `code/` is pre-authorised;
  owner projects and the notebook follow their standing grants, while CLIENT and explicit READ-ONLY repos
  retain their stricter boundaries. Client projects are never auto-deployed.
- Defines the `.gitignore` contract and the private-vs-public rule that decides whether secrets are tracked,
  including what to do when a secret is already committed to a public repo.

## When it gets invoked

- Finishing any task, as the closing step after the quality gates pass.
- Starting work in a repo, to confirm a clean tree.
- A push is rejected, or a merge conflict appears.
- Creating or auditing a `.gitignore`, or setting a project up for the first time.
- Deciding whether a given project may be committed, pushed or deployed without asking.

## Where it applies

Every repository. The auto-authorisation half is location-sensitive — check where the project lives before
relying on it.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-009, R-046) and
`_source-understanding/files/prompt-logs.md` (one-commit-per-prompt, push-don't-just-commit, merge-not-rebase,
the deploy-on-my-behalf authorisation).

## Related skills

`aoneahsan-cccs-coding-standards` (the gates that must pass first) · `aoneahsan-cccs-documentation` (what gets
updated in the same commit) · `aoneahsan-cccs-packages-up-to-date` (lockfile hygiene).

## Maintenance

Re-check when the owner changes the auto-deploy scope or adds a repo whose remote is named unusually.

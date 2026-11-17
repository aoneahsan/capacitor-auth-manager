# Worktrees + finishing a branch

Folded from superpowers `using-git-worktrees` + `finishing-a-development-branch` (obra, MIT), adapted to the
owner's rules: the MAIN session owns git (agents never commit), one commit per prompt, merge over rebase, and
one-shot gates instead of a watch-mode test suite.

## When a worktree is worth it

An isolated worktree protects the current branch while risky or parallel work happens. In this ecosystem the
main use is `aoneahsan-cccs-subagent-orchestration`'s escape hatch: two agents that genuinely must touch
overlapping files each run in their own worktree, and the main session merges. For ordinary single-scope
work, no worktree is needed — work in place.

## Creating one safely

1. **Detect existing isolation first.** Never nest worktrees.
   ```bash
   GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)
   GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
   git rev-parse --show-superproject-working-tree 2>/dev/null   # non-empty = submodule, NOT a worktree
   ```
   `GIT_DIR != GIT_COMMON` (and not a submodule) → already in a linked worktree; do not create another.

2. **The harness's worktree tools** (`EnterWorktree`, an `isolation: "worktree"` dispatch flag) are for a
   sub-agent that needs isolation. They handle placement, branch creation, and cleanup; any checkout they leave
   is removed in the same task. Never mix them with raw `git worktree add` on one checkout — that creates
   phantom state the harness can't see.

3. **Your own checkout goes in the workspace's one `temp/` folder**, never beside the project and never inside
   the repo (`~/.claude/rules/one-temp-folder.md`; the gate `pretooluse-one-temp-folder.sh` refuses any other
   place). Name it for the repo, not the ticket, and reuse it for the next branch.
   ```bash
   git worktree add "<workspace>/temp/<repo>" -b "$BRANCH"
   git -C "<workspace>/temp/<repo>" switch -c "$NEXT_BRANCH" "<start>"   # the next ticket, same checkout
   ```

## Finishing the work

1. **Gates before anything.** Run the project's one-shot gates (`yarn typecheck && yarn lint && yarn build`,
   or the chosen stack's equivalents) — not a watch-mode suite. If they fail, fix first; do not proceed to
   integration.
2. **Integrate per the owner's model.** The MAIN session decides and executes — a `ccca` agent never
   commits, pushes, or merges. Options: merge back to the base branch locally (the default for work under
   `code/`, where auto-commit+push applies), keep the branch as-is, or discard. **Merge, don't rebase** when
   reconciling divergent branches (rebase only a private, unpushed local commit to fast-forward). One commit
   per prompt.
3. **Clean up the worktree** once merged (or discarded): `git worktree remove <path>`, then `git worktree prune`;
   a native tool auto-removes an unchanged worktree. A `node_modules` junction into the main clone survives the
   remove on Windows: unlink it (`cmd /c rmdir <path>\node_modules`, never a recursive delete, which follows the
   junction into the main clone), then remove the empty folder. Keep `temp/` itself. Never leave a stale worktree
   behind.

## Merging parallel-agent worktrees

When agents ran in isolated worktrees over overlapping files:
- Each agent's branch is a normal branch — merge them into the working branch one at a time in the main
  session.
- Resolve conflicts as a **union** of intent (keep both sides' real changes), never by discarding one side.
- Re-run the gates after the merges; the integration is where collisions surface, so verify before claiming
  done (`aoneahsan-cccs-verification`).

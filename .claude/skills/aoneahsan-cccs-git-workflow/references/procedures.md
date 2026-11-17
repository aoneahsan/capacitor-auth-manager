# Procedures

## Commit message convention

Conventional Commits. The type reflects the _task_, not the file types touched.

```
feat(scope): what changed and why it matters
fix(scope): the defect, stated as a defect
chore(rules): apply R-012 through R-016 (batch 3 of 10)
docs(scope): what a reader now knows that they did not before
```

The body explains **why**, not what — the diff already says what. Trailer:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Full sync sequence

**A deploy is not closed until every source repository is pushed.** In windowsweep's 1.4.5 release, four website commits were live on the site but absent from GitHub until the cross-repository sync check (2026-11-08). Check each source repo's working tree and ahead/behind count after deployment, not only the deployment URL.

```bash
git remote | grep -qx origin && ! git remote | grep -qx o && git remote rename origin o   # the standard is `o`
REMOTE=$(git remote | head -1)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

git add <paths>
git commit -m "<message>"               # hooks run normally
git fetch "$REMOTE" "$BRANCH"
git merge "$REMOTE/$BRANCH"             # fast-forward when behind-only; merge over rebase
git push "$REMOTE" "$BRANCH"
git status --short --branch             # expect '## main...o/main' with no ahead/behind
```

For the owner's own projects, this flow targets the decided primary branch directly. If protection requires
the configured Repository-admin bypass, use the same ordinary push and report any `Bypassed rule violations`
output. Never force-push, pass `--admin`, disable/edit protection, or open a PR solely to avoid protection.
CLIENT repos and the explicit READ-ONLY list retain their separate boundaries.

If merge refuses because of unstaged changes that are **not yours**, do not stash or commit them. Leave them,
and note it — you may still push when your commit is ahead and the remote has not moved.

## Deploy commands authorised under `code/`

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes     # NEVER --only firestore — it deletes indexes
wrangler deploy
```

Report deploy failures honestly with the command output. A failed deploy never invalidates the commit and
push that already happened.

## Automatic when authorized

`npm publish` for npm packages under standing authorization (see `publishing-compliance.md`) — only a
brand-new package's first publish still asks.

## Always owner-only

Signed AAB/IPA builds · Play Console / App Store / Chrome Web Store uploads · real-device testing ·
destructive infrastructure changes (deleting projects, DNS moves).

## Fleet writes must be idempotent

When one prompt writes to many repos, guard with a version marker so a re-run is a no-op:

```bash
MARK='RULE:<slug> v<YYYY-MM-DD>'
grep -q "$MARK" "$file" || cat "$block" >> "$file"
```

Two traps: some projects symlink `AGENTS.md` to `CLAUDE.md` (they are one file — the marker correctly writes
once; do not "fix" the apparent miss), and a remote may already carry an equivalent rule (resolve as a union,
never by discarding either side).

## The PR "What to test" section — the full contract (moved verbatim from SKILL.md, 2026-11-02)

Owner directive 2026-08-25: _"please make sure we always put in pr body what we need to test for this pr,
based on work done in that pr."_

Every PR body carries a **`## What to test`** section, written from the work actually in the diff — never a
generic checklist, never "smoke test the app". It is what the reviewer and the merger run before and after the
merge, so it is written for someone who did not do the work:

- **One numbered flow per user-visible change**, grouped by ticket: the account to use (a **non-admin** when a
  permission gate is involved — an admin session proves nothing about a gate), the exact route or `?param`, the
  action, and the **observable result** — what the screen shows _and_, where a write is involved, what the row
  holds.
- **The failure paths that matter** — cancel/escape, a refused write, an empty result — and the exact former
  defect a step guards ("this used to be a 400", "this value used to reset").
- **The data that must exist first** (a rejected candidate, more than 50 events, a note only one user can see) —
  seed it or say so. A step nobody can run is not a test.
- **Refactors get a regression sweep**: every surface a pure-extraction commit touched, listed, plus the widths
  when layout is involved (1440 and 390).
- **A "known, not this PR" list** — pre-existing defects a tester would otherwise attribute to the PR, each with
  its ticket — and any environment step (migrations, backfills, flags) with where it lives.
- **Kept current in the same push**: a commit that changes behaviour updates the section. A stale test plan is
  worse than none, because it is trusted.

It sits near the top, right after the summary. It is not the verification section — that records what _you_
ran, with output, and stays; this is what _they_ run.

## .gitignore — the private/public detail (moved verbatim from SKILL.md, 2026-11-02)

- **Private** → tracking `.env` and secrets is the owner's deliberate choice (`git add -f .env`). Still ignore
  everything recoverable.
- **Public** → never `.env`, never keys, never keystores. If one is already tracked, `git rm --cached` it,
  ignore it, and **tell the owner to rotate it** — history still leaks it, and rewriting history is not
  something to do unasked.

Always ignored, at root and every nested level: `node_modules/`, build output (`dist/`, `build/`, `www/`),
logs, caches, editor and OS files, plus the two custom patterns `*.ignore.*` and `project-record-ignore/`.

Capacitor projects track native **source** and ignore native **build** output.

Re-verify `.gitignore` against the project's real structure whenever tooling changes.

# Bootstrap — rebuilding the library on a machine that has none

**Last Updated:** 2026-07-29

The library is **machine-local and deliberately not in this repo** — 555 MB of third-party git repos does not
belong in the notebook. What *is* in the repo is everything needed to rebuild it exactly: `sources.json` pins
all 13 repos to a URL, branch and commit, and `machines.json` records the path each machine keeps them at.

This matters more than it used to. The core UI/UX set is **mandatory** before any design phase
(`recipes.md`), so a machine with no library cannot satisfy a rule it will be held to.

## 1 · Resolve the root — first hit wins, and never guess

```bash
# 1. the fast path: an env var in this machine's ~/.claude/settings.json
G="$AHSAN_GIT_CLONED_SKILLS"

# 2. the durable record.
#    🔴 Normalise the uname FIRST. Git Bash reports `mingw64_nt-10.0-26100`, and both Windows rows in
#    machines.json were shortened to `windows-<user>` BY HAND — so a raw `uname -s` id matches neither.
L=$(dirname "$(readlink ~/.claude/rules)")/custom-skills/aoneahsan-cccs-cloned-skills-library/references
OS=$(uname -s | tr 'A-Z' 'a-z'); case "$OS" in mingw64_nt*|msys_nt*|cygwin_nt*) OS=windows;; esac
ID="$OS-$(whoami)"                                   # e.g. darwin-pc, windows-pcs
# 🔴 `tr -d '\r'` on EVERY jq read — the winget jq emits CRLF, so a root arrives as `D:/…\r` and the
#    `-d` test fails against a directory that exists. Harmless on macOS and Linux; leave it in.
[ -d "$G" ] || G=$(jq -r --arg id "$ID" '.machines[]|select(.id==$id)|.root // empty' "$L/machines.json" | tr -d '\r')

# 2b. an id miss is EXPECTED where a row was hand-named against its own rule (windows-p52's user is `PC`):
#     fall back to the first registered root that actually exists on this filesystem
[ -d "$G" ] || G=$(jq -r '.machines[].root' "$L/machines.json" | tr -d '\r' \
                   | while read -r r; do [ -d "$r" ] && { echo "$r"; break; }; done)

# 3. the suggestion, ONLY if it happens to exist already
[ -d "$G" ] || { S=$(jq -r '.defaultSuggestion' "$L/sources.json" | tr -d '\r' | sed "s|^~|$HOME|"); [ -d "$S" ] && G="$S"; }

[ -d "$G" ] && echo "library at $G" || echo "ASK — do not invent a path"
```

🔴 **If none of the three resolves, ask the owner and stop.** Do not clone into a path you picked, and do not
clone into a git repo. Use the blocking-question form (`aoneahsan-cccs-ask-the-owner`):

> **I NEED THIS FROM YOU:** where should the cloned-skills library live on this machine?
> It is 13 third-party git repos. **~156 MB** without the quarantined aggregate, **~555 MB** with it.
> It must sit **outside every git repo** — it is machine-local and never committed.
> **Recommended:** `~/Documents/ahsan-work/git-cloned` (what the Mac uses, so paths read the same everywhere).
> Alternatives: anywhere else you prefer, or skip the 399 MB quarantined repo for now and add it later.

Blocking, because the design-phase mandate cannot be met without it and any path invented here becomes a
wrong record every later session trusts.

## 2 · Clone at the pinned commits

Pinned, not latest: every one of `CATALOG.json`'s 253 entries — its `copyNotes`, its `selfContained` flag,
its trust tier — was verified against these exact commits. Cloning latest silently decouples the catalog from
what is on disk, and nothing tells you it happened.

🔴 **On Windows, pipe jq through `tr -d '\r'` — without it the quarantine skip silently fails.** The
winget `jqlang.jq` build (1.8.2, verified 2026-07-31 on `windows-pcs`) emits **CRLF**, so the last field of
each `@tsv` line arrives as `quarantined\r`, the equality test never matches, and the loop clones the 399 MB
quarantined aggregate it was told to skip. It reports `on pin` while doing it, so nothing looks wrong. The
`tr` is harmless on macOS and Linux — leave it in on every platform.

```bash
mkdir -p "$G/_reviewed" && cd "$G/_reviewed"
jq -r '.repos[] | [.repo, .url, .commit, .trustTier] | @tsv' "$L/sources.json" | tr -d '\r' |
while IFS=$'\t' read -r repo url commit tier; do
  [ "$tier" = "quarantined" ] && { echo "skip (quarantined, 399M): $repo"; continue; }
  [ -d "$repo/.git" ] || git clone --quiet -o o "$url" "$repo" || { echo "FAILED $repo"; continue; }
  git -C "$repo" fetch --quiet o "$commit" 2>/dev/null
  git -C "$repo" checkout --quiet "$commit" && printf '%-26s on pin\n' "$repo"
done
```

The quarantined repo (`agentic-awesome-skills`, 1,894 unvetted skills, 399 MB — three quarters of the whole
library) is skipped by default. Clone it only when the owner names a skill inside it; nothing may be copied
from it without a pass through `security.md` first.

**Verify before believing it worked** — a clone that succeeded is not a library on its pins. The loop above
swallows a network failure with `|| { echo "FAILED"; continue; }` and carries on, so a repo can be missing
from an otherwise clean-looking run (`accesslint-skills` hit `Recv failure: connection was reset` on
`windows-pcs`, 2026-07-31, and succeeded on a plain retry). Count the result; do not trust the transcript:

```bash
jq -r '.repos[] | select(.trustTier!="quarantined") | [.repo, .commit] | @tsv' "$L/sources.json" | tr -d '\r' |
while IFS=$'\t' read -r repo commit; do
  printf '%-26s ' "$repo"
  [ "$(git -C "$G/_reviewed/$repo" rev-parse HEAD 2>/dev/null)" = "$commit" ] && echo "on pin" || echo "❌ DRIFTED or ABSENT"
done
```

## 3 · Record the answer — both places

**`machines.json`**, so every machine can see it and no session asks again: fill this machine's `root`,
`recordedOn`, `reposPresent`, `includesQuarantined`, `diskUsed` and `verifiedOn`. Add a new entry if the id
is absent. This file is in the repo, so it commits and travels.

**`~/.claude/settings.json`**, as the fast path — machine-local, never committed:

```jsonc
{ "env": { "AHSAN_GIT_CLONED_SKILLS": "<the path>" } }
```

Alongside the `AHSAN_NOTEBOOK` and `AHSAN_CLAUDE_CODE` entries already there. Same status as those: a
convenience, never the source of truth, because a fresh clone has the record before it has the env var.

## Refresh is a different operation — never a side effect

Bootstrapping puts the library **on its pins**. Moving the pins is a separate, explicit request.

```bash
# what has moved upstream since the pins were set
jq -r '.repos[] | [.repo, .branch, .commit] | @tsv' "$L/sources.json" |
while IFS=$'\t' read -r repo branch commit; do
  git -C "$G/_reviewed/$repo" fetch --quiet o "$branch" 2>/dev/null
  n=$(git -C "$G/_reviewed/$repo" rev-list --count "$commit..o/$branch" 2>/dev/null)
  [ "${n:-0}" -gt 0 ] && printf '%-26s %s commits behind\n' "$repo" "$n"
done
```

A refresh that moves a pin **must** re-run the catalog pass for that repo — new skills, removed skills,
changed `copyNotes`, a trust tier that no longer holds. A moved pin with a stale `CATALOG.json` is worse than
an old pin, because the catalog now describes files that are not there.

## Related

`copy-procedure.md` (using the library once it exists) · `recipes.md` (which skills a project gets) ·
`security.md` (vetting) · `sources.json` (the pins) · `machines.json` (the per-machine roots).

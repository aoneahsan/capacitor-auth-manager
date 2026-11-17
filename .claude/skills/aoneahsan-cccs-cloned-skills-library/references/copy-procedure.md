# Copying a cloned skill into a project

**Last Updated:** 2026-08-13 (§4 resolves the library root per machine instead of hardcoding the Mac's)

## 0 · Locate the library

It is **machine-local and not in the notebook repo**, so its path differs per machine and is *resolved*,
never remembered. First hit wins:

1. `$AHSAN_GIT_CLONED_SKILLS`, if set and the folder exists.
2. This machine's `root` in `references/machines.json` (id = lowercased `uname -s` + `-` + `whoami`).
3. `sources.json` → `defaultSuggestion`, **only if that folder already exists**.

🔴 **If none resolves, the library is absent: ask the owner where it should live, and stop.** Never guess a
path, and never proceed without the catalog. The full bootstrap — the blocking question, cloning all 13 repos
at their pinned commits, and recording the answer for this machine — is `references/bootstrap.md`.

```
<localRoot>/                 INBOX — an unreviewed new clone
<localRoot>/_reviewed/       reviewed repos, still git repos
```

## 1 · Audit the project first

Never propose from the project's name. Read:

| Signal | Tells you |
|---|---|
| `package.json` deps | react / next / vue · tailwind · capacitor · wxt · framer-motion / gsap |
| `pubspec.yaml` · `composer.json` | Flutter · Laravel |
| `src/` route or page count, presence of components | is this UI-heavy or a backend service |
| existing `.claude/skills/` | what is already copied — never duplicate |
| root `CLAUDE.md` "Per-Project Stack Override" | the project's chosen stack wins over any default |

A project with no UI usually needs **no cloned skills**. Say that rather than finding something to copy.

## 2 · Propose, never bulk-copy

**Codex override (owner, 2026-11-11):** select every related vetted external skill for the current phase and copy it before the first edit. No separate yes is needed. Recheck at the next phase boundary. The 3–6 guideline below is not a ceiling; relevance and vetting decide the set. Owner-created skills follow `aoneahsan-cccs-catalog/references/project-copy.md`. The proposal flow below remains for Claude Code.

Take the matching recipe from `recipes.md`, adjust to the audit, and present a **small** set — one line of
justification each, plus anything in `copyNotes`. Wait for the owner's yes. Copying "all the design ones" is
the failure mode.

🔴 **Exception — a design phase is starting.** For a click dummy, a rebuild's Phase A, a landing page or a
redesign, the **core UI/UX set in `recipes.md` is mandatory and is copied without asking.** Waiting for a yes
there produces the failure the mandate exists to stop: the design begins with two house skills loaded, no
external craft, and a page that clears every gate and reads as templated. Everything beyond that set is still
proposed and still waits.

Refuse a `quarantined` or `excluded-by-policy` source unless the owner names the specific skill; then run
`security.md` on that folder first.

## 3 · Vet

`security.md` checklist, on each folder being copied. Non-negotiable for anything below the `official` /
`vendor` tiers.

## 4 · Copy

🔴 **Resolve the library root — never hardcode it.** Only the Mac keeps it at
`~/Documents/ahsan-work/git-cloned`; the other three registered machines do not, so a hardcoded `LIB=` makes
this procedure fail everywhere else.

🔴 **And an id derived mechanically cannot be joined against a registry whose ids were normalised by hand.**
`machines.json`'s `idRule` claims the id "needs no lookup table", but Git Bash reports
`mingw64_nt-10.0-26100` and both Windows rows were shortened to `windows-<user>` **by hand** — and
`windows-p52`'s user is `PC`, so even a normalised id misses that row. Two of the four registered machines
are therefore unreachable by id alone. Hence the `uname` normalisation **and** the existing-root fallback
below; neither is decoration.

```bash
LIB="$AHSAN_GIT_CLONED_SKILLS"
REFS=$(dirname "$(readlink ~/.claude/rules)")/custom-skills/aoneahsan-cccs-cloned-skills-library/references

# 1 · the id — normalise the uname the registry shortens by hand, or no Windows row can ever match
OS=$(uname -s | tr 'A-Z' 'a-z'); case "$OS" in mingw64_nt*|msys_nt*|cygwin_nt*) OS=windows;; esac
ID="$OS-$(whoami)"

# 🔴 every jq read here is CR-stripped. The winget jq on Windows emits CRLF, so `.root` arrives as
#    `D:/work/git-cloned-skills\r` and EVERY `[ -d ]` test fails against a directory that exists.
[ -d "$LIB" ] || LIB=$(jq -r --arg id "$ID" '.machines[]|select(.id==$id)|.root // empty' "$REFS/machines.json" | tr -d '\r')

# 2 · an id miss is EXPECTED on Windows (see above), so fall back to the first registered root that
#     actually exists here — a registered path present on this filesystem is this machine's library
[ -d "$LIB" ] || LIB=$(jq -r '.machines[].root' "$REFS/machines.json" | tr -d '\r' \
                       | while read -r r; do [ -d "$r" ] && { echo "$r"; break; }; done)

# 3 · bootstrap.md's third step: the suggestion, ONLY if it already exists
[ -d "$LIB" ] || { S=$(jq -r '.defaultSuggestion' "$REFS/sources.json" | tr -d '\r' | sed "s|^~|$HOME|"); [ -d "$S" ] && LIB="$S"; }

[ -d "$LIB" ] || { echo "no library on this machine — see bootstrap.md, and ASK rather than inventing a path"; exit 1; }
LIB="$LIB/_reviewed"
```

Proven on `linux-ahsan` 2026-08-13 in all four directions: env set → resolves · env unset → resolves by id ·
a registry whose roots do not exist → **refuses**, exit 1 · a `\r`-suffixed root → fails the `-d` test
without `tr -d '\r'` and resolves with it.

```bash
SRC="$LIB/<sourceRepo>/<dirname of .path>"     # e.g. .../taste-skill/skills/taste-skill
DST=.claude/skills/<copyAs>                    # e.g. .claude/skills/ext-taste-design-taste-frontend
mkdir -p "$(dirname "$DST")" && cp -R "$SRC" "$DST"
```

Then **drop weight that is not needed** — unused `scripts/`, `assets/`, screenshots, `.git*`, other agents'
copies (`.factory/`), and any bundled executable the skill will not actually run.

## 5 · Rewrite — the step that is always required

### 5a · Frontmatter `name` MUST equal the folder name

The Agent Skills spec requires `name:` to match its parent directory. Renaming the folder to `ext-*` without
rewriting the frontmatter produces a skill that **fails discovery silently**.

```bash
python3 - "$DST" <<'PY'
import re, sys, pathlib
d = pathlib.Path(sys.argv[1]); p = d / "SKILL.md"
s = p.read_text()
s2 = re.sub(r"(?m)^name:.*$", "name: %s" % d.name, s, count=1)
p.write_text(s2)
print("name ->", d.name)
PY
```

Keep the original name visible in the body or in `metadata:` so provenance is not lost.

### 5b · `${CLAUDE_PLUGIN_ROOT}` and absolute paths

`CLAUDE_PLUGIN_ROOT` is **unset** for a plain `.claude/skills/` skill, so any path built from it collapses
and the command fails — usually *silently*, with the skill carrying on without its data. Rewrite every such
invocation to a path relative to the skill folder, then **prove it runs** (step 6).

`ui-ux-pro-max` is the known case — **11 occurrences in its `SKILL.md`**, and it also calls `python`, which
**does not exist on this machine** (only `python3`). Both must be rewritten together, or the fix looks
applied and the command still fails:

```bash
python3 - "$DST" <<'PY'
import re, sys, pathlib
d = pathlib.Path(sys.argv[1]); p = d / "SKILL.md"
s = p.read_text()
s = re.sub(r"(?m)^name:.*$", "name: %s" % d.name, s, count=1)
s = s.replace('python "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py"',
              'python3 ".claude/skills/%s/scripts/search.py"' % d.name)
s = s.replace('${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max', '.claude/skills/%s' % d.name)
p.write_text(s)
PY
grep -c 'CLAUDE_PLUGIN_ROOT' "$DST/SKILL.md"   # must be 0
```

Verified end to end on 2026-07-27: after this rewrite, `search.py … --design-system` returns a full design
system — pattern, style, palette with CSS variable names, font pairing with its Google Fonts URL, effects,
and anti-patterns.

### 5c · Trim the description if it swallowed the procedure

House rule: a `description` states capabilities and triggers, not the workflow. Leave third-party wording
alone unless it is actively misleading in this project.

## 6 · Verify — before claiming it is installed

1. `grep -n '^name:' "$DST/SKILL.md"` equals the folder name.
2. `grep -rn 'CLAUDE_PLUGIN_ROOT' "$DST"` returns nothing.
3. **Every retained script actually runs.** For `ui-ux-pro-max`, run one real query and confirm it returns
   data:
   ```bash
   python3 .claude/skills/ext-uiuxpm-ui-ux-pro-max/scripts/search.py "saas dashboard" --design-system
   ```
   If it cannot run (no Python 3, missing data), **say so plainly** and either drop the skill or keep it
   documented as prose-only. Never report a skill as working on the strength of the copy succeeding.
4. No secret, `.env`, or credential came along: `find "$DST" -name '.env*' -o -name '*.pem' -o -name '*.key'`.

## 7 · Record it

Write `.claude/skills/EXTERNAL-SKILLS.md` (create or append):

```markdown
# External skills copied into this project

Copied from the local cloned-skills library. Full catalog + vetting rules:
`aoneahsan-cccs-cloned-skills-library`. These are FORKS — they do not auto-update.

| Skill folder | Source repo | Source commit | Copied | Why | Fixups applied |
|---|---|---|---|---|---|
| `ext-uiuxpm-ui-ux-pro-max` | nextlevelbuilder/ui-ux-pro-max-skill | `3b5df75` | 2026-07-27 | palette + UX-guideline database | folder renamed, `name:` rewritten, `CLAUDE_PLUGIN_ROOT` → relative; search verified |

**Re-sync:** `git -C <localRoot>/_reviewed/<repo> pull`, re-vet, re-copy, re-apply the fixups above.
```

## 8 · Leave it staged, git-tracked

`.claude/skills/` is committed with the project. Stage the new paths and let the project's normal
one-commit-per-prompt flow carry them. Do not create a separate commit.

---

## Re-audit mode — a new clone appeared

1. Anything at `<localRoot>/` root (not in `_reviewed/`) is unreviewed.
2. Read its README and a representative `SKILL.md`; run the `security.md` scan over the whole repo.
3. Dedupe by **content hash**, not path — repos ship the same skill 3–4×; keep the shallowest path.
   Skip `test/`, `example/`, `fixtures/` directories: they hold deliberately-broken linter fixtures.
4. Extract frontmatter. If `name:` is not a valid slug (`[a-z0-9]+(-[a-z0-9]+)*`, ≤64 chars), fall back to
   the directory name — some upstream skills put a human title there.
5. Assign a trust tier and a **stable** `COPY_SLUG`; add rows to `CATALOG.json` and `sources.json`, and a
   section to `repos.md`.
6. `mv <repo> _reviewed/`, and re-date the scan-results table in `security.md`.

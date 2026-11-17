# Codex skill gate — checks and fallbacks

## States

| State | Meaning | Action |
|---|---|---|
| `current` | copy hash = notebook hash (`custom-skills/SKILLS-INDEX.json`) | use it |
| `stale` | copy unchanged since it was copied, notebook moved on | `add` replaces it |
| `modified` | copy differs from every notebook version | keep it; diff, merge the source change, record the fix in `localFixups` |
| `orphan` | the skill no longer exists in the notebook | leave it; report it |
| missing | needed by the phase, not in the repo | `add` copies it |

The hash is sha256 over each file's relative path and git blob id (`skillhash.py`). Caches such as
`__pycache__` and `*.pyc` are skipped. A repo with no manifest yet is judged against every committed notebook
version of the skill.

## Manual fallback (no Python on the machine)

1. Compare `diff -r ~/.agents/skills/<name> .claude/skills/<name>`. No output means it is current.
2. Copy the whole source folder: `cp -R ~/.agents/skills/<name>/. .claude/skills/<name>/`. Never a symlink to
   the global folder.
3. Public or client repo: add `/.claude/skills/aoneahsan-cccs-*/` and `/.claude/skills/SKILLS-MANIFEST.json`
   to `.git/info/exclude` before anything else.
4. Run the tool on the next machine that has Python, so the manifest catches up.

## What the gate never does

- It never overwrites a `modified` copy, deletes a team's skill, or commits in a client or public repo.
- It never copies a skill into `*-old` reference trees or a client root (sngdc-root).
- It never treats the project copy as the source. The notebook's `custom-skills/` is the source.

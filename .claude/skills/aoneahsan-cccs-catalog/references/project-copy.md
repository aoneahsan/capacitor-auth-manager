# Project copies of owner-created skills

**Last updated:** 2026-11-16

On 2026-11-11 the owner chose to copy every related `aoneahsan-cccs-*` skill into each project, so Codex works
from the same skills Claude Code has. On 2026-11-16 he made the copies versioned, profiled and private-safe.
The notebook's `custom-skills/` stays the source. A project copy is a pinned fork for that project. A global
link alone does not satisfy the project-copy gate.

## The law (owner, 2026-11-16)

1. **Own private repo:** copies are committed and pushed with the work.
2. **Own public repo** (every docs site, public packages and apps): copies stay **local**. They are hidden by
   `.git/info/exclude` (`/.claude/skills/aoneahsan-cccs-*/`, `/.claude/skills/SKILLS-MANIFEST.json`), and a
   tracked owner skill is untracked (`git rm --cached`; history is never rewritten). The backup is committed
   in the project's private container (`project-root` branch) under `.claude/skills-backup/<folder>/`, or in a
   private sibling repo when the root has no private container.
3. **Client repo** (any repo not owned by aoneahsan or outside `~/Documents/01-code`; sngdc-root; every
   Shortlists repo): our skills are **never committed or pushed**. Copy only when the team does not track
   `.claude/skills`, and always hide the copies with `.git/info/exclude` (local, no team file changes). If
   the team tracks skills there, copy nothing and work from the global skills.
4. **Cadence:** every repo is checked every 15 days and is never more than 30 days old. Codex also checks on
   every phase (`aoneahsan-cccs-codex-skill-gate`).
5. **Never edit a copy silently.** A project fix is recorded under `localFixups` in the manifest. A modified
   copy is never overwritten, only reconciled by hand.

## Which skills go where

`global-config/skill-profiles.json` is the profile data. Each kind (app, docs site, container root) has a base
set, plus every add-on its files trigger (dependencies, config files, folders). Stack skills go only into the
nested repo that has that stack. The container gets coordination skills, which keeps each session's skill
listing small. Skills a repo's `AGENTS.md`/`CLAUDE.md` names, and its manifest `pinned` list, are always kept.
`*-old` reference trees never get copies.

## Versions

- A skill's version is a 16-hex content hash: sha256 over each file's relative path and git blob id, with
  caches skipped (`global-audit-reports-records/project-skills-sync/skillhash.py`).
- `custom-skills/SKILLS-INDEX.json` holds every skill's current hash. `/sync-project-skills` regenerates it.
- `<repo>/.claude/skills/SKILLS-MANIFEST.json` holds, per copy, `sourceHash`, `copiedHash`, `copiedAt` and
  `state`, plus `profile`, `lastChecked`, `nextDue`, `pinned` and `localFixups`.
- **States:** `current` (copy = notebook). `stale` (copy = the hash it was copied at, or equal to a past
  notebook version; replaced). `modified` (equals no notebook version; kept and reported). `orphan` (the skill
  left the notebook).
- A copy outside the profile is pruned only when it is `current` or `stale` and named nowhere.

## The tools

`T="$(dirname "$(readlink ~/.claude/rules)")/global-audit-reports-records/project-skills-sync/project-skills-sync.py"`

| Need | Command |
|---|---|
| Whole fleet (or one root) | `/sync-project-skills` → `python3 "$T" sync [--only <root>] [--due]` |
| One repo's state | `python3 "$T" status <path>` |
| Add or refresh named skills in a phase | `python3 "$T" add <path> <skill> ...` |
| Regenerate the version index | `python3 "$T" index` |

Every copy is the **entire source folder** (`SKILL.md`, `OVERVIEW.md`, `FLOW.mmd`, `references/`, `assets/`),
real files, never a symlink to the global folder. Codex discovers them through machine-local links
`.agents/skills/<name>` → `.claude/skills/<name>`, kept out of git by `.git/info/exclude`.

## Verify before work begins

The tool checks all of these on every copy. Without the tool, check them by hand:
1. The copied `SKILL.md` frontmatter `name:` equals the folder name, and `OVERVIEW.md` and `FLOW.mmd` exist.
2. Every relative path the skill references resolves inside the copy. Inspect any executable before running it.
3. No secret-shaped text, and no private material in a repo that could become public.
4. The `.agents/skills/<name>` link resolves. Until it does, load the local `SKILL.md` directly.
5. Review `git diff` and stage only skill files you own, by the repo's law above.

Vetted external skills follow `aoneahsan-cccs-cloned-skills-library/references/copy-procedure.md` and keep
their `ext-*` names. Codex copies every related vetted external match without another approval. Quarantined,
paid or unsafe sources stay blocked by their existing gates. Client and public repos follow the same
privacy law for them.

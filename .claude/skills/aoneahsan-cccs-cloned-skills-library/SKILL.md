---
name: aoneahsan-cccs-cloned-skills-library
description: 'The local library of third-party Agent Skills cloned from 13 repos, and the per-project copier that installs a vetted subset into a project''s own .claude/skills/. Use when asked to copy required skills from the git-cloned skills, deciding which a project gets, updating the catalog, or vetting a third-party skill.'
metadata:
  libraryRoot: per-machine — resolve it, never hardcode. $AHSAN_GIT_CLONED_SKILLS, then references/machines.json
  catalogued: "253"
  quarantined: "1894"
  reviewedOn: "2026-07-27"
---

# Cloned skills library

A machine-local collection of third-party skills, catalogued and safety-screened, that projects **copy
from** — never a set of globally installed skills.

## The law

**Nothing here is installed globally.** Skills are copied into a project's own `.claude/skills/`, renamed
`ext-<source>-<skill>`, and committed with that project. A copy is a **fork, not a subscription**: it never
auto-updates, which is what makes it safe.

The house `aoneahsan-cccs-*` family always wins on **decisions** (stack, zero-cost, storage, responsive
floor, palette registry). A cloned skill contributes **craft depth or a current third-party API** — nothing
else justifies copying one.

## Where everything is

| Need | File |
|---|---|
| Which skills does this project need | `references/recipes.md` — **start here** |
| Is this source trustworthy, what did it ship | `references/repos.md` |
| Can I trust this specific skill | `references/security.md` |
| How do I actually copy it | `references/copy-procedure.md` |
| Every catalogued skill, queryable | `references/CATALOG.json` — **query with `jq`, never read whole** (147 KB) |
| Repo URLs + pinned commits, to rebuild the library | `references/sources.json` |
| The quarantined names | `references/quarantined-index.txt` |
| **This machine has no library** | `references/bootstrap.md` — resolve the root, else **ask the owner and stop**; then clone all 13 repos at their pinned commits and record the path in `references/machines.json` |

## The flow

1. **Audit the project** — stack, whether it is UI-heavy, what is already in `.claude/skills/`.
2. **Propose a small set** from `recipes.md`, one line of justification each. **3–6 skills is a good
   project.** Wait for a yes.
   **Codex override (owner, 2026-11-11):** copy every related vetted external skill before the matching phase's first edit, without a separate yes. The 3–6 count is a context guideline, not a cap that permits omitting a match. Claude Code keeps the proposal flow.
   🔴 **One exception — when a design phase is starting** (a click dummy, a rebuild's Phase A, a landing page,
   a redesign), the **core UI/UX set is mandatory**: copy it before the first line of markup rather than
   proposing it. It is four skills, so this sits inside the budget above, not against it. `recipes.md`.
3. **Vet** each one against `security.md`.
4. **Copy, then rewrite** — folder → `copyAs`, frontmatter `name:` → the same value, and every
   `${CLAUDE_PLUGIN_ROOT}` path → skill-relative.
5. **Verify by running it**, not by observing that the copy succeeded.
6. **Record** in the project's `.claude/skills/EXTERNAL-SKILLS.md` and leave staged.

Full commands, the frontmatter rewrite, and re-audit mode for a newly cloned repo:
`references/copy-procedure.md`.

## Common mistakes

- **Renaming the folder without rewriting `name:`.** The spec requires them to match; a mismatch fails
  discovery *silently*. Every copy needs this.
  🔴 **And the old `name:` is often not the old folder name.** `taste-skill/` declared
  `name: design-taste-frontend`, so a rewrite keyed on the folder name matched nothing, the `cp` succeeded,
  and the skill would never have been found (wakalat, 2026-07-31). **Verify per skill after copying** —
  compare the frontmatter to the folder, don't assume the edit landed.
- **Trusting `${CLAUDE_PLUGIN_ROOT}`.** It is unset for a plain `.claude/skills/` skill, so the command
  fails and the skill carries on without its data. `ui-ux-pro-max` is the known case.
- **Copying everything in a category.** Each skill costs context in every session of that project.
- **Copying what the house family already owns** — `frontend-design`, responsive, a11y primers, state/query
  /table/form skills. `recipes.md` lists the full don't-copy set.
- **Touching the quarantine.** 1,894 unvetted skills; the owner must name one, and it is vetted first.
- **Reporting success from a successful `cp`.** If a bundled script cannot run here, say so.

## Related skills

`aoneahsan-cccs-design-process` (the design pipeline these UI/UX skills serve) ·
`aoneahsan-cccs-frontend-design` · `aoneahsan-cccs-project-understanding` (the audit gate) ·
`aoneahsan-cccs-ask-the-owner` (a quarantined or policy-excluded request pauses).

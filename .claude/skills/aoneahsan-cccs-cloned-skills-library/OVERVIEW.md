# Overview — `aoneahsan-cccs-cloned-skills-library`

## Purpose

The owner clones third-party Agent Skill repos into one machine-local folder so their craft can be reused
across projects. Left alone that folder is unusable and unsafe: 6,618 `SKILL.md` files that collapse to 253
distinct skills, plus 1,894 more from a single unvetted aggregator, with no index, no provenance, and no
safety review. This skill is the index, the safety gate, and the copier — so a project gets the few external
skills it genuinely benefits from, vetted, path-fixed, and committed with the project rather than installed
globally for every session everywhere.

## What it does

- Holds the deduped catalog of every distinct cloned skill: source, path, category, trust tier, licence
  posture, bundled-script count, copy blockers, and the exact `ext-<source>-<skill>` name to copy it as.
- Records what each of the 13 source repos actually is — standout skills, quality read, gotchas, and what to
  deliberately ignore.
- Carries the vetting checklist derived from Snyk's ToxicSkills research, plus the dated scan results for the
  library at its pinned commits.
- Maps project types to a small recommended skill set, and names what must **not** be copied because the
  house family already owns it.
- In Codex, copies every related vetted external skill before the matching phase; owner-created skills follow `aoneahsan-cccs-catalog/references/project-copy.md`.
- Defines the copy procedure, including the two rewrites that are always required (frontmatter `name`, and
  `${CLAUDE_PLUGIN_ROOT}` paths) and the run-it-to-prove-it verification.
- Defines re-audit mode: what to do when a new repo is cloned into the inbox.
- Pins every source repo and commit so the whole library can be rebuilt on another machine.

## When it is invoked

- "copy required skills from git cloned skills" · "copy the skills this project needs"
- "which cloned skills does this project need" · "what external skills should this project have"
- "I cloned another skills repo — update your understanding" · "re-audit the cloned skills"
- "is this third-party skill safe to use" · "vet this skill before we copy it"
- Whenever a project's `.claude/skills/` is being set up, extended, or re-synced.
- Whenever a skill from the quarantined aggregator is named — it pauses for the owner and vets first.

## What it deliberately does not do

Install anything globally · auto-update a copied skill · propose from the quarantine · copy a skill whose
capability the house `aoneahsan-cccs-*` family already covers · commit on its own.

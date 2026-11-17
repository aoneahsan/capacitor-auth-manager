---
name: aoneahsan-cccs-codex-skill-gate
description: 'Codex''s skill gate in every project: before material work and each new phase (new package or stack, UI screen, backend, database, store, content, release), find the owner skills the phase needs, check the project copy against the notebook hash, copy or refresh it by the repo''s privacy law (own private, own public, client), then read it fully before editing. Use at the start of any Codex session, at every phase change, or when a skill seems missing or stale.'
---

# Codex skill gate

Claude Code gets every owner skill from `~/.claude/skills`. Codex works from the project and has a shorter
startup list, so the same prompt gave weaker results there. This gate closes that gap: **no phase starts in
Codex until its skills are in the project, current, and read.**

Law: `~/.claude/rules/project-skill-copies.md`. Tool:
`T="$(dirname "$(readlink ~/.claude/rules)")/global-audit-reports-records/project-skills-sync/project-skills-sync.py"`.

## When it runs

- At the start of material work in a repository.
- At every phase boundary. A new dependency, framework or stack. A new UI screen or redesign (click dummy
  first). Backend, edge function, database or migration work. Payments, plans, store or release work.
  Reader-facing words. SEO.
- When a needed skill is missing, or the session start says the skills check is due.
- Trivial exceptions only: typo, rename, read-only Q&A.

## The five steps

1. **Name the phase concerns.** Map each one to skills with `~/.claude/rules/skill-bindings.md` and
   `global-config/skill-profiles.json`. Examples: a new `@tanstack/react-table` needs `react-tables-tanstack`.
   A new screen needs `click-dummy` plus the whole design loadout. A table change needs `supabase`,
   `supabase-schema-design` and `drizzle-orm`. A store listing needs `store-listing-assets`. Any words a person
   reads need `custom-made` and `copywriting`.
2. **Check the project.** Run `python3 "$T" status .` to see the repo's privacy law, its profile, and every
   copy that is `current`, `stale`, `modified` or missing.
3. **Copy or refresh.** Run `python3 "$T" add . <skill> [<skill> ...]` for every phase skill that is missing
   or stale. It copies the whole folder from the notebook, verifies it (frontmatter name, OVERVIEW/FLOW,
   secret scan), records its hash in `.claude/skills/SKILLS-MANIFEST.json`, and links it into
   `.agents/skills/` for discovery. A `modified` copy is never overwritten. Diff it against the notebook,
   keep its recorded project fix in `localFixups`, and merge the source change in by hand.
4. **Read before editing.** Open each phase skill's `SKILL.md` completely, plus the `references/` it says to
   read. State the loadout and which later-phase skills you are deferring.
5. **Finish by its law.** In an own private repo, commit `.claude/skills/` with the task's one commit. In an
   own public repo or a client repo, never commit the copies. The tool hides them with `.git/info/exclude`,
   and `/sync-project-skills` backs up public-repo copies in the private container.

## Privacy, the hard part

- **Client repo:** copy only when the team does not track `.claude/skills`. The tool refuses otherwise; then
  work from the global skills. The copies are always hidden and never committed. A client must never receive
  our skills. Shortlists repos are client repos for this rule.
- **Own public repo:** the copies are local only. A tracked owner skill there is a leak: the tool untracks it.
- **Own private repo:** commit and push as usual.

## When the notebook has no such skill

Say so in the loadout line. Use the nearest owner skill plus the project's own docs, never no skill at all.
Report the gap so a skill can be written.

Detail, edge cases and the manual fallback without Python: `references/checks.md`.

---
name: aoneahsan-cccs-catalog
description: 'Find and load the right owner-created skills, agents, rules, and commands. Use at the start of substantive Codex project work, when the startup skill list is shortened, or when a task crosses domains.'
---

# Fleet capability catalog

All owner-created skills are linked into `~/.agents/skills/` in Codex and `~/.claude/skills/` in Claude Code. The Codex startup listing has a finite budget; an omitted description does not mean the skill is absent. Treat the installed source-derived set as the inventory, not the startup list.

1. Identify the current task and phase. Read `~/.claude/rules/skill-bindings.md` for the domain map when available, then search skill frontmatter descriptions under `~/.agents/skills/aoneahsan-cccs-*/SKILL.md` or the repository's `custom-skills/` directory. Use the project-selected stack and project instructions to narrow the matches; check current-API third-party skills when the domain calls for one.
2. Name the active loadout and later-phase matches deferred. Read every current-phase matching `SKILL.md` completely and follow the supporting references it requires. Re-check the inventory and load the newly applicable skills before the first edit of each later phase.
   In Codex, copy every related owner-created skill folder into the project before that phase's first edit. Read `references/project-copy.md` for the full-folder copy, provenance, privacy and discovery checks. The global source remains authoritative.
3. For reusable actions, inspect `~/.claude/commands/` and the matching Codex command skill. For delegation, inspect `custom-agents/README.md` and the installed agent descriptions. Read the applicable rule pointer in `~/.claude/rules/` and its triggered detail file.

Do not substitute this catalog for the selected skill's instructions. If an installation path is missing, resolve the repository through `~/.claude/rules` and report the missing link for the machine sync.

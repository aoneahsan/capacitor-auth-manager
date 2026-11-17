---
name: aoneahsan-cccs-commands
description: 'Run a repository-owned Claude Code command workflow from Codex, including complete-project, project audits, machine setup, context audits, and story commands. Use when the owner names one of these commands or asks for its equivalent in Codex.'
---

# Shared command workflows

The canonical command definitions live in `~/.claude/commands/`, linked from this repository. Codex does not automatically load Claude's command directory. When the owner requests one of the workflows below, read the named Markdown file completely and execute its procedure using Codex tools and the installed custom skills. Treat `$ARGUMENTS` as the user's arguments; load skills by reading their `SKILL.md` files; map `AskUserQuestion` to the available main-thread user-input mechanism (or ask in the main thread when no structured tool is available). Honor every applicable approval gate. If the file is missing, use the matching repository file under `commands/` and report the broken machine link.

| Request | Canonical command |
|---|---|
| Complete a production project (`full`, `resume`, `audit`, or `skip:<commands>`) | `complete-project.md` |
| Finalization and project audits | `finalize-project.md`, `product-audit.md`, `search-audit.md` |
| Context inventory or repair | `context-audit.md`, `context-fix-project.md`, `fix-context.md` |
| Firebase Hosting audit | `hosting-audit.md` |
| Machine setup or sync | `setup-machine.md`, `sync-all.md` |
| Production repos to GitHub / clone them on another machine | `sync-production-projects.md`, `clone-sync-production-projects.md` |
| Owner-skill copies in every production repo (versioned, private-safe) | `sync-project-skills.md` |
| Stack audit | `stack-audit.md` |
| Story workflow | `story-init.md`, `story-write.md`, `story-review.md`, `story-finalize.md` |
| Personal or project voice calibration | `voice-calibrate.md` |

Read the requested command first; if it is `complete-project.md`, follow its queue instruction and read every queued command. Commands remain normal Claude slash commands on Claude Code. In Codex, invoke this skill explicitly as `$aoneahsan-cccs-commands` with the command name and arguments when automatic routing does not select it. This is the Codex entry point, not a native Codex slash command.

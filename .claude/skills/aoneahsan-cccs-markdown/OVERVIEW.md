# Markdown — overview

## Purpose

Markdown is the format almost every artefact in the fleet ships in — package READMEs, docs sites, changelogs,
the rules and skills themselves — and until now nothing said how to write it. The result was measurable
drift: a survey of the owner's 14 published npm packages found READMEs from 57 to 829 lines, **not one with a
table of contents**, two with a logo, six with no badges, and the filename itself split eight `Readme.md` to
six `README.md` while several `files` arrays declared `"README.md"` — a mismatch that resolves on macOS and
misses on case-sensitive CI.

The anchor half of this skill exists because of a **live renderer probe on 2026-07-25**, not a preference.
npmjs.com generates **no heading ids at all**, so a README that relies on auto-slugs has dead fragment links
the moment it leaves GitHub. And GitHub slugifies an emoji heading unguessably — `## ❓ FAQ` becomes `#-faq`.
An explicit `<a id>` is the only form that works in both places, and it is what makes the owner's
one-emoji-per-H2 house style safe.

## What this skill does

- Splits every markdown file into **public** (anchors + TOC required) and **internal** (same style rules, no
  anchor ceremony), keyed on who reads the file rather than on where it sits.
- Gives the single mechanical **anchor contract** — `<a id="slug"></a>` above the heading, `[#](#slug)` after
  the text — with the probe results that prove why each half is needed.
- Bans duplicate headings, because two identically-named sections collide on one id.
- Sets the table-of-contents rule (H2s only, above the first H2, regenerated with any heading change).
- Fixes heading hierarchy: one H1, no skipped levels, one emoji per H2 from the shared section map, plain H3+.
- Draws the link rule that catches people out: **relative inside a repo, absolute for anything reachable from
  npmjs.com**, because npm renders a README outside its repo.
- Requires a language on every code fence, tables for anything enumerable, alt text and explicit widths on
  images, and the right callout syntax per renderer.
- Fixes file naming and the metadata each tier owes — `Last Updated` internally, `title`/`description` front
  matter on docs-site pages.
- States the **single-home rule**: a fact lives in one section, everything else links to it.

## When it gets invoked

- Writing or editing any `.md` / `.mdx` file in any project.
- Adding, renaming, reordering or removing a heading — the TOC and anchors move with it.
- "the link in the readme doesn't jump" / a fragment that scrolls nowhere.
- Choosing between a GitHub alert and a Docusaurus admonition.
- A document long enough to need a table of contents.
- Any package README work (with `aoneahsan-cccs-npm-package-readme`, which owns the section order).

## Where it applies

| Scope | Applies |
|---|---|
| Project types | every project, every stack — markdown is stack-independent |
| Stack override | none needed; where a stack has its own doc format (dartdoc, rustdoc), that format wins for API docs and this skill still governs the repo's `.md` files |

## Sources

| Source | Record |
|---|---|
| 14-package README survey, 2026-07-25 | `_source-understanding/projects/npm-package-survey.md` |
| Live renderer probe (GitHub + npmjs.com), 2026-07-25 | same record, "Renderer probe" section |
| Owner decisions, 2026-07-25 | explicit-anchor + visible `#`; one emoji per H2; public-files-only scope |

## Related skills

- `aoneahsan-cccs-npm-package-readme` — the canonical README section order and the section→emoji map
- `aoneahsan-cccs-copywriting` — the prose written inside these structures
- `aoneahsan-cccs-documentation` — the brevity budget, fixed paths, CLAUDE/AGENTS mirroring
- `aoneahsan-cccs-docusaurus` — docs-site front matter, admonitions, sidebars

## Maintenance

- **Living registries this skill points at:** none — it is self-contained.
- **Re-probe when a renderer changes.** The anchor contract rests on GitHub and npm behaviour measured on
  2026-07-25. If either platform starts emitting heading ids or drops the `user-content-` clobber, re-run the
  probe in `references/renderers.md` and update the table.
- **Last reviewed:** 2026-07-25

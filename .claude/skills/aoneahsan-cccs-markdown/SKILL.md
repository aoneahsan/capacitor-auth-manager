---
name: aoneahsan-cccs-markdown
description: 'Markdown authoring: the heading-anchor contract making every section linkable, tables of contents, heading hierarchy and the section emoji map, code fences, links that survive being rendered off-repo, callouts, images, and renderer differences between GitHub, npmjs.com, Docusaurus and VS Code. Use for any .md or .mdx file.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/projects/npm-package-survey.md + live renderer probe 2026-07-25
---

# Markdown

Two tiers, and which one applies is decided by **who reads the file**:

| Tier | Files | Rules |
|---|---|---|
| **Public** | package `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, public-repo root docs, docs-site `.md`/`.mdx` | everything below, **including anchors + TOC** |
| **Internal** | `CLAUDE.md`, `AGENTS.md`, `~/.claude/rules/*.md`, a project's `docs/**`, trackers | everything below **except** anchors + TOC |

Internal files are read top-to-bottom by agents and cost context on every load; anchor ceremony there is noise.

## The anchor contract — public files only

Every heading below the H1 gets an explicit id and a visible permalink. Exactly one form, so it is mechanical:

```markdown
<a id="quick-start"></a>
## 🚀 Quick Start&nbsp;[#](#quick-start)
```

The slug is kebab-case of the heading text **with the emoji dropped** — `🚀 Quick Start` → `quick-start`.
Link to it as the bare `#quick-start`; never write `user-content-` yourself.

**This is mandatory, not decorative — proved live on 2026-07-25:**

| | GitHub | npmjs.com |
|---|---|---|
| Explicit `<a id>` survives | ✅ rewritten to `user-content-<id>` | ✅ rewritten to `user-content-<id>` |
| Bare `#fragment` resolves | ✅ (client shim) | ✅ (client shim) |
| **Auto-generated heading ids** | ✅ | ❌ **none at all** |

So on **npmjs.com a README's `#fragment` links work only if the anchor is explicit.** And GitHub slugifies an
emoji heading unguessably — `## ❓ FAQ` becomes `#-faq`, with a leading hyphen where the emoji was. The
explicit id is what makes the emoji safe.

**Duplicate headings are banned** — two `## Links` sections collide on one id and the second is unreachable.
Use `id` (on `<a>`, HTML5 `name` is obsolete). Details + a worked file: `references/anchors-and-toc.md`.

## Table of contents

Public files over ~100 lines carry one, built from the **H2 set only**, linking the explicit ids, sitting
directly above the first H2. Regenerate it in the same edit that adds, removes or renames a heading — a
drifted TOC is worse than none.

## Headings

Exactly one H1. Never skip a level. **One emoji per H2**, from the fixed section map in
`aoneahsan-cccs-npm-package-readme`; H3 and deeper stay plain. A heading always has content under it.

## Links

- **Relative inside a repo** (`./docs/guide.md`) — survives renames, and the build checks it.
- **Absolute for anything reachable from npmjs.com.** npm renders the README outside the repo, so a relative
  link there is dead. In a package README every link but a same-file fragment is absolute.
- A bare URL appears once per document; elsewhere it is a labelled link.

## Elements

Code fences **always** name a language — an unlabelled fence loses highlighting and tells a reader nothing.
Shell blocks show the command, never a pasted transcript. Anything enumerable is a table. Images carry alt
text and an explicit `width`, from an SVG master. Callouts are `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]` on
GitHub and npm but `:::note` admonitions in a docs site — not interchangeable. Full syntax and the renderer
matrix: `references/elements.md`, `references/renderers.md`.

## Naming, metadata, single-home

`README.md`, `CHANGELOG.md`, `CONTRIBUTING.md` in caps; `LICENSE` with no extension. **Casing is not
cosmetic** — a `files` array declaring `"README.md"` beside a tracked `Readme.md` resolves on macOS and
misses on case-sensitive CI. Internal docs carry `Last Updated: YYYY-MM-DD`; docs-site pages carry `title` +
`description` front matter, without which the page is unsearchable.

**Single-home rule:** a fact lives in exactly one section; every other mention links to it. When two sections
restate each other, one is the home and the other gets a link.

## Never

Banner status files (`IMPLEMENTATION_COMPLETE.md`, `RELEASE_READY.md`) · internal audit scaffolding in a
public document · a heading with nothing under it · a TOC that no longer matches the headings · raw `<style>`
or `<script>` (stripped everywhere) · a relative link in a package README.

## Related skills

`aoneahsan-cccs-npm-package-readme` (the section order + emoji map) · `aoneahsan-cccs-copywriting` (the prose
inside these structures) · `aoneahsan-cccs-documentation` (the brevity budget and fixed paths) ·
`aoneahsan-cccs-docusaurus` (docs-site front matter and admonitions).

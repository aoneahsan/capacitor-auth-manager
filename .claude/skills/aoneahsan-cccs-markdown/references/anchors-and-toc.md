# The anchor contract and the table of contents

Applies to **public** markdown only — package `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, public-repo root
docs, docs-site pages. Internal files (`CLAUDE.md`, `AGENTS.md`, `rules/`, a project's `docs/**`) skip this
and keep every other rule.

## The form

```markdown
<a id="quick-start"></a>
## 🚀 Quick Start&nbsp;[#](#quick-start)
```

Three parts, each doing a distinct job:

| Part | Job |
|---|---|
| `<a id="quick-start"></a>` on its own line | Guarantees the fragment exists. Never depends on a renderer's slugifier. |
| `&nbsp;` | Keeps the `#` from wrapping onto its own line on a narrow viewport. |
| `[#](#quick-start)` | What the reader clicks to copy a link straight to this section. |

**The slug is kebab-case of the heading text with the emoji dropped.** `🚀 Quick Start` → `quick-start`;
`🚑 Recovery & Troubleshooting` → `recovery-troubleshooting`. Link to it as the bare `#quick-start` —
**never write `user-content-` yourself**; both platforms add that prefix and then resolve the bare form.

Use `id`, not `name`. `name` on `<a>` is obsolete in HTML5; both render identically today, and `id` is what
survives a future sanitiser tightening.

## Why explicit — the probe, 2026-07-25

Measured live against `npmjs.com/package/inquirer`, `github.com/SBoudrias/Inquirer.js` and
`github.com/aoneahsan/macleanup`:

| Behaviour | GitHub | npmjs.com |
|---|---|---|
| `<a id="installation">` survives sanitising | ✅ rewritten to `id="user-content-installation"` | ✅ same rewrite |
| Navigating to the bare `#installation` | ✅ scrolled 0 → 2047px | ✅ scrolled 0 → 1761px |
| `document.getElementById('installation')` | ❌ false (prefixed) | ❌ false (prefixed) |
| **Auto-generated ids on headings** | ✅ present | ❌ **absent — no heading carries an id** |

Two consequences, and they are the whole reason this contract exists:

1. **On npmjs.com, auto-slug links are dead.** npm emits no heading ids, so a README that links `#installation`
   while relying on the renderer to generate that id scrolls nowhere. Millions of package pages have this bug.
   The explicit anchor is the only thing that fixes it.
2. **Emoji headings slugify unguessably on GitHub.** `macleanup`'s `## ❓ FAQ` resolves at `#-faq` — a leading
   hyphen where the emoji was — while `#faq` fails. `## ✨ Why mac-cleanup` is `#-why-mac-cleanup`. Anyone
   hand-writing the obvious slug gets a dead link. The explicit id removes the guessing, which is what makes
   the one-emoji-per-H2 house style safe to use.

Both platforms run a client-side shim that maps a bare fragment onto the `user-content-` id, so the clean
slug is what you write and what the user sees in their address bar.

## Duplicate headings are banned

Two sections with the same name produce the same slug. The second is unreachable — every link to it lands on
the first. Two of the owner's packages ship this today: `notification-kit` and
`capacitor-biometric-authentication` each have two `## Links` sections.

The fix is never a suffixed id (`links-2` is meaningless to a reader). Rename one section to what it actually
holds — a "Links" section duplicated at the top and bottom is usually a navigation row plus a URL registry,
and those are different things with different names.

## The table of contents

Public files over roughly 100 lines carry one:

- Built from the **H2 set only.** H3s make it a wall and it stops being scannable.
- Sits **directly above the first H2**, after the header block.
- Entries link the explicit ids, in document order, with the emoji included so it reads like the page.
- **Regenerated in the same edit** that adds, removes, renames or reorders any heading. A TOC that has drifted
  is worse than no TOC — it sends readers to sections that no longer exist and quietly proves the document is
  unmaintained.

```markdown
<a id="table-of-contents"></a>
## 🧭 Table of Contents&nbsp;[#](#table-of-contents)

- [💡 Why strata-storage](#why-strata-storage)
- [✨ Features](#features)
- [📦 Installation](#installation)
- [🚀 Quick Start](#quick-start)
```

## A worked fragment

```markdown
<div align="center">
  <img src="https://raw.githubusercontent.com/aoneahsan/strata-storage/main/assets/logo.svg" alt="Strata Storage logo" width="120" />
  <h1>strata-storage</h1>
  <p><strong>One storage API across web, native and Node — no provider, no ceremony.</strong></p>
</div>

<a id="table-of-contents"></a>
## 🧭 Table of Contents&nbsp;[#](#table-of-contents)

- [💡 Why strata-storage](#why-strata-storage)
- [📦 Installation](#installation)

<a id="why-strata-storage"></a>
## 💡 Why strata-storage&nbsp;[#](#why-strata-storage)

Prose.

<a id="installation"></a>
## 📦 Installation&nbsp;[#](#installation)

Prose.
```

Note the image `src`: **absolute**, because npmjs.com renders this file outside the repo and a relative path
would 404 there.

## Verifying before you ship

```bash
# every anchor id in the file, sorted — duplicates are a bug
grep -oE '<a id="[^"]+"' README.md | sort | uniq -d      # must be empty

# every TOC target has a matching anchor
comm -23 <(grep -oE '\]\(#[a-z0-9-]+\)' README.md | tr -d '](#)' | sort -u) \
         <(grep -oE '<a id="[^"]+"' README.md | sed 's/.*"\(.*\)"/\1/' | sort -u)
```

The second command lists TOC/body links pointing at an id that does not exist. It must come back empty. Then
open the rendered page and click one anchor — the address bar should gain the fragment and the page should
jump.

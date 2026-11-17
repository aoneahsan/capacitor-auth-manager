# Renderer differences — what survives where

The same file renders in four places, and they disagree. A package README is the worst case: it is written in
a repo, rendered on GitHub, rendered *again* on npmjs.com from inside a tarball, and often re-published on a
docs site.

## Compatibility matrix

| Feature | GitHub | npmjs.com | Docusaurus | VS Code preview |
|---|---|---|---|---|
| `<a id>` / `<a name>` anchors | ✅ → `user-content-*` | ✅ → `user-content-*` | ✅ kept as-is | ✅ |
| Auto-generated heading ids | ✅ | ❌ **none** | ✅ (own slugger) | ❌ |
| Bare `#fragment` resolves | ✅ via shim | ✅ via shim | ✅ | ⚠️ partial |
| `<div align="center">` | ✅ | ✅ | ✅ | ✅ |
| `<img width="120">` | ✅ | ✅ | ✅ | ✅ |
| Relative image / link paths | ✅ | ❌ **broken** | ✅ | ✅ |
| `> [!NOTE]` alerts | ✅ styled | ✅ styled | ❌ renders as a plain quote | ❌ plain quote |
| `:::note` admonitions | ❌ literal text | ❌ literal text | ✅ styled | ❌ literal |
| ` ```mermaid ` diagrams | ✅ | ❌ code block | ✅ (plugin) | ✅ (extension) |
| Tables | ✅ | ✅ | ✅ | ✅ |
| Task lists `- [x]` | ✅ interactive | ✅ static | ✅ static | ✅ static |
| Emoji shortcodes `:rocket:` | ✅ | ❌ literal | ❌ literal | ❌ literal |
| `<details>` / `<summary>` | ✅ | ✅ | ✅ | ✅ |
| Raw `<style>` / `<script>` | ❌ stripped | ❌ stripped | ❌ stripped | ❌ stripped |
| HTML `id` on a heading itself | ❌ stripped | ❌ stripped | ✅ | ❌ |

## The rules that fall out of it

1. **Never a relative link or image in a package README.** npm renders the file outside its repository, so
   `./assets/logo.svg` 404s and `./docs/guide.md` goes nowhere. Use the raw-content absolute form:
   `https://raw.githubusercontent.com/aoneahsan/<repo>/main/assets/logo.svg` for images, and the full
   `https://github.com/...` or docs-site URL for links. Inside a repo-only document (`CONTRIBUTING.md`), relative
   is correct and preferred — it survives renames and the build checks it.
2. **Write literal Unicode emoji, never `:shortcode:`.** Only GitHub expands shortcodes; everywhere else the
   reader sees `:rocket:`.
3. **Alerts and admonitions are not interchangeable.** `> [!IMPORTANT]` for anything rendered on GitHub or
   npm; `:::warning` only inside a docs site. A file that must render in both keeps to a plain blockquote.
4. **Mermaid does not render on npm.** A diagram that matters to a package user belongs on the docs site, with
   the README linking to it — or ships as an SVG image.
5. **Put the id on an `<a>`, never on the heading element.** `## <span id="x">Title</span>` and
   `<h2 id="x">` are both stripped by GitHub and npm.

## Re-probing when a platform changes

The matrix above was measured on **2026-07-25**. If GitHub or npm changes its sanitiser, re-run this — it
takes two minutes and the whole anchor contract depends on it.

Find a published package whose README uses explicit anchors:

```bash
curl -s https://registry.npmjs.org/inquirer | python3 -c "
import json,sys,re
rd = json.load(sys.stdin).get('readme','')
print(re.findall(r'<a\s+(?:id|name)=\"([^\"]+)\"', rd)[:5])
"
```

Then load `https://www.npmjs.com/package/inquirer` in a browser and evaluate:

```js
({
  explicitAnchorsKept: [...document.querySelectorAll('#readme a[id],#readme a[name]')]
    .map(a => a.id || a.getAttribute('name')).slice(0, 5),
  headingsHaveIds: [...document.querySelectorAll('#readme h2')].some(h => h.id),
  bareFragmentResolves: (() => { const y = scrollY; location.hash = 'installation'; return scrollY !== y; })()
})
```

`headingsHaveIds: false` on npm is the finding that makes explicit anchors mandatory. If it ever flips to
`true`, the visible `[#]` permalink is still worth keeping — npm shows no hover-anchor of its own — but the
`<a id>` line could be dropped.

For the emoji-slug half, load any GitHub README with an emoji heading and check which id exists:

```js
({ withoutEmoji: !!document.getElementById('user-content-faq'),
   withLeadingHyphen: !!document.getElementById('user-content--faq') })
```

On 2026-07-25 `aoneahsan/macleanup`'s `## ❓ FAQ` gave `withoutEmoji: false`, `withLeadingHyphen: true`.

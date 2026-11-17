# Unknown-path 404s per host, and what AI engines read

How each host is made to answer a real 404, the `404.html` rules, and the AI-crawler and robots notes.

## Unknown addresses answer 404

| Host | What makes unknown paths 404 |
|---|---|
| Cloudflare Pages | A **top-level `404.html`** in the build. Without one, Pages serves `index.html` (200) for every unknown path. With one, each client route needs a file or a `_redirects` rewrite, so add a **route-coverage test** |
| GitHub Pages | `404.html` at the root (Docusaurus writes it) |
| Firebase Hosting | No catch-all rewrite over public paths; rewrite only the app's own prefixes |

`404.html` is `noindex`, with no canonical and no `og:url`, and draws the app's own not-found page.

## Search engines and AI engines

- **What AI crawlers fetch:** `/sitemap.xml` and the RSS feed (Mueller, 2026-10-01), so keep the generic file
  names.
- **llms.txt** stays an owner-approved extra, never claimed to help Google.
- **Robots policy per purpose** (search, retrieval, training), per the evidence contract.
- **Static HTML:** every public page's words are present in it (`aoneahsan-cccs-postbuild-seo-html`).

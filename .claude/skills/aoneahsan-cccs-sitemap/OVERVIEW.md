# Overview — `aoneahsan-cccs-sitemap`

D009 (2026-09-08): apply the evidence contract in `~/.claude/rules-detail/seo-aeo-ranking.md` first.
Historical numeric templates are optional editorial examples, never provider requirements.


## Purpose

Discovery, for both people and crawlers. Every project ships a browsable `/sitemap` page and a valid
`/sitemap.xml`, generated from the same source so they cannot disagree.

## What this skill does

- Specifies `/sitemap` as a genuine **discovery page**: card UI with title, description and an SVG icon per
  page, categorised, tagged with keywords, with **fuzzy search** across all of those fields, prominent links
  to the XML sitemap and feed with explanations, and a footer link.
- Specifies `/sitemap.xml`: every public route and nothing private, genuine `<lastmod>` values, priority and
  changefreq from each page's config, dynamic routes enumerated from their data source, and regeneration on
  **every build**.
- Requires `robots.txt` to carry an absolute `Sitemap:` directive.
- Requires both outputs to come from **one route registry** in the same build step as the static HTML, since
  two independently-maintained lists always drift.
- Puts the sitemap page's search state in the URL.
- Covers engine submission after current access and capability checks, plus source-led regeneration.

## When it gets invoked

- Adding or removing a public route.
- Building or auditing site navigation and discovery.
- Submitting to search engines.
- The XML sitemap has drifted from the real routes, or GSC reports sitemap errors.
- A route or published-content change, or a scheduled verification pass.

## Where it applies

Every frontend project with public pages.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-008, R-039 Phase 1) and
`_source-understanding/files/project-prompt-files.md` (the products-SEO prompt, which states the card UI and
fuzzy-search requirements more concretely than the master rule), plus
`_source-understanding/projects/ztools-seo.md` for the generator.

## Related skills

`aoneahsan-cccs-feed` (its sibling artefact) · `-postbuild-seo-html` (the generator that emits both) ·
`-react-seo` (submission and diagnosis) · `-url-state-persistence` (search state) · `-react-components`
(the card UI).

## Maintenance

Stable. The sitemap protocol does not change.

# Overview — `aoneahsan-cccs-feed`

D009 (2026-09-08): apply the evidence contract in `~/.claude/rules-detail/seo-aeo-ranking.md` first.
Historical numeric templates are optional editorial examples, never provider requirements.


## Purpose

Content syndication: a readable feed page and a valid RSS 2.0 feed, plus the blog module that gives them
something to carry. The feed is the sibling of the sitemap and shares its source and cadence.

## What this skill does

- Establishes that a feed needs real published material and scopes any blog work to the approved product
  workflow, audience needs and publishing controls, without a universal post or character count.
- Connects the blog to search discovery through useful posts, applicable visible-content schema and contextual links.
- Specifies **valid RSS 2.0**, distinguishes required elements from useful extensions, and keeps dates
  truthful when they are published.
- Requires the feed to be generated from the same posts as the sitemap, newest first, on every build.
- Requires **discovery wiring**: the `rel="alternate"` link in every page head, plus footer and sitemap links.
- Points changelog feeds at `docs/play-store/RELEASE-NOTES.md` so store, website and in-app release notes
  cannot diverge.
- Keeps feed regeneration aligned with its source and any emitted `lastBuildDate` truthful.

## When it gets invoked

- Adding a blog, changelog or news section.
- Publishing or editing a post.
- Wiring feed discovery, or auditing whether the feed is valid.
- The feed has drifted from published content.
- A scheduled feed validation for a project whose publishing cadence calls for it.

## Where it applies

Projects with approved recurring published content, changelogs or news.

## Sources

`_source-understanding/files/generic-project-rules.md` (R-008 and R-039 Phase 3),
`_source-understanding/files/project-prompt-files.md` (the 20-posts-of-2000-characters instruction), and
`_source-understanding/projects/ztools-seo.md` (the generator and escaping helpers).

## Related skills

`aoneahsan-cccs-sitemap` (shares the source and cadence) · `-postbuild-seo-html` (the generator) ·
`-react-seo` (the content layer) · `-documentation` (release notes as a single source).

## Maintenance

Stable. RSS 2.0 does not change.

---
name: aoneahsan-cccs-feed
description: 'The RSS feed pair every content project ships: a readable /feed page and a valid RSS 2.0 /feed.xml regenerated on build, plus the blog module behind them. Use when adding a blog or changelog, publishing a post, wiring feed discovery, or when the feed has drifted from the published content.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Feed

🔴 Read `~/.claude/rules-detail/seo-aeo-ranking.md` → "Evidence contract" first. It supersedes
older numerical examples and unsupported provider claims in this skill and its references.


**`/feed` for people, `/feed.xml` for machines**, generated from the same posts as the sitemap — one source,
never two lists.

## The blog comes first

A feed with nothing to syndicate is an empty file. If the project needs a blog, build a real module with
the approved publishing controls and plan posts around its audience: project introduction, features,
problems it solves, the story behind it, tutorials, and honest comparisons.

Each post contains enough original detail to complete its purpose. Use a title, description, media, lists,
quotes, or supporting facts only when they serve that post. If the blog exists, verify that its claims still
reflect the product.

This also supports search discovery through useful posts, applicable visible-content schema, and contextual
links into the product. See `aoneahsan-cccs-react-seo`.

## `/feed.xml` — valid RSS 2.0

RSS 2.0 requires channel `<title>`, `<link>` and `<description>`. Add `<language>`, a truthful
`<lastBuildDate>` and an `<atom:link rel="self">` absolute URL when the publisher and consumers use them;
the Atom self link is a useful extension rather than an RSS 2.0 validity requirement.

Each item needs at least a title or description. Add stable links, GUIDs, truthful RFC-822 publication dates,
categories and descriptions when the source has them. Escape XML correctly; CDATA is optional.

**Newest first**, and regenerated on every build.

## Discovery

```html
<link rel="alternate" type="application/rss+xml" title="Blog & Updates" href="/feed.xml">
```

In the `<head>` of every page — that is how readers and aggregators find it. Link `/feed` from the footer, and
from `/sitemap` alongside the XML sitemap.

## Changelog feeds

Where a project publishes release notes, the same feed carries them, sourced from
`docs/play-store/RELEASE-NOTES.md` so the store listing, the website changelog and the in-app what's-new never
disagree.

## Freshness

Regenerate when published source material changes. If emitted, `<lastBuildDate>` must be genuine. Record
the last verified state according to the project's maintenance cadence.

For the RSS format, generation and validation, read `references/formats.md`.

## Related skills

`aoneahsan-cccs-sitemap` (its sibling artefact, from the same registry) · `-postbuild-seo-html` (the generator)
· `-seo-content-writing` (each item's title and description come from the page's content record, never retyped)
· `-search-indexing` · `-react-seo`.

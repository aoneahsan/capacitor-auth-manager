---
name: aoneahsan-cccs-sitemap
description: 'The sitemap pair every frontend ships: a /sitemap page (cards, icons, tags, typo-tolerant search) and a /sitemap.xml with a truthful lastmod on every URL, real 404s, robots Sitemap lines and app + docs hosts; plus the Search Console "Couldn''t fetch" runbook. Use when adding public routes, auditing discovery, submitting to search engines, or when a sitemap drifts or is reported unreadable.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# Sitemap

🔴 Read `~/.claude/rules-detail/seo-aeo-ranking.md` → "Evidence contract" first. It supersedes
older numerical examples and unsupported provider claims in this skill and its references.

**Every frontend project ships both**: `/sitemap` for people, `/sitemap.xml` for machines. They are different
artefacts with different jobs, and shipping only the XML misses the point. A docs site is a frontend too.

## `/sitemap.xml` — the contract (each line is checked, never assumed)

- **Every public, indexable route and nothing else**, regenerated on every build from the app's own route
  registry; dynamic routes enumerated from their data source at build time. Admin, auth (login, register),
  dashboard, account, search-results and other utility
  pages stay out; they are also `Disallow`ed in `robots.txt`.
- **Every listed URL answers 200 directly** (no redirect), is absolute on the same host, names **itself** as
  canonical, and carries no `noindex`. A URL that fails any of these does not belong in the file.
- 🔴 **A truthful `<lastmod>` on every URL: the day the page's words last changed.** Never the build date, never
  today's date stamped everywhere. Keep it with a **words-fingerprint ledger** the build checks
  (`references/formats.md`): a changed page with a stale date fails the build. Omit lastmod only for a URL
  whose date genuinely cannot be known, and never invent one.
- **No `<changefreq>` or `<priority>`**: Google ignores both. Add them only for a named consumer that reads them.
- **Served as the file**: HTTP 200, `application/xml` (or `text/xml`), UTF-8 with no BOM, XML-escaped, not behind
  a login, bot challenge or WAF rule. 🔴 **Never swallowed by a single-page-app fallback**: a host that answers
  `/sitemap.xml` with `index.html` is the classic real failure.
- **`robots.txt` carries an absolute `Sitemap:` line**, and does not disallow the sitemap. A sibling host's
  sitemap (the docs site's) may be listed too: Google accepts a sitemap URL on another host.
- **50,000 URLs and 50 MB uncompressed per file**; beyond that, a sitemap index nested one level.

## 🔴 Unknown addresses answer 404

A sitemap is only as clean as the host around it. An unknown path that answers 200 with the home page is a
soft 404 and a duplicate home page.

Cloudflare Pages needs a top-level `404.html` (plus a route-coverage test), GitHub Pages a root `404.html`,
Firebase no catch-all rewrite over public paths. Read `references/hosts-and-ai-engines.md` when configuring a
host or a `404.html`.

## `/sitemap` — a discovery page, not a link dump

The owner's reason: *"so end user can easy and fully find everything that our app has to offer."*

Categorised cards (title, description, SVG icon, tags, hidden keywords), typo-tolerant search, links to
`/sitemap.xml` and `/feed.xml` at the top, footer-linked, prerendered with real `<a href>` links, and a card for
a sibling docs site. Read `references/formats.md` → *The /sitemap discovery page checklist* when building or
auditing the page.

Search state belongs in the URL (`?q=`). See `aoneahsan-cccs-url-state-persistence`.

## One source, both outputs

Generate both from the same route registry, in the same build step that produces the static HTML. Two
independent lists guarantee they disagree eventually. See `aoneahsan-cccs-postbuild-seo-html`.

## More than one host (app + docs)

Each host keeps its own `sitemap.xml` and `robots.txt`. Cross-link the hosts: the footer, a `/sitemap` card, a
`## Docs` section in `llms.txt`, and the docs sitemap's line in the app's `robots.txt`. A brand-new host has
little crawl demand, and links from the established host are what raise it.

## Search engines and AI engines

AI crawlers fetch `/sitemap.xml` and the RSS feed, so keep the generic names; `llms.txt` is an owner-approved
extra; robots policy is per purpose. Read `references/hosts-and-ai-engines.md` when writing `robots.txt` or
`llms.txt`.

## Verify, then submit

- **Build:** the contract tests in `references/verification.md` (ledger, route coverage, sitemap and robots shape).
- **After every deploy:** the live audit there, which checks every `<loc>`, the robots line and an unknown path's
  404.
- **Submission:** to Google Search Console (a Domain property covers every subdomain), Bing Webmaster Tools
  (import from GSC) and Yandex Webmaster, plus IndexNow for changed URLs. The Sitemaps report is also the entry
  point for diagnosing indexing (`aoneahsan-cccs-react-seo`).
- 🔴 **"Couldn't fetch" or "Sitemap could not be read"** follows `references/couldnt-fetch.md`. Once the live audit
  passes, the status is Google's crawl demand or host load. Resubmitting, renaming the file or the retired ping
  endpoint changes nothing. The owner's URL Inspection live test is the proof.

## Freshness

Regenerate in the same change that adds, removes or meaningfully changes a public route. Verification follows
the project's monitoring cadence and recorded evidence; an elapsed interval alone does not justify changing
page dates or `<lastmod>`. "Re-emitted every build" means regenerated from the truthful dates, never bumped.

For the XML format, the ledger, the matcher and generation, read `references/formats.md`.

## Related skills

- `aoneahsan-cccs-feed`: the sibling artefact.
- `-postbuild-seo-html`: the generator that emits both.
- `-search-indexing`: submitting it, and why resubmitting changes nothing on its own.
- `-react-seo`: the funnel.
- `-seo-content-writing`: the keywords and descriptions the page's search reads.
- `-url-state-persistence`.
- `-docusaurus`: a docs site's sitemap options and its `/sitemap`, `/feed` and `/feed.xml`.

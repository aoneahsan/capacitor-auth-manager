# Checklist — search, AI answers, trust, conversion (lane: `aoneahsan-ccca-audit-discoverability`)

IDs: **D01–D26 · TRUST-01…06**. The default priority sits beside each check; the actual priority follows reach and
impact. 🔴 Private app routes are not SEO failures. Never make them indexable.

## Technical SEO and indexing

The deep, per-surface version of D01–D17 is `/search-audit`: the SA-P01…P19 + AI-01…09 catalogue and
calibrated probes in `aoneahsan-cccs-search-audit/references/issue-catalogue.md`. When a run of that command
exists for this project, cite its report rather than re-probing. D12 policy: the owner allows all AI bots on
public pages (2026-10-27).

| ID / P | Test | Acceptance | False-positive guard |
|---|---|---|---|
| D01 P1 | Route matrix of intended indexable templates: status, raw-HTML text, crawler access, WAF/CDN challenges | Public samples return 200 with real content | A 200 alone is not indexability |
| D02 P1 | `robots.txt`, meta robots, `X-Robots-Tag`, env flags vs intent; a `Sitemap:` line | No accidental production exclusion | robots.txt is not privacy, and a blocked page hides its own noindex |
| D03 P1–P2 | Canonicals, host/protocol variants, trailing slash, tracking params, duplicate routes | Each listed URL is self-canonical; variants 301 to it | Canonical is a hint; never canonicalise distinct pages to home |
| D04 P2 | `/sitemap` page + `/sitemap.xml`, `/feed` + `/feed.xml` (`project-config.md`): parse, every URL 200/indexable/self-canonical, truthful `<lastmod>`, footer links | All hold; ≤ 50k URLs per file (`aoneahsan-cccs-sitemap`, `-feed`) | Inclusion is not indexing; never bump lastmod cosmetically |
| D05 P1–P2 | Raw HTML vs rendered DOM: title, description, H1, main copy, links, canonical, the noscript crawler body (`aoneahsan-cccs-postbuild-seo-html`) | Critical content present in the raw HTML of prerendered routes | Google renders JS; other consumers may not |
| D06 P2 | hreflang only when real locales exist | Reciprocal and self-referencing | Single-locale products: NA |
| D07 P2 | JSON-LD per template: parse, and compare every claim with the visible content (price, rating, org identity) | Valid and truthful | 🔴 No fake ratings, FAQ or reviews |
| D08 P1–P2 | Search Console / Bing evidence (URL inspection, coverage, manual actions) when access exists | Indexed snapshot vs live test noted with date | No access → BLOCKED, never FAIL (owner-only property access) |

## Performance and access for crawlers

| ID / P | Test | Acceptance |
|---|---|---|
| D09 P1–P2 | Core Web Vitals on public templates (shares the OPS-01 evidence; do not re-run) | See OPS-01 |
| D10 P1–P2 | Accessibility of public templates (shares A11Y evidence) | See A11Y |

## AI search, AEO, GEO — eligibility, not mythology

| ID / P | Test | Acceptance |
|---|---|---|
| D11 P1–P2 | AI Overviews/AI Mode eligibility = ordinary indexability + snippet eligibility + helpful, answer-first content (`aoneahsan-cccs-react-aeo`) | Key questions are answered in the first sentence under a question heading on an indexable page |
| D12 policy | Bot matrix in robots.txt: OAI-SearchBot / ChatGPT-User / GPTBot, PerplexityBot, Google-Extended, ClaudeBot, Bingbot; the owner's chosen policy | Search/retrieval bots allowed unless the owner decided otherwise; a training choice is preserved. Changing it is a policy decision |
| D13 P3 | `llms.txt` (and `pricing.md` when plans exist): links valid, consistent with docs, no secrets | Present and current. Absent = P3, never P1 |
| D14 P2 | Citation monitoring plan (Bing AI Performance when access exists) | A measurement plan or BLOCKED; never invented results |
| D15 opt | IndexNow on publish where the host supports it (`aoneahsan-cccs-search-indexing`) | Prepared and tested. 🔴 No submission during the audit unless the run is shipping that change |

## Content, previews, stores, conversion

| ID / P | Test | Acceptance |
|---|---|---|
| D16 P2 | Pages mapped to user tasks; accuracy, originality, update dates, support paths; the per-page content contract (`aoneahsan-cccs-seo-content-writing`) | Each important claim is backed; no thin template pages |
| D17 P2 | Open Graph + Twitter tags on shareable templates; the image loads (200, right size), no placeholder host | Correct title/image/url per sample |
| D18 P2 cond. | ASO: store title ≤ 30, short and full description, screenshots match the shipped UI, privacy/support URLs | Factual; banned words absent (`~/.claude/policy/`). Console edits owner-only |
| D19 P1–P2 | Conversion events: one analytics service, the event registry, success vs attempt, no PII, consent respected (`aoneahsan-cccs-analytics`) | Synthetic journey emits exactly the expected events |
| D20 P1 | Target identity: report/email URL vs the confirmed origin | A mismatched report is quarantined, never applied |
| D21 P1 | Redirects: no loops/chains, no blanket unknown → home, OAuth and checkout callbacks intact | Every intended move is a single 301 |
| D22 P2 | Unique titles/descriptions per template; descriptive internal links; orphan pages | No duplicates on samples; key pages linked from navigation/footer |
| D23 P2 | Entity consistency: product name, URLs and links across site, docs, store, npm, GitHub, portfolio and `project-live-urls.json` (`portfolio-and-social.md`) | Identical. 🔴 Never change a published identifier |
| D24 P2 | Competitor feature matrix → `references/competitive-research.md` | Sourced and dated |
| D25 P2 | Pricing and packaging clarity (shares PAY-03) | An anonymous visitor can find the plans, limits and price from navigation |
| D26 P2 | Positioning: can a first-time visitor state audience, problem, outcome, differentiator, price and next step from the first screen? | Yes, from shipped copy. Copy changes go through the dummy + story system |

## TRUST — credibility without fabrication

| ID | Test | Acceptance |
|---|---|---|
| TRUST-01 | About / contact / support paths in the footer; the product speaks as **"the {Product} team"**, never one person (`storytelling-content.md`) | Present and truthful; no private address or invented company facts |
| TRUST-02 | Social proof: only real, permissioned testimonials, logos and numbers | None fabricated. When none exist, use demos, the changelog, docs and transparency instead |
| TRUST-03 | Objections answered (data handling, export/deletion, platforms, limits, support, pricing) in FAQ or context | Answers match tested behaviour |
| TRUST-04 | Claims ledger: every superlative or security, medical or legal claim vs evidence (e.g. "end-to-end encrypted", "HIPAA") | Unsupported claims removed or narrowed (P1 when a claim is false) |
| TRUST-05 | Legal surfaces: the first-visit bar (one sentence, Okay, once, 10 s, never a modal); Privacy and Terms carry NO REFUNDS (`legal-notice.md`, `payment-copy.md`) | Matches |
| TRUST-06 | Changelog/docs freshness: the docs site describes shipped features and its domain follows the deployed domain (`docs-sites.md`) | Current, one page per shipped feature |

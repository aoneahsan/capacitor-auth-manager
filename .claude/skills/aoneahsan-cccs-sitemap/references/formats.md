# Sitemap formats

## XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-07-20</lastmod>
  </url>
  <url>
    <loc>https://example.com/tools/csv-formatter</loc>
    <lastmod>2026-07-18</lastmod>
  </url>
</urlset>
```

No `<changefreq>` or `<priority>`: Google ignores both (Mueller, Search Off the Record #114, 2026-10-01). Add them
only when a named consumer reads them.

**Limits:** 50,000 URLs and 50 MB uncompressed per file, even when served gzipped. Beyond that, split and add a
sitemap index, nested one level only.

`<loc>` must be absolute, XML-escaped, and match the canonical exactly: protocol, host and trailing slash
included. A sitemap URL that redirects to the canonical wastes the crawl.

## Generation

```ts
interface SitemapUrl {
  loc: string; lastmod?: string;
  changefreq?: 'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never';  // only for a named consumer
  priority?: number;                                                             // only for a named consumer
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const body = urls.map((u) => `  <url>
    <loc>${escapeXmlText(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${escapeXmlText(u.lastmod)}</lastmod>` : ''}${u.changefreq ? `
    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `
    <priority>${u.priority.toFixed(1)}</priority>` : ''}
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}
```

XML escaping is a separate concern from HTML escaping. `&`, `<`, `>`, `"` and `'` in a URL's query string will
produce invalid XML otherwise.

## A truthful lastmod on every URL: the words-fingerprint ledger

The law wants `<lastmod>` on every URL, and the evidence contract wants every date truthful: the day the page's
words last changed. A ledger committed beside the route registry gives both. The build fingerprints each page's
words and refuses to ship a changed page with a stale date.

```ts
// page-dates.json (committed): { "/pricing": { "updated": "2026-10-05", "words": "3f1c9a0e5b7d2c44" }, … }
import { createHash } from 'node:crypto';

/** The page's words only: markup and class changes must not move the date. */
const wordsOf = (html: string): string =>
  html.replace(/<[^>]+>/g, ' ').replace(/&[#\w]+;/g, ' ').replace(/\s+/g, ' ').trim();

const fingerprint = (html: string): string =>
  createHash('sha256').update(wordsOf(html)).digest('hex').slice(0, 16);

for (const page of builtPages) {                 // the prerendered text of each page's <main>
  const entry = ledger[page.path];
  const now = fingerprint(page.body);
  if (entry === undefined || entry.words !== now) {
    throw new Error(
      `${page.path}: its words changed. Set "${page.path}": { "updated": "<the day they changed>", ` +
        `"words": "${now}" } in page-dates.json`
    );
  }
  // a page that prints its own date ("Last updated" on a legal page) must agree with the ledger
  if (page.recordedDate !== null && page.recordedDate !== entry.updated) throw new Error(`${page.path}: …`);
}
```

- Fingerprint the page's own content (its `<main>`), never the header or footer. A footer's year would move
  every date on 1 January.
- When a ledger is first seeded, date each page from history: for each sentence of the page,
  `git log -1 --format=%cs -S'<sentence>' -- <catalogue dir>`, and take the newest. Record the command.
- A listing page (a blog index, the sitemap page) changes when the newest thing it lists changes.

## Sitemap index (beyond 50k URLs)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc><lastmod>2026-07-20</lastmod></sitemap>
  <sitemap><loc>https://example.com/sitemap-tools.xml</loc><lastmod>2026-07-20</lastmod></sitemap>
</sitemapindex>
```

## Fuzzy search on the page

```ts
import Fuse from 'fuse.js';

const fuse = useMemo(() => new Fuse(entries, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'tags', weight: 2 },
    { name: 'keywords', weight: 1 },
  ],
  threshold: 0.35,        // lower = stricter; 0.35 tolerates typos without returning noise
  ignoreLocation: true,   // match anywhere in the field, not just near the start
}), [entries]);

const results = query ? fuse.search(query).map((r) => r.item) : entries;
```

`ignoreLocation: true` matters. By default Fuse weights matches near the start of a string, which makes
mid-description matches score badly.

**For a short list (a few dozen cards), a dependency-free matcher is lighter and enough.** Every query term must
match some word of the entry by substring, by prefix, or within one edit (two from eight letters):

```ts
/** Edit distance with swapped neighbours as one edit (optimal string alignment), stopping once past `max`. */
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let before: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j], before[j - 2] + 1);
      }
    }
    if (Math.min(...row) > max) return false;
    before = prev;
    prev = row;
  }
  return prev[b.length] <= max;
}

export function matches(haystack: string, terms: readonly string[]): boolean {
  const text = haystack.toLowerCase();
  const words = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return terms.every((term) => {
    if (text.includes(term)) return true;
    if (term.length < 4) return false;
    const max = term.length >= 8 ? 2 : 1;
    return words.some((word) => {
      for (let length = Math.max(1, term.length - max); length <= term.length + max; length++) {
        if (within(term, word.slice(0, length), max)) return true;
      }
      return false;
    });
  });
}
```

Checked on 2026-10-12: "auctoin", "auctoins", "pasuing", "bulding", "permision" and "notifcations" all match their
page, while "xyzw" and "zzzzzzzz" match nothing.

Comparing a term to a word's prefixes of about its own length lets "auctoin" (one swap) and "auctoins" find
"auctions". Unit-test it: it is pure logic whose wrongness is easy to miss.

## Entry model

```ts
interface SitemapEntry {
  path: string; title: string; description: string;
  category: string; icon: ComponentType;   // SVG component, not a raster path
  tags: string[]; keywords: string[];       // tags shown as chips; keywords searched, not shown
}
```

## Validation

```bash
curl -s https://example.com/sitemap.xml | head -20
curl -s https://example.com/robots.txt | grep -i sitemap        # absolute URL
python3 -c "import xml.dom.minidom,sys,urllib.request; xml.dom.minidom.parse(urllib.request.urlopen('https://example.com/sitemap.xml')); print('valid XML')"
```

Then run the full live audit in `verification.md` (every `<loc>`, the robots line, an unknown path's 404).
Then: GSC → Sitemaps → status **Success**, and watch the discovered-URL count match your route count.

## Common failures

| Symptom | Cause |
|---|---|
| GSC "Couldn't fetch" / "Sitemap could not be read" with the live audit green | Google's side: low crawl demand (common on a new host) or host load. Follow `couldnt-fetch.md` |
| GSC "Couldn't fetch" with the live audit red | Ours: robots.txt blocks it or fails (5xx), the URL 404s in production but exists locally, a redirect, a bot challenge, or the host's SPA fallback answers it with HTML. `couldnt-fetch.md` orders the checks |
| `/sitemap.xml` comes back `text/html` | The SPA fallback or a rewrite answers before the file. The file must exist in the deployed output |
| Unknown paths answer 200 with the home page | No top-level `404.html` on Cloudflare Pages, or a catch-all rewrite. Soft 404s and duplicates follow |
| Discovered count far below route count | Private routes filtered too aggressively, or the generator ran before routes were registered |
| URLs in the sitemap redirect | The sitemap holds the pre-redirect URL. List the canonical target |
| `lastmod` identical everywhere | Check whether dates reflect genuine changes; identical dates alone do not prove a defect. A build date stamped on every URL is the defect: use the ledger |
| `lastmod` missing on some URLs | Pages with no recorded date. Seed them in the ledger from history |

## The /sitemap discovery page checklist (moved from SKILL.md)

- **Card UI**, one card per public page: title, short description, a descriptive **SVG** icon.
- **Categorised**, so the shape of the product is visible at a glance.
- **Keywords and tags** on each entry: tags visible, keywords as hidden search terms.
- **Fuzzy search** across title, description, tags and keywords, typo-tolerant. Fuse.js or equivalent (free and
  open source), or a small dependency-free matcher for a short list (`references/formats.md`).
- **Links to `/sitemap.xml` and `/feed.xml` at the top**, each with a one-line explanation of what it is.
- **Linked from the footer**, and listed in `/sitemap.xml` itself.
- **Prerendered with real `<a href>` links**, so the whole list reads with no script: crawlers and AI agents
  use it as the site's hub.
- Includes the app's public entry pages (start a game, leaderboards), plus a card for a **sibling docs site**.

# Sitemap verification: build contracts and the live audit

## Build contracts: tests that fail before a bad sitemap ships

These are the pre-approved kinds (a contract over an approved artefact, pure logic whose wrongness is invisible,
one smoke test per generator). Show each one failing on a planted defect once.

| Contract | Fails when |
|---|---|
| **Sitemap shape** | the XML is not well-formed; a `<loc>` is relative, on another host, duplicated, or under a `Disallow` prefix; a URL lacks `<lastmod>`; `<changefreq>` or `<priority>` appears without a named consumer |
| **Ledger** (`formats.md`) | a page's words fingerprint differs from its ledger entry; a page is missing from the ledger; a page that prints its own date disagrees with the ledger |
| **Route coverage** (hosts that 404 unknown paths) | a client route is neither a prerendered page, nor under a prefix the host rewrites to the app shell, nor on a reasoned allowlist. Without it, the new `404.html` turns that route into a crawler-visible 404 |
| **robots.txt** | no absolute `Sitemap:` line for the host's own sitemap (and the sibling host's, where there is one) |
| **404 file** | `404.html` is missing, is not `noindex`, or carries a canonical or `og:url` |

## The live audit: after every deploy, and first in any "Couldn't fetch" triage

1. Save the code below as a scratch file **outside the repository** (for example `$TMPDIR/audit.mjs`). Projects
   carry no script files.
2. Write it with the editor tool, never a heredoc: a heredoc can collapse the regex backslashes and leave an
   instrument that matches nothing.
3. Run `node audit.mjs https://example.com/sitemap.xml [https://docs.example.com/sitemap.xml]` on Node 20 or later.

It fetches as Googlebot smartphone, follows no redirect, and checks:
- the sitemap's status, type, BOM, declaration and `urlset`;
- the robots line;
- for every `<loc>`: 200, same host, exactly one self-canonical, no `noindex` in meta or `X-Robots-Tag`, a valid
  past `lastmod`, no changefreq or priority, a title, a description and an `<h1>`;
- that an unknown path answers 404.

It reads unquoted attributes correctly, which matters because minified HTML (Docusaurus) drops the quotes. Exit
code 1 on any failure.

```js
// Live sitemap audit: node audit.mjs <sitemap-url> [more sitemap urls…]. Exit 1 on any failure.
const UA =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const get = (url) => fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual' });

/** An attribute's value in one tag, quoted or not (minified HTML drops the quotes). */
const attr = (tag, name) => {
  const pattern = new RegExp(String.raw`(?:^|\s)${name}\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))`, 'i');
  const m = tag.match(pattern);
  if (!m) return undefined;
  if (m[1] !== undefined) return m[1];
  if (m[2] !== undefined) return m[2];
  // an unquoted value ends at whitespace or ">", and a "/" before them belongs to it (HTML's own parse)
  return m[3];
};
/** Every opening tag of one element name. */
const tagsOf = (html, name) => [...html.matchAll(new RegExp(String.raw`<${name}\b[^>]*>`, 'gi'))].map((m) => m[0]);
/** Whether a tag's attribute equals a value, quoted or not. */
const has = (tag, name, value) => (attr(tag, name) ?? '').toLowerCase().split(/\s+/).includes(value);

let failures = 0;
const fail = (what) => {
  failures += 1;
  console.log(`FAIL ${what}`);
};

for (const sitemap of process.argv.slice(2)) {
  const origin = new URL(sitemap).origin;
  const res = await get(sitemap);
  const xml = await res.text();
  const type = res.headers.get('content-type') ?? '';
  console.log(`== ${sitemap}: ${res.status} ${type} ${xml.length} B`);
  if (res.status !== 200) fail(`${sitemap} answers ${res.status} ${res.headers.get('location') ?? ''}`);
  if (!/xml/i.test(type)) fail(`${sitemap} is served as ${type || 'no type'}`);
  if (xml.charCodeAt(0) === 0xfeff) fail(`${sitemap} starts with a BOM`);
  if (!/^\s*<\?xml/.test(xml)) fail(`${sitemap} has no XML declaration first`);
  if (/<sitemapindex[\s>]/.test(xml)) {
    console.log('   a sitemap index: audit each child sitemap by name');
    continue;
  }
  if (!/<urlset[\s>]/.test(xml)) fail(`${sitemap} has no <urlset>`);

  const robots = await get(`${origin}/robots.txt`);
  const robotsText = robots.status === 200 ? await robots.text() : '';
  if (robots.status !== 200) fail(`${origin}/robots.txt answers ${robots.status}`);
  const lines = robotsText
    .split(/\r?\n/)
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.replace(/^sitemap:\s*/i, '').trim());
  if (!lines.includes(sitemap)) fail(`robots.txt has no "Sitemap: ${sitemap}" line (it has: ${lines.join(', ') || 'none'})`);

  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1].replace(/&amp;/g, '&'),
    lastmod: m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1],
    extra: /<(changefreq|priority)>/.test(m[1]),
  }));
  const seen = new Set();
  for (const { loc, lastmod, extra } of urls) {
    if (!loc) {
      fail('a <url> without <loc>');
      continue;
    }
    const bad = [];
    if (seen.has(loc)) bad.push('listed twice');
    seen.add(loc);
    if (new URL(loc).origin !== origin) bad.push('on another host');
    const page = await get(loc);
    const html = page.status === 200 ? await page.text() : '';
    if (page.status !== 200) bad.push(`answers ${page.status} ${page.headers.get('location') ?? ''}`.trim());
    const canon = tagsOf(html, 'link')
      .filter((tag) => has(tag, 'rel', 'canonical'))
      .map((tag) => attr(tag, 'href'));
    if (page.status === 200 && (canon.length !== 1 || canon[0] !== loc)) bad.push(`canonical ${canon.join(' | ') || 'none'}`);
    const robotsMeta = tagsOf(html, 'meta')
      .filter((tag) => has(tag, 'name', 'robots') || has(tag, 'name', 'googlebot'))
      .map((tag) => attr(tag, 'content'))
      .join(',');
    if (/noindex/i.test(`${robotsMeta},${page.headers.get('x-robots-tag') ?? ''}`)) bad.push('noindex');
    if (!lastmod) bad.push('no lastmod');
    else if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(lastmod) || new Date(lastmod) > new Date()) {
      bad.push(`lastmod ${lastmod}`);
    }
    if (extra) bad.push('changefreq/priority present');
    if (page.status === 200) {
      const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim();
      const description = tagsOf(html, 'meta').find((tag) => has(tag, 'name', 'description'));
      const h1 = (html.match(/<h1\b/gi) ?? []).length;
      if (!title) bad.push('no <title>');
      if (!description || !attr(description, 'content')) bad.push('no description');
      if (h1 === 0) bad.push('no <h1>');
    }
    if (bad.length) fail(`${loc}: ${bad.join('; ')}`);
    else console.log(`ok   ${loc} (${lastmod})`);
  }
  const ghost = await get(`${origin}/no-such-page-${Date.now().toString(36)}`);
  if (ghost.status !== 404) fail(`${origin}: an unknown path answers ${ghost.status}, not 404`);
  else console.log(`ok   ${origin}: an unknown path answers 404`);
  console.log(`   ${urls.length} URLs listed`);
}
console.log(failures ? `AUDIT FAILED: ${failures}` : 'AUDIT PASSED');
process.exitCode = failures ? 1 : 0;
```

**Its first run (2026-10-12, Rent Party):**
- Run 1 matched nothing at all, because a heredoc had collapsed the backslashes. Run 2 handled an unquoted
  canonical ending in `/` wrongly.
- Once corrected, it found exactly the known defects:
  - the game host's unknown path answering 200;
  - lastmod missing on 6 game URLs and 3 docs URLs;
  - `/play` without a description;
  - changefreq on every docs URL;
  - the docs blog list without an `<h1>`.

Treat a new run's surprises the same way: suspect the instrument first, then the site.

## After the audit passes

- **AI crawlers:** fetch one page with each AI crawler's user agent (GPTBot, OAI-SearchBot, ClaudeBot,
  PerplexityBot) and compare the status with a browser's, against the owner's robots policy per purpose.
- **Google:** the owner's URL Inspection live test of the sitemap URL (`couldnt-fetch.md` step 8).
- **IndexNow:** submit the changed URLs (Bing, Yandex), and record the response code.
